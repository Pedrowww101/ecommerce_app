import { BadRequest } from "@/common/errors/BadRequestError.js";
import { ApiResponse } from "@/common/responses/ApiResponse.js";
import {
   CreateProductDTO,
   InsertProductModel,
   SelectProductModel,
} from "@/models/products.model.js";
import { ProductRepository } from "@/repositories/product.repository.js";

export class ProductService {
   constructor(private productRepo: ProductRepository) {}

   async createProduct(
      dto: CreateProductDTO
   ): Promise<ApiResponse<SelectProductModel>> {
      const { name, price, stock, description, imageUrl } = dto;

      if (!name || name.trim().length === 0) {
         throw new BadRequest("Name field is required.");
      }

      const existingProduct = await this.productRepo.getProductByName(name);

      if (existingProduct) {
         throw new BadRequest(`Product name ${name} already exists.`);
      }

      const productData: InsertProductModel = {
         name,
         price,
         stock,
         description,
         imageUrl,
      };

      const product = await this.productRepo.add(productData);

      return {
         success: true,
         data: product,
         message: "Product created successfully",
      };
   }
}
