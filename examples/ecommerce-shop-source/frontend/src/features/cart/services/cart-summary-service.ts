import { Http } from "@/lib/core/api-client";
import { validateSchema } from "../contracts/api-contract";
import { toApiRead, toApiCreate, toApiUpdate } from "../mappers/cart-mapper";
import { CartShow } from "../types/cart-read";
import { CartFormValues } from "../contracts/api-schema";

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

export const CartSummaryService = {
  /** GET /keranjang — full cart dengan totals */
  async get(): Promise<CartShow | null> {
    try {
      const res = await Http.get<ApiWrapper<unknown>>("/keranjang");
      if (!res.data) return null;
      const validated = validateSchema(res.data);
      return toApiRead(validated);
    } catch {
      return null;
    }
  },

  /** POST /cart/items — form { produkItemId, qty } via CartApiField */
  async addItem(form: CartFormValues['Create']): Promise<CartShow | null> {
    const payload = toApiCreate(form);
    const res = await Http.post<ApiWrapper<unknown>>("/cart/items", payload);
    if (!res.data) return null;
    const validated = validateSchema(res.data);
    return toApiRead(validated);
  },

  /** PATCH /cart/items/:produkItemId — form { qty } via CartApiField */
  async updateItem(produkItemId: number, form: CartFormValues['Update']): Promise<CartShow | null> {
    const payload = toApiUpdate(form);
    const res = await Http.patch<ApiWrapper<unknown>>(`/cart/items/${produkItemId}`, payload);
    if (!res.data) return null;
    const validated = validateSchema(res.data);
    return toApiRead(validated);
  },

  /** DELETE /cart/items/:produkItemId */
  async removeItem(produkItemId: number): Promise<CartShow | null> {
    const res = await Http.delete<ApiWrapper<unknown>>(`/cart/items/${produkItemId}`);
    if (!res?.data) return null;
    try {
      const validated = validateSchema(res.data);
      return toApiRead(validated);
    } catch {
      return null;
    }
  },

  /** POST /cart/promo — apply promo code */
  async applyPromo(code: string): Promise<CartShow | null> {
    const res = await Http.post<ApiWrapper<unknown>>("/cart/promo", { code });
    if (!res.data) return null;
    const validated = validateSchema(res.data);
    return toApiRead(validated);
  },

  /** DELETE /cart/promo — remove promo */
  async removePromo(): Promise<CartShow | null> {
    const res = await Http.delete<ApiWrapper<unknown>>("/cart/promo");
    if (!res?.data) return null;
    try {
      const validated = validateSchema(res.data);
      return toApiRead(validated);
    } catch {
      return null;
    }
  },
};
