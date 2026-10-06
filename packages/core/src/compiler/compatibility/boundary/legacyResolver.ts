/** Declarative legacy boundary resolvers. */
import type { ResolvedSemanticType } from '../../domain/common/resolved-types';
import { PrimitiveKind, type PrimitiveType, type SemanticType } from '../../../types/domain/semanticType';
import { ResolvedPrimitiveType, ResolvedUnionType } from '../../domain/common/resolved-types';
import { type LegacyContractValue, ContractInputBoundaryError } from './types';
import { relationResolve, relationFold } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';

const isPrimitiveSemanticType = (value: SemanticType): value is PrimitiveType => relationEqual(value.kind, 'primitive');

export const resolveLegacyPrimitive = (value: SemanticType): ResolvedPrimitiveType =>
    relationResolve(
        isPrimitiveSemanticType(value),
        () => {
            const primitive = value;

            const catalog: Readonly<Record<PrimitiveKind, () => ResolvedPrimitiveType>> = Object.freeze({
                [PrimitiveKind.STRING]: () => ResolvedPrimitiveType.string(),
                [PrimitiveKind.NUMBER]: () => ResolvedPrimitiveType.number(),
                [PrimitiveKind.BOOLEAN]: () => ResolvedPrimitiveType.boolean(),
                [PrimitiveKind.DATETIME]: () => ResolvedPrimitiveType.datetime(),
                [PrimitiveKind.INDETERMINATE]: () => ResolvedPrimitiveType.unknown(),
                [PrimitiveKind.FILE]: () => ResolvedPrimitiveType.file(),
            });
            return relationResolve(
                Object.hasOwn(catalog, primitive.type),
                () => catalog[primitive.type](),
                () => { throw new ContractInputBoundaryError('Semantic primitive kind cannot be represented as a legacy primitive.'); },
            );
        },
        () => { throw new ContractInputBoundaryError('Semantic type cannot be represented as a legacy primitive.'); },
    );

export function resolveLegacyUnion(
    values: readonly LegacyContractValue[],
    resolveItem: (value: LegacyContractValue) => ResolvedSemanticType,
): Extract<ResolvedSemanticType, { kind: 'union' }> {
    return relationResolve(
        relationResolve(values.length >= 2, () => true, () => false),
        () => ResolvedUnionType.of(relationFold(values, Object.freeze([]) as readonly ResolvedSemanticType[], (items, value) => Object.freeze([...items, resolveItem(value)]))),
        () => { throw new ContractInputBoundaryError('A legacy union must contain at least two members.'); },
    );
}
