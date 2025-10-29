import { Hono, Env } from "hono";
import { addToCartController } from "../../controller/carts/add-to-cart.controller.js";

const protectedCartRoutes = new Hono<Env>().post(
   "/addToCart",
   ...addToCartController
);

export default protectedCartRoutes;
