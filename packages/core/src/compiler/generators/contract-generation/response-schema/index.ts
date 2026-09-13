/**
 * compiler/generators/contract-generation/response-schema/index.ts
 *
 * Explicit Sub-Domain Exports for Response Schema Mapping.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/generators/contract-generation/response-schema
 */

export {
    type ResponseTypeInfo,
    type RouteAction,
    type ActionResponseSchema,
    type ResourceResponseSchemas
} from "./responseSchemaTypes";

export {
    buildPrimitiveSchema,
    buildModifiers,
    buildPrimitiveSchemaWithModifiers,
    toCamelCase
} from "./primitiveSchemaBuilder";

export {
    buildFieldSchema,
    buildObjectFromFields
} from "./fieldSchemaDispatcher";

export {
    generateSchemaName,
    mapActionResponseToSchema
} from "./actionResponseMapper";
