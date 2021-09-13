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
    return res.json(result);
  });

  // get particular product
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const product = await productRepository.findOne(req.params.id);
    return res.send(product);
  });

  // UPDATE product
  app.put("/api/products/:id", async (req: Request, res: Response) => {
    productRepository.update(req.params.id, req.body);
    const updatedContact = await productRepository.findOne(req.params.id);
    return res.send(updatedContact);
  });

  // DELETE product
  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    const result = await productRepository.delete(req.params.id);
    return res.send(result);
  });

  // like a product from main-service
  app.post("/api/products/:id/like", async (req: Request, res: Response) => {
    const product = await productRepository.findOneOrFail(req.params.id);
    product.likes++;
    const result = await productRepository.save(product);
    return res.send(result);
  });

  app.listen(5000, () => {
    console.log("Connected Succesfully in port 5000");
  });
});
