export interface ProductModel {
   id: string;
   name: string;
   price: string;
   stock: string;
   imageUrl: string | null;
   createdAt?: Date;
}
