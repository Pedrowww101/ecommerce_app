import { cache } from "../utils/cache.js";
import { BadRequest } from "../common/errors/BadRequestError.js";
import { NotFound } from "../common/errors/NotFoundError.js";
import { ApiResponse } from "../common/responses/ApiResponse.js";
import {
   PaginationParams,
   PaginatedResult,
   PaginatedRepositoryResult,
   PaginationMeta,
} from "../common/utils/pagination.js";
import { GLOBAL_TTL_CACHE } from "../config/constants.js";
import {
   CartItemsResponseDTO,
   InsertCartItemsDTO,
   InsertCartItemsModel,
} from "../database/models/cart-items.model.js";
import { CartItemsRepository } from "../database/repositories/cart-item.repository.js";
import { CartRepository } from "../database/repositories/cart.repository.js";
import { ProductsRepository } from "../database/repositories/product.repository.js";
import { validatePaginationParams } from "../utils/validators.js";

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
         throw new BadRequest(
            `Invalid quantity. Maximum available stock: ${product.stock}.`
         );
      }

      let cart = await this.cartRepo.getByUserId(userId);

      if (!cart) {
         cart = await this.cartRepo.create(userId);
      }

      const insertCartItem: InsertCartItemsModel = {
         cartId: cart!.id,
         productId,
         price: Number(product.price),
         quantity,
      };

      const updatedCartItem = await this.cartItemRepo.upsert(insertCartItem); // update/insert product to cart

      const responseData: CartItemsResponseDTO = {
         id: updatedCartItem.id,
         quantity: updatedCartItem.quantity,
         price: Number(product.price),
         product: {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
         },
         cart: {
            id: cart.id,
            userId: cart.userId,
         },
      };
      return {
         success: true,
         data: responseData,
         message: "Added to cart successfully",
      };
   }

   async removeFromCart(
      userId: string,
      productId: string
   ): Promise<ApiResponse<boolean>> {
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart) throw new BadRequest("User does not have an active cart.");

      const wasDeleted = await this.cartItemRepo.removeFromCart(
         cart.id,
         productId
      );
      if (!wasDeleted) {
         throw new NotFound("Product not found in cart.");
      }

      await cache.delByPrefix(`cartItems:cart:${cart.id}`);
      return {
         success: true,
         message: "Removed from cart successfully",
      };
   }

   async updateCartItemQuantity(
      userId: string,
      productId: string,
      newQuantity: number
   ): Promise<ApiResponse<CartItemsResponseDTO>> {
      // 1. Validate the user has a cart
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart) throw new BadRequest("User does not have an active cart.");
      const cartId = cart.id;

      // 2. Validate product existence and stock
      const product = await this.productRepo.getById(productId);
      if (!product) throw new BadRequest("Product not found.");
      if (newQuantity > product.stock) {
         throw new BadRequest(
            `Insufficient stock. Max available: ${product.stock}.`
         );
      }

      // 3. Update quantity
      const updatedCartItem = await this.cartItemRepo.updateQuantity(
         cartId,
         productId,
         newQuantity
      );
      if (!updatedCartItem) {
         throw new BadRequest("Cart item not found in your cart.");
      }

      // 4. Build response DTO
      const responseData: CartItemsResponseDTO = {
         id: updatedCartItem.id,
         quantity: updatedCartItem.quantity,
         price: Number(product.price),
         product: {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
         },
         cart: {
            id: cart.id,
            userId: cart.userId,
         },
      };

      // 5. Return response
      return {
         success: true,
         data: responseData,
         message: "Cart item quantity updated successfully.",
      };
   }

   async getAll(
      params: PaginationParams
   ): Promise<ApiResponse<PaginatedResult<CartItemsResponseDTO>>> {
      const { page, limit } = params;

      // Validate pagination
      const { isValid, values, errors } = validatePaginationParams({
         page,
         limit,
      });
      if (!isValid) {
         throw new BadRequest("Invalid pagination parameters", { errors });
      }

      const cacheKey = `cartItems:page:${values.page}:limit:${values.limit}`;

      const fetcher = async (): Promise<
         PaginatedRepositoryResult<CartItemsResponseDTO>
      > => {
         return this.cartItemRepo.getAll(values);
      };

      const { items, total } = await cache.remember<
         PaginatedRepositoryResult<CartItemsResponseDTO>
      >(cacheKey, GLOBAL_TTL_CACHE, fetcher);

      const totalPages = Math.ceil(total / values.limit);

      const meta: PaginationMeta = {
         page: values.page,
         limit: values.limit,
         totalItems: total,
         totalPages,
         hasNextPage: values.page < totalPages,
         hasPrevPage: values.page > 1,
      };

      const paginatedResult: PaginatedResult<CartItemsResponseDTO> = {
         data: items,
         meta,
      };

      return {
         success: true,
         message: "Cart items retrieved successfully.",
         data: paginatedResult,
      };
   }
}
