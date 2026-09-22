/**
 * modelCastDescriptor.ts
 *
 * AST descriptor for Eloquent model attribute casts.
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

export interface ScannedModelCastParams {
    readonly column: ColumnName;
    readonly targetType: CastTypeName;
    readonly castKind: EloquentCastKind;
    readonly valueType: EloquentCastValueType;
}

/**
 * Reusable Constructor: Scanned Model Cast Descriptor.
 */
export class ScannedModelCastDescriptor implements ParsedCast {
    public readonly column: ColumnName;
    public readonly targetType: CastTypeName;
    public readonly target: EloquentCastTarget;
    public readonly castKind: EloquentCastKind;
    public readonly valueType: EloquentCastValueType;

    constructor({ column, targetType, castKind, valueType }: ScannedModelCastParams) {
        this.column = column;
        this.targetType = targetType;
        this.target = castKind === 'custom'
            ? { kind: 'custom', className: SemanticValueFactory.className(targetType.value) }
            : { kind: 'builtin', castKind };
        this.castKind = castKind;
        this.valueType = valueType;
        Object.freeze(this);
    }

    public static create({ column, targetType }: { readonly column: string; readonly targetType: string }): ScannedModelCastDescriptor {
        const mapped = EloquentCastMapper.map(targetType);
        return new ScannedModelCastDescriptor({
            column: SemanticValueFactory.columnName(column),
            targetType: SemanticValueFactory.castTypeName(targetType),
            castKind: mapped.castKind,
            valueType: mapped.valueType
        });
    }


}
