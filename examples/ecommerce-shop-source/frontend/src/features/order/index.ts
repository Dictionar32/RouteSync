// Feature exports - Barrel pattern for clean imports
export { useOrder } from "./hooks/use-order";
export { OrderService } from "./services/order-service";
export { toApiRead, toApiReadList, toApiCreate } from "./mappers/order-mapper";
export { Schema, IndexSchema, CreateSchema, OrderListSchema, validateIndex, validateSchema, validateCreate } from "./contracts/api-contract";
export type { OrderApiResponse, OrderApiIndex, OrderApiCreate } from "./contracts/api-contract";
export type { OrderItem, OrderTransformed, OrderShow, OrderIndex } from "./types/order-read";
export type { OrderFormValues } from "./contracts/api-schema";
export { OrderApiSchema, OrderDefaultValues } from "./contracts/api-schema";
