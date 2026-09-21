import { createBaseCrudService } from "@/lib/generic/generic-services";
import { ProdukIndex, ProdukShow } from "../types/produk-read";
import { ProdukApiResponse, ProdukApiCreate, ProdukApiUpdate, ValidateIndex, ValidateSchema, ValidateCreate, ValidateUpdate } from "../contracts/api-contract";
import { toApiReadList, toApiRead, toApiCreate, toApiUpdate } from "../mappers/produk-mapper";
import { ProdukForm } from "../types/produk-form";

export const ProdukService = createBaseCrudService<
  ProdukApiResponse,
  ProdukIndex,
  ProdukShow,
  ProdukForm['Create'],
  ProdukForm['Update'],
  ProdukApiCreate,
  ProdukApiUpdate
>({
  basePath: "/produk",

  validateIndex: ValidateIndex,
  validateShow: ValidateSchema,
  validateCreate: ValidateCreate,
  validateUpdate: ValidateUpdate,

  mapIndex: toApiReadList,
  mapShow: toApiRead,
  mapCreate: toApiCreate,
  mapUpdate: toApiUpdate,
});
