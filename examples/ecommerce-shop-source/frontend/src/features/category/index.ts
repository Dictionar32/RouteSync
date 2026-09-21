// Feature exports - Barrel pattern for clean imports
export { useCategory } from "./hooks/use-category";
export { CategoryService } from "./services/category-service";
export { toApiRead, toApiReadList, toApiCreate, toApiUpdate } from "./mappers/category-mapper";
export { CategorySchema, IndexSchema, CreateSchema, UpdateSchema, CategoryListSchema, validateSchema, validateIndex, validateCreate, validateUpdate, validateList } from "./contracts/api-contract";
export type { CategoryApiResponse, CategoryApiIndex, CategoryApiCreate, CategoryApiUpdate, CategoryApiListSchema } from "./contracts/api-contract";
export type { CategoryApiTransformed, CategoryIndex, CategoryShow } from "./types/category-read";
export type { CategoryFormValues } from "./contracts/api-schema";
export { CategoryApiSchema, CategoryDefaultValues } from "./contracts/api-schema";
