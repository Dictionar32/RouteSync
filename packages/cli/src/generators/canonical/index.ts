/**
 * cli/generators/canonical/index.ts
 *
 * Explicit Sub-Domain Exports for Canonical Names and Mappings.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module cli/generators/canonical
 */

export {
    CANONICAL_ACTION_MAP,
    type ActionType,
    ACTION_TO_HTTP_METHODS,
    HOOK_ACTION_MAP,
    HTTP_METHOD_SAFETY,
    isValidHttpMethod,
    getActionFromMethod,
    isMutationAction
} from "./actionMap";

export {
    NAMING_CONVENTIONS,
    wrapNullableTs,
    wrapNullableZod
} from "./namingConventions";

export {
    SQL_TO_TYPE_MAP,
    CAST_TO_TYPE_MAP,
    type SqlTypeMapping,
    mapSqlTypeToMapping
} from "./typeMapping";
