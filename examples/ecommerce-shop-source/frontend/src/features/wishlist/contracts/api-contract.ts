import { z } from "zod"

//3 export, const validate,const crud, type crud
export const Schema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  image: z.string(),
  image_url: z.string(),
  category_id: z.number(),
  category_name: z.string(),
  price: z.number(),
  stock: z.number(),
  rating: z.number(),
  review_count: z.number(),
});
export type WishlistApiResponse = z.infer<typeof Schema>
export const validateSchema = (payload: unknown): WishlistApiResponse => Schema.parse(payload)


//3 export, const validate,const crud, type crud
export const CreateSchema = z.object({
  produk_item_id: z.number(),
})
export type WishlistApiCreate = z.infer<typeof CreateSchema>
export const validateCreate = (payload: unknown): WishlistApiCreate => CreateSchema.parse(payload)

//3 export, const validate,const crud, type crud
export const WishlishttIndexSchema = z.array(Schema)
export type WishlistApiIndex = z.infer<typeof WishlishttIndexSchema>
export const validateIndex = (payload: unknown): WishlistApiIndex => WishlishttIndexSchema.parse(payload)
