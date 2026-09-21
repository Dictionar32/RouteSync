// Feature exports - Barrel pattern for clean imports
export { useProduk } from "./hooks/use-produk";
export { ProdukService } from "./services/produk-service";
export { toApiRead, toApiReadList, toApiCreate, toApiUpdate } from "./mappers/produk-mapper";
export { Schema, IndexSchema, CreateSchema, UpdateSchema, ValidateSchema, ValidateIndex, ValidateCreate, ValidateUpdate } from "./contracts/api-contract";
export type { ProdukApiResponse, ProdukApiIndex, ProdukApiCreate, ProdukApiUpdate } from "./contracts/api-contract";
export type { ApiResponseTransformed, ProdukIndex, ProdukShow } from "./types/produk-read";
export type { ProdukFormValues } from "./contracts/api-schema";
export { ProdukApiSchema, ProdukDefaultValues } from "./contracts/api-schema";

// Components
export { ProdukCard } from "./components/produk-card";
export { ProdukSkeleton } from "./components/produk-skeleton";
