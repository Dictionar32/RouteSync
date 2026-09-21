import { Http } from "@/lib/core/api-client";
import { validateSchema } from "../contracts/api-contract";
import { toApiRead, toApiCreate } from "../mappers/order-mapper";
import { OrderIndex, OrderShow } from "../types/order-read";
import { OrderFormValues } from "../contracts/api-schema";

interface ApiWrapper<T> { data: T; }

// Unwrap items dari ResourceCollection wrapper jika ada
function unwrapItems(items: unknown): unknown[] {
  if (Array.isArray(items)) return items;
  if (items && typeof items === 'object' && 'data' in items) {
    const data = (items as { data: unknown }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

function parseOrder(raw: unknown): OrderShow {
  // inject unwrapped items sebelum validate
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (obj.items && !Array.isArray(obj.items)) {
      obj.items = unwrapItems(obj.items);
    }
  }
  const validated = validateSchema(raw);
  return toApiRead(validated);
}

export const OrderService = {
  /** GET /orders */
  async index(): Promise<OrderIndex[]> {
    const res = await Http.get<ApiWrapper<unknown>>("/orders");
    const raw = res.data;
    // ResourceCollection: { data: [...] }
    const arr = Array.isArray(raw)
      ? raw
      : (raw && typeof raw === 'object' && 'data' in raw
        ? (raw as { data: unknown }).data
        : []);
    const list = Array.isArray(arr) ? arr : [];
    return list.map((item: unknown) => parseOrder(item));
  },

  /** GET /orders/:id */
  async show(id: number): Promise<OrderShow> {
    const res = await Http.get<ApiWrapper<unknown>>(`/orders/${id}`);
    return parseOrder(res.data);
  },

  /** POST /checkout */
  async create(form: OrderFormValues['Create']): Promise<OrderShow> {
    const payload = toApiCreate(form);
    const res = await Http.post<ApiWrapper<unknown>>("/checkout", payload);
    return parseOrder(res.data);
  },
};
