import * as express from "express";
import * as cors from "cors";
import { createConnection } from "typeorm";
import { Request, Response } from "express";
import { Product } from "./entities/product";
import * as amqp from "amqplib/callback_api";
import config from "./config";
console.log(config);

createConnection().then((db) => {
  // get Product entity details from ecommerce_admin DB
  const productRepository = db.getMongoRepository(Product);

  // RABBITMQ Connection
  amqp.connect(config.rabbitmqUrl, (error, connection) => {
    if (error) {
      throw error;
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      channel.assertQueue("product_created", { durable: false });
      channel.assertQueue("product_updated", { durable: false });
      channel.assertQueue("product_deleted", { durable: false });

      const app = express();

      app.use(
        cors({
          origin: ["http://localhost:3000", "http://localhost:5001"],
        })
      );

      app.use(express.json());

      channel.consume(
        "product_created",
        async (msg) => {
          console.log(msg.content.toString());
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

      channel.consume("product_updated", async (msg) => {
        const eventProduct: Product = JSON.parse(msg.content.toString());
        console.log(eventProduct);

        console.log(
          "-------------------------------------before finding id ------------------------"
        );
        const product: Product = await productRepository.findOne({
          admin_id: parseInt(eventProduct.id),
        });
        console.log(
          "-------------------------------------after finding id ------------------------"
        );

        productRepository.merge(product, {
          title: eventProduct.title,
          image: eventProduct.image,
          likes: eventProduct.likes,
        });

        await productRepository.save(product);
        console.log("product updated");
      });

      app.listen(config.port, () => {
        console.log(`Connected Succesfully in port ${config.port}`);
      });
    });
  });
});
