/**
 * resource/index.ts
 *
 * Explicit Sub-Domain Exports for Semantic Resource AST Binding.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/binders/resource
 */

export {
    bindWhenLoadedField
} from "./whenLoadedBinder";

export {
    bindPropertyAccessField
} from "./propertyAccessBinder";

export {
    bindResourceCollectionField,
    bindNestedArrayField,
    bindLiteralField,
    bindTernaryField,
    bindFallbackField
} from "./compositeBinders";

export {
    bindField
} from "./fieldBinder";

export {
    bindResource
} from "./resourceBinder";
