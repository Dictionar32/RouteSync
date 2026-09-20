/**
 * validation/index.ts
 *
 * Explicit named exports for Validation Descriptors sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/descriptors/validation
 */

export {
    ScannedRouteValidationRuleEntry,
    type ScannedRouteValidationRuleParams
} from "./validationRuleEntry";

export {
    ScannedRouteSchemaPayload,
    type ScannedRouteSchemaParams
} from "./schemaPayload";

export {
    ScannedScalarFieldNode,
    type ScannedScalarFieldParams,
    ScannedObjectFieldNode,
    type ScannedObjectFieldParams,
    ScannedArrayFieldNode,
    type ScannedArrayFieldParams
} from "./fieldNodes";

export { ValidationTreeBuilder } from "./validationTreeBuilder";

export {
    ScannedRouteValidationRuleSet,
    type RouteValidationRuleSet
} from "./validationRuleSet";
