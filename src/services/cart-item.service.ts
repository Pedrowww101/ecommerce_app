import { BadRequest } from "../common/errors/BadRequestError.js";
import { ApiResponse } from "../common/responses/ApiResponse.js";
import {
   CartItemsResponseDTO,
   InsertCartItemsDTO,
   InsertCartItemsModel,
} from "../database/models/cart-items.model.js";
import { CartItemsRepository } from "../database/repositories/cart-item.repository.js";
import { CartRepository } from "../database/repositories/cart.repository.js";
import { ProductsRepository } from "../database/repositories/product.repository.js";

export class CartItemService {
   constructor(
      private cartItemRepo: CartItemsRepository,
      private cartRepo: CartRepository,
      private productRepo: ProductsRepository
   ) {}

   async addToCart(
      userId: string,
      dto: InsertCartItemsDTO
   ): Promise<ApiResponse<CartItemsResponseDTO>> {
      const { productId, quantity } = dto;

      const product = await this.productRepo.getById(productId);

      if (!product) throw new BadRequest("No product found.");

      if (quantity <= 0 || quantity > product.stock) {
         const stockError = new BadRequest(
            `Invalid quantity or insufficient stock.`
         );
         return {
            success: false,
            error: stockError,
            message: `Invalid quantity. Max available: ${product.stock}.`,
         };
      }

      let cart = await this.cartRepo.getByUserId(userId);

      if (!cart) {
         cart = await this.cartRepo.create(userId);
      }

      const insertCartItem: InsertCartItemsModel = {
         cartId: cart.id,
         productId,
         price: Number(product.price),
         quantity,
      };

      const updatedCartItem = await this.cartItemRepo.upsert(insertCartItem); // update/insert product to cart

      const responseData: CartItemsResponseDTO = {
         ...updatedCartItem,
         price: Number(updatedCartItem.price),
      };
      return {
         success: true,
         data: responseData,
         message: "Added to cart successfully",
      };
   }
}
