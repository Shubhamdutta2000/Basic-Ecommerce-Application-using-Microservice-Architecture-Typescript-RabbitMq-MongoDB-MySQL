import * as express from "express";
import { Request, Response } from "express";
import * as cors from "cors";

import { createConnection } from "typeorm";
import { Product } from "./entity/product";

import * as amqp from "amqplib/callback_api";

import config from "./config";
import { consumers } from "stream";

createConnection().then((db) => {
  //db details
  const productRepository = db.getMongoRepository(Product);

  //Rabbitmq connection
  amqp.connect(config.rabbitmqUrl, (error, connection) => {
    if (error) throw error;

    connection.createChannel((error1, channel) => {
      if (error1) throw error1;

      //Consuming event
      channel.assertQueue("product_created", { durable: false });
      channel.assertQueue("product_updated", { durable: false });
      channel.assertQueue("product_deleted", { durable: false });

      const app = express();
      app.use(cors());
      app.use(express.json());

      //Consummers

      // Create product when admin create new product
      channel.consume(
        "product_created",
        async (msg) => {
          const eventProduct: Product = JSON.parse(msg.content.toString());
          const product = new Product();
          product.admin_id = parseInt(eventProduct.id);
          product.title = eventProduct.title;
          product.image = eventProduct.image;
          product.likes = eventProduct.likes;
          await productRepository.save(product);
          console.log("product created");
        },
        { noAck: true }
      );

      // update product when admin update product
      channel.consume(
        "product_updated",
        async (msg) => {
          const eventProduct: Product = JSON.parse(msg.content.toString());
          console.log(parseInt(eventProduct.id));

          // NOTE: typeorm doesnot support mongodb v4.0, So use mongodb v3.7.0

          const product = await productRepository.findOne({
            where: {
              admin_id: { $eq: parseInt(eventProduct.id) },
            },
          });

          productRepository.merge(product, {
            title: eventProduct.title,
            image: eventProduct.image,
            likes: eventProduct.likes,
          });

          await productRepository.save(product);
          console.log("product updated");
        },
        { noAck: true }
      );

      // Delete product when admin deletes a product
      channel.consume(
        "product_deleted",
        async (msg) => {
          const admin_id = JSON.parse(msg.content.toString());
          await productRepository.deleteOne({
            admin_id: admin_id,
          });
        },
        { noAck: true }
      );

      // routes

      // route for getting all products
      app.get("/api/products/all", async (req: Request, res: Response) => {
        const products = await productRepository.find();
        res.send(products);
      });

      // route for product like and increase like count in admin section
      app.post(
        "/api/products/:id/like",
        async (req: Request, res: Response) => {
          const product = await productRepository.findOne(req.params.id);
          product.likes++;
          await productRepository.save(product);
          channel.sendToQueue(
            "product_liked",
            Buffer.from(JSON.stringify(product))
          );
          return res.send(product);
        }
      );

      //server at PORT 5000
      const PORT = config.port;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} `);
      });
      process.on("beforeExit", () => {
        console.log("Closing");
        connection.close();
      });
    });
  });
});
