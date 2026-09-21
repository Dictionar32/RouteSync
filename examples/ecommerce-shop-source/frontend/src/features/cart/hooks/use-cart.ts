import { createCrudHooks } from "@/lib/generic/generic-hooks";
import { QueryKey } from "@/lib/core/query-key";
import { CartService } from "../services/cart-service";
import { CartIndex, CartShow } from "../types/cart-read";
import { CartFormValues } from "../contracts/api-schema";

export const useCart = createCrudHooks<
  CartIndex,
  CartShow,
  CartFormValues['Create'],
  CartFormValues['Update']
>({
    queryKey: {
        list: () => [QueryKey.cart.list],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        detail: (_id: number) => [QueryKey.cart.summary]
    },
    service: {
        index: CartService.index,
        show: CartService.show,
        create: CartService.create,
        update: CartService.update,
        delete: CartService.delete
    }
})
