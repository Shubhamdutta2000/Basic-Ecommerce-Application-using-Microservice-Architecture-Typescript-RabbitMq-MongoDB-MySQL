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

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.listen(config.port, () => {
    console.log(`Connected Succesfully in port ${config.port}`);
  });
});
