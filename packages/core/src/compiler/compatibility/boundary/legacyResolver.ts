/**
 * legacyResolver.ts
 *
 * Primitive and Union resolvers for ContractInputBoundary.
 *
 * @module compiler/compatibility/boundary
 */

import type {
    ResolvedPrimitive,
    ResolvedSemanticType
} from '../../types/ResolvedSemanticType';
import type { SemanticType } from '../../../types/semantic';
import { type LegacyContractValue, ContractInputBoundaryError } from './types';

export function resolveLegacyPrimitive(value: SemanticType): ResolvedPrimitive {
    switch (value) {
        case 'string':
            return 'string';

        case 'number':
            return 'number';

        case 'boolean':
            return 'boolean';

        case 'datetime':
            return 'datetime';

        case 'unknown':
            return 'unknown';

        default:
            throw new ContractInputBoundaryError(
                `Semantic type "${value}" cannot be represented as a compiler primitive.`
            );
    }
}

export function resolveLegacyUnion(
    values: readonly LegacyContractValue[],
    resolveItem: (v: LegacyContractValue) => ResolvedSemanticType
): Extract<ResolvedSemanticType, { kind: 'union' }> {
    if (values.length < 2) {
        throw new ContractInputBoundaryError(
            'A legacy union must contain at least two members.'
        );
    }

    const [first, second, ...rest] = values;

    return {
        kind: 'union',
        types: [
            resolveItem(first),
            resolveItem(second),
            ...rest.map((value) => resolveItem(value)),
        ],
    };
}
