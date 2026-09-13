/**
 * Type Guards Utility
 *
 * Active Consumer delegating to focused sub-domains (generalGuards, semanticGuards, assertionUtils).
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`), explicit named exports only.
 *
 * @module core/utils/type-guards
 */

export {
    isObject,
    hasProperty,
    isString,
    isNumber,
    isBoolean,
    isArray,
    type TypeWithKind,
    hasKind,
    isPrimitiveType,
    isResourceType,
    isModelType,
    isObjectType,
    isArrayType,
    isUnionType,
    isLiteralType,
    isRulesMap,
    isNullableType,
    isOptionalType,
    safeCast,
    safeStringCast,
    safeObjectCast,
    assertType,
    softAssertType,
    migrateFromAny,
    inspectType
} from './guards';