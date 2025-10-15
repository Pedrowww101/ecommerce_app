import axios from "axios";
import { SelectProductModel } from "../models/products.model.js";

import dotenv from "dotenv";

dotenv.config();
export async function notifyLowStock(products: SelectProductModel[]) {
   if (!products.length) return;

   // 👇 add emoji based on severity
   const formattedProducts = products.map((p) => ({
      ...p,
      alertEmoji: p.stock < 10 ? "🔴" : "🟡",
   }));

   try {
      const res = await axios.post(process.env.N8N_WEBHOOK!, {
         message: "Low stock products detected",
         data: formattedProducts,
      });

      console.log("✅ Sent to n8n:", res.status, res.statusText);
   } catch (error: any) {
      console.error("❌ Failed to notify n8n:", error.message);
   }
}
