import express from "express";
import cors from "cors";
import { createConnection } from "typeorm";
import { Request, Response } from "express";
import { Product } from "./entities/product";

createConnection().then((db) => {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:5000"],
    })
  );

  app.use(express.json());

  app.listen(5001, () => {
    console.log("Connected Succesfully in port 5001");
  });
});
