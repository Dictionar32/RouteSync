/**
 * modelCastDescriptor.ts
 *
 * AST descriptor of Eloquent model attribute casts.
 *
 * @module core/compiler/scanner/descriptors/model
 */

import {
    type ParsedCast,
    type EloquentCastKind,
    EloquentCastMapper
} from '../../../../types/route';
import type { EloquentCastValueType, EloquentCastTarget } from '../../../../types/domain/eloquentTypes';
import { SemanticValueFactory, type ColumnName, type CastTypeName } from '../../../../types/domain/semanticValues';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationGate } from '../../../../semantic/kernel/relationalSequence';

export interface ScannedModelCastParams {
    readonly column: ColumnName;
    readonly targetType: CastTypeName;
    readonly castKind: EloquentCastKind;
    readonly valueType: EloquentCastValueType;
}

/**
 * Reusable Constructor: Scanned Model Cast Descriptor.
 */
export interface ScannedModelCastDescriptor extends ParsedCast {
    readonly column: ColumnName;
    readonly targetType: CastTypeName;
    readonly target: EloquentCastTarget;
    readonly castKind: EloquentCastKind;
    readonly valueType: EloquentCastValueType;
}

const castDescriptor = ({ column, targetType, castKind, valueType }: ScannedModelCastParams): ScannedModelCastDescriptor => Object.freeze({
    column,
    targetType,
    target: relationGate(
        relationEqual(castKind, 'custom'),
        () => ({ kind: 'custom' as const, className: SemanticValueFactory.className(targetType.value) }),
        () => ({ kind: 'builtin' as const, castKind })
    ),
    castKind,
    valueType
});

export const ScannedModelCastDescriptor = Object.freeze({
    create: ({ column, targetType }: { readonly column: string; readonly targetType: string }): ScannedModelCastDescriptor => {
        const mapped = EloquentCastMapper.resolve(targetType);
        return castDescriptor({
            column: SemanticValueFactory.columnName(column),
            targetType: SemanticValueFactory.castTypeName(targetType),
            castKind: mapped.castKind,
            valueType: mapped.valueType
        });
    }
});
