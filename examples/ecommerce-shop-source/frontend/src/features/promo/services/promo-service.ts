import { PromoApiResponse, PromoApiCreate, validateIndex, validateSchema, validateCreate } from "../contracts/api-contract";
import { createBaseCrudService } from "@/lib/generic/generic-services";
import { PromoFormValues } from "../contracts/api-schema";
import { PromoIndex, PromoShow } from "../types/promo-read";
import { toApiReadList, toApiRead, toApiCreate } from "../mappers/promo-mapper";

export const PromoService = createBaseCrudService<
  PromoApiResponse,
  PromoIndex,
  PromoShow,
  PromoFormValues['Create'],
  never,
  PromoApiCreate,
  never
>({
  basePath: "/cart/promo",

  validateIndex,
  validateShow: validateSchema,
  validateCreate,

  mapIndex: toApiReadList,
  mapShow: toApiRead,
  mapCreate: toApiCreate,
});
