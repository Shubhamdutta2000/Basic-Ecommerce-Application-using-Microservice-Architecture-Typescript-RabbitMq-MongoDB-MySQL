import * as express from "express";
import { Request, Response } from "express";
import * as cors from "cors";
//For DB
import { createConnection } from "typeorm";
import { Product } from "./entities/product";
//For eventQueue
import * as amqp from "amqplib/callback_api";

import config from "./config";

createConnection().then((db) => {
  //db details
  const productRepository = db.getRepository(Product);

  //Rabbitmq connection
  amqp.connect(config.rabbitmqUrl, (error, connection) => {
    if (error) throw error;

    connection.createChannel((error1, channel) => {
      if (error1) throw error1;

      // Consuming event
      channel.assertQueue("product_liked", { durable: true });

      const app = express();
      app.use(cors());
      app.use(express.json());

      //Consumer of product_liked
      channel.consume("product_liked", async (msg) => {
        const eventProduct = JSON.parse(msg.content.toString());
        const product = await productRepository.findOne({
          id: eventProduct.admin_id,
        });
        product.likes++;
        await productRepository.save(product);
        console.log("product_liked");
      });

      //endpoints

      //Get all products
      app.get("/api/products/all", async (req: Request, res: Response) => {
        const products = await productRepository.find();
        res.json(products);
      });

      //Create a single product to db
      app.post("/api/products/add", async (req: Request, res: Response) => {
        const product = await productRepository.create(req.body);
        const result = await productRepository.save(product);
        channel.sendToQueue(
          "product_created",
          Buffer.from(JSON.stringify(result))
        );
        return res.send(result);
      });

      //Get single product from list of product
      app.get("/api/products/:id", async (req: Request, res: Response) => {
        const product = await productRepository.findOne(req.params.id);
        return res.send(product);
      });

      //Update a single product from list of product
      app.put("/api/products/:id", async (req: Request, res: Response) => {
        const product = await productRepository.findOne(req.params.id);
        productRepository.merge(product, req.body);
        const result = await productRepository.save(product);
        channel.sendToQueue(
          "product_updated",
          Buffer.from(JSON.stringify(result))
        );
        return res.send(result);
      });

      //Delete a single product
      app.delete("/api/products/:id", async (req: Request, res: Response) => {
        const result = await productRepository.delete(req.params.id);
        channel.sendToQueue("product_deleted", Buffer.from(req.params.id));
        return res.send(result);
      });

      //Request where we like the product

      //server at PORT 5001
      app.listen(config.port, () => {
        console.log(`Server running on port ${config.port} `);
      });
      //Existing rabbitMQ server on closing
      process.on("beforeExit", () => {
        console.log("Closing");
        connection.close();
      });
    });
  });
});
