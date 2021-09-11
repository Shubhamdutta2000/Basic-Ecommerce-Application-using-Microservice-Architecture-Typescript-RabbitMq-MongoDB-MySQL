import express from "express";
import cors from "cors";
import { createConnection } from "typeorm";
import { Request, Response } from "express";
import { Product } from "./entities/product";

createConnection().then((db) => {
  const productRepository = db.getRepository(Product);

  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:5001"],
    })
  );

  app.use(express.json());

  // Get list of products
  app.get("/api/products/all", async (req: Request, res: Response) => {
    const products = await productRepository.find();
    res.json(products);
  });

  // POST products
  app.post("/api/products/add", async (req: Request, res: Response) => {
    const createdProduct = await productRepository.create(req.body);
    const result = await productRepository.save(createdProduct);
    res.json(result);
  });

  app.listen(5000, () => {
    console.log("Connected Succesfully in port 5000");
  });
});
