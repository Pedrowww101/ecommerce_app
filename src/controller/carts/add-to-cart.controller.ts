import { insertCartItemsDTO } from "../../database/models/cart-items.model.js";
import { CartItemsRepository } from "../../database/repositories/cart-item.repository.js";
import { CartRepository } from "../../database/repositories/cart.repository.js";
import { ProductsRepository } from "../../database/repositories/product.repository.js";
import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { CartItemService } from "../../services/cart-item.service.js";

export const addToCartController = factory.createHandlers(
   validator("json", insertCartItemsDTO),
   async (c) => {
      const body = c.req.valid("json");
      const user = c.get("user");

      const productRepo = new ProductsRepository();
      const cartRepo = new CartRepository();
      const cartItemRepo = new CartItemsRepository();

      const cartItemService = new CartItemService(
         cartItemRepo,
         cartRepo,
         productRepo
      );

      const result = await cartItemService.addToCart(user!.id, body);

      return c.json(result, 201);
   }
);
