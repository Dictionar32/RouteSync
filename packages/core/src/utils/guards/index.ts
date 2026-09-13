/**
 * Type guards sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */

export {
    isObject,
    hasProperty,
    isString,
    isNumber,
    isBoolean,
    isArray
} from './generalGuards';

export {
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
    isOptionalType
} from './semanticGuards';

export {
    safeCast,
    safeStringCast,
    safeObjectCast,
    assertType,
    softAssertType,
    migrateFromAny,
    inspectType
} from './assertionUtils';
