/**
 * CANONICAL_NAMES.ts
 * 
 * Active Consumer Orchestrator for canonical naming conventions, action mappings, and type conversions.
 * Conforms to Rule 14: Active Consumer with Pure Flow, zero wildcard re-exports.
 * 
 * @module cli/generators/canonical-names
 */

import {
    CANONICAL_ACTION_MAP,
    type ActionType,
    ACTION_TO_HTTP_METHODS,
    HOOK_ACTION_MAP,
    HTTP_METHOD_SAFETY,
    isValidHttpMethod,
    getActionFromMethod,
    isMutationAction
} from "./canonical/actionMap";

import {
    NAMING_CONVENTIONS,
    wrapNullableTs,
    wrapNullableZod
} from "./canonical/namingConventions";

import {
    SQL_TO_TYPE_MAP,
    CAST_TO_TYPE_MAP,
    type SqlTypeMapping,
    mapSqlTypeToMapping
} from "./canonical/typeMapping";

export {
    CANONICAL_ACTION_MAP,
    type ActionType,
    ACTION_TO_HTTP_METHODS,
    HOOK_ACTION_MAP,
    HTTP_METHOD_SAFETY,
    isValidHttpMethod,
    getActionFromMethod,
    isMutationAction,
    NAMING_CONVENTIONS,
    wrapNullableTs,
    wrapNullableZod,
    SQL_TO_TYPE_MAP,
    CAST_TO_TYPE_MAP,
    type SqlTypeMapping,
    mapSqlTypeToMapping
};

/**
 * Active Consumer: Resolves field typing by actively orchestrating SQL mapping, cast overrides, and nullability wrapping.
 */
export function resolveCanonicalFieldType(
    sqlType: string,
    cast?: string,
    nullable = false
): {
    readonly zodSchema: string;
    readonly tsType: string;
    readonly baseType: string;
} {
    const mapping = mapSqlTypeToMapping(sqlType, cast);
    return {
        zodSchema: wrapNullableZod(mapping.zodType, nullable),
        tsType: wrapNullableTs(mapping.tsType, nullable),
        baseType: mapping.baseType
    };
}
