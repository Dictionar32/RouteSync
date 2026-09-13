/**
 * ContractInputBoundary sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/compatibility/boundary
 */

export {
    type LegacyPrimitiveValue,
    type LegacyResourceValue,
    type LegacyModelValue,
    type LegacyObjectValue,
    type LegacyArrayValue,
    type LegacyUnionValue,
    type LegacyLiteralValue,
    type LegacyContractValue,
    ContractInputBoundaryError
} from './types';

export {
    resolveLegacyPrimitive,
    resolveLegacyUnion
} from './legacyResolver';
