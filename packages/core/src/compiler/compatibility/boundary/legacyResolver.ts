/**
 * legacyResolver.ts
 *
 * Primitive and Union resolvers for ContractInputBoundary.
 *
 * @module compiler/compatibility/boundary
 */

import type { ResolvedSemanticType } from '../../domain/common/resolved-types';
import { PrimitiveKind, PrimitiveType, type SemanticType } from '../../types/SemanticType';
import { ResolvedPrimitiveType, ResolvedUnionType } from '../../domain/common/resolved-types';
import { type LegacyContractValue, ContractInputBoundaryError } from './types';

export function resolveLegacyPrimitive(value: SemanticType): ResolvedPrimitiveType {
    if (value instanceof PrimitiveType) {
        switch (value.type) {
            case PrimitiveKind.STRING:
                return ResolvedPrimitiveType.string();
            case PrimitiveKind.NUMBER:
                return ResolvedPrimitiveType.number();
            case PrimitiveKind.BOOLEAN:
                return ResolvedPrimitiveType.boolean();
            case PrimitiveKind.DATETIME:
                return ResolvedPrimitiveType.datetime();
            case PrimitiveKind.UNKNOWN:
                return ResolvedPrimitiveType.unknown();
            case PrimitiveKind.FILE:
                return ResolvedPrimitiveType.file();
        }
    }
    throw new ContractInputBoundaryError(
        'Semantic type cannot be represented as a legacy primitive.'
    );
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

    return ResolvedUnionType.of([
        resolveItem(first),
        resolveItem(second),
        ...rest.map((value) => resolveItem(value)),
    ]);
}
