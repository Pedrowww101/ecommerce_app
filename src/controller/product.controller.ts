import { factory } from "@/lib/factory";
import { validator } from "@/lib/validator";
import { createProductDTO } from "@/models/products.model";
import { ProductRepository } from "@/repositories/product.repository";
import { ProductService } from "@/services/product.service";

export const addProductController = factory.createHandlers(validator("json", createProductDTO), async (c) => {
    const body = c.req.valid("json")

    const productRepo = new ProductRepository(); 
    const productService = new ProductService(productRepo);

    const result = await productService.createProduct(body)

    return c.json(result, 201)
})
