import { Http } from "@/lib/core/api-client";
import { validateIndex } from "../contracts/api-contract";
import { toApiReadList, toApiCreate } from "../mappers/wishlist-mapper";
import type { WishlistIndex } from "../types/wishlist-read";
import { WishlistFormValues } from "../contracts/api-schema";

interface ApiWrapper<T> {
  data: T;
}

export const WishlistService = {
  /** GET /wishlist */
  async index(): Promise<WishlistIndex[]> {
    const res = await Http.get<ApiWrapper<unknown>>("/wishlist");
    const validated = validateIndex(res.data);
    return toApiReadList(validated);
  },

  /** POST /wishlist — payload: { produk_item_id } via mapper */
  async create(form: WishlistFormValues['Create']): Promise<void> {
    const payload = toApiCreate(form);
    await Http.post("/wishlist", payload);
  },

  /** DELETE /wishlist/{produkItemId} */
  async delete(produkItemId: number): Promise<void> {
    await Http.delete(`/wishlist/${produkItemId}`);
  },
};
