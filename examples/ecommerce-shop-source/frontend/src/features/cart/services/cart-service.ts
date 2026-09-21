import { createBaseCrudService } from "@/lib/generic/generic-services";
import { CartIndex, CartShow } from "../types/cart-read";
import { CartFormValues } from "../contracts/api-schema";
import { toApiReadList, toApiRead, toApiCreate, toApiUpdate } from "../mappers/cart-mapper";
import { CartApiResponse, CartApiCreate, CartApiUpdate, validateIndex, validateSchema, validateCreate, validateUpdate } from "../contracts/api-contract";

export const CartService = createBaseCrudService<
  CartApiResponse,
  CartIndex,
  CartShow,
  CartFormValues['Create'],
  CartFormValues['Update'],
  CartApiCreate,
  CartApiUpdate
>({
  basePath: "/cart/items",

  validateIndex: validateIndex,
  validateShow: validateSchema,
  validateCreate: validateCreate,
  validateUpdate: validateUpdate,

  mapIndex: toApiReadList,
  mapShow: toApiRead,
  mapCreate: toApiCreate,
  mapUpdate: toApiUpdate,
});
