import { WishlistFormValues } from "../contracts/api-schema";
import type { WishlistApiResponse, WishlistApiCreate } from "../contracts/api-contract";
import { WishlistApiField } from "../contracts/api-field";
import type { WishlistShow, WishlistIndex } from "../types/wishlist-read";

export const toApiRead = (api: WishlistApiResponse): WishlistShow => {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    image: api.image,
    imageUrl: api.image_url,
    categoryId: api.category_id,
    categoryName: api.category_name,
    price: api.price,
    stock: api.stock,
    rating: api.rating,
    reviewCount: api.review_count,
  };
}

export const toApiReadList = (api: WishlistApiResponse[]): WishlistIndex[] => {
  return api.map(toApiRead);
}

export const toApiCreate = (form: WishlistFormValues['Create']): WishlistApiCreate => {
  return {
    [WishlistApiField.PRODUK_ITEM_ID]: form.produkItemId,
  };
};