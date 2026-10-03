/**
 * Relation-driven nullable wrapper resolver.
 */
import type { ObjectType } from '../../../../types/SemanticType';
import type { ResponseFieldProjection } from '../../../../generators/contract-generation/response-field';
import type { SemanticTypeResolverLike } from '../../semantic-resolver';
import type { NullableWrapperResult, StageResult } from '../loweringContracts';
import { convertResolvedTypeToResponseField } from './fieldConverter';
import { NULLABLE_WRAPPER_RULES, resolveLoweringOperation } from '../../../../ir/semanticIRLoweringRelations';
import { relationFirst, relationOptionFold, relationResolve } from '../../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../../semantic/kernel/semanticRelations';
import type { ResolvedSemanticType } from '../../ResolvedSemanticType';

export function resolveNullableWrapper(
    fieldName: string,
    objectType: ObjectType,
    resolver: SemanticTypeResolverLike,
): NullableWrapperResult {
    const resolved = resolver.resolve(objectType);
    const operation = resolveLoweringOperation(resolved.kind, NULLABLE_WRAPPER_RULES);
    const handlers: Record<string, () => NullableWrapperResult> = {
        nullable_wrapper: () => {
            const nullable = resolved as Extract<ResolvedSemanticType, { kind: 'nullable' }>;
            const innerResult = convertResolvedTypeToResponseField(fieldName, nullable.innerType, resolver);
            return relationOptionFold(
                relationFirst(innerResult.fields, () => true),
                () => ({ isNullableWrapper: false }),
                itemType => ({
                    isNullableWrapper: true,
                    field: {
                        name: itemType.name,
                        kind: itemType.kind,
                        type: itemType.type,
                        nullable: true,
                        optional: itemType.optional,
                        fields: itemType.fields,
                        ...relationResolve(Object.prototype.hasOwnProperty.call(itemType, 'itemType'), () => ({}), () => ({ itemType: itemType.itemType })),
                    },
                    warnings: innerResult.warnings,
                }),
            );
        },
        not_nullable_wrapper: () => ({ isNullableWrapper: false }),
    };
    return relationResolve(
        Object.prototype.hasOwnProperty.call(handlers, operation),
        () => handlers[operation](),
        () => ({ isNullableWrapper: false }),
    );
}

export function convertObjectType(
    fieldName: string,
    objectType: ObjectType,
    resolver: SemanticTypeResolverLike,
): StageResult<ResponseFieldProjection> {
    const resolved = resolver.resolve(objectType);
    return convertResolvedTypeToResponseField(fieldName, resolved, resolver);
}
