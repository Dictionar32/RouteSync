import { createBaseCrudService } from "@/lib/generic/generic-services";
import { CategoryApiResponse, CategoryApiCreate, CategoryApiUpdate, validateIndex, validateSchema, validateCreate, validateUpdate } from "../contracts/api-contract";
import { CategoryIndex, CategoryShow } from "../types/category-read";
import { CategoryFormValues } from "../contracts/api-schema";
import { toApiReadList, toApiRead, toApiCreate, toApiUpdate } from "../mappers/category-mapper";

export const CategoryService = createBaseCrudService<
  CategoryApiResponse,
  CategoryIndex,
  CategoryShow,
  CategoryFormValues['Create'],
  CategoryFormValues['Update'],
  CategoryApiCreate,
  CategoryApiUpdate
>({
  basePath: "/categories",

  validateIndex: validateIndex,
  validateShow: validateSchema,
  validateCreate: validateCreate,
  validateUpdate: validateUpdate,

  mapIndex: toApiReadList,
  mapShow: toApiRead,
  mapCreate: toApiCreate,
  mapUpdate: toApiUpdate,
});
