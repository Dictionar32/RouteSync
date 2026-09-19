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
import type { SemanticType } from '../../../types/SemanticType';
import type { EloquentCastValueType } from '../../../../types/domain/eloquentTypes';
import { SemanticValueFactory, type ColumnName, type CastTypeName } from '../../../../types/domain/semanticValues';

export interface ScannedModelCastParams {
    readonly column: string;
    readonly targetType: string;
    readonly castKind: EloquentCastKind;
    readonly valueType: EloquentCastValueType;
}

/**
 * Reusable Constructor: Scanned Model Cast Descriptor.
 */
export class ScannedModelCastDescriptor implements ParsedCast {
    public readonly column: ColumnName;
    public readonly targetType: CastTypeName;
    public readonly castKind: EloquentCastKind;
    public readonly valueType: EloquentCastValueType;

    constructor({ column, targetType, castKind, valueType }: ScannedModelCastParams) {
        this.column = SemanticValueFactory.columnName(column);
        this.targetType = SemanticValueFactory.castTypeName(targetType);
        this.castKind = castKind;
        this.valueType = valueType;
        Object.freeze(this);
    }

    public static create({ column, targetType }: { readonly column: string; readonly targetType: string }): ScannedModelCastDescriptor {
        const mapped = EloquentCastMapper.map(targetType);
        return new ScannedModelCastDescriptor({
            column,
            targetType,
            castKind: mapped.castKind,
            valueType: mapped.valueType
        });
    }

    public static fromMapping(
        column: string,
        targetType: string,
        castKind: EloquentCastKind,
        valueType: EloquentCastValueType
    ): ScannedModelCastDescriptor {
        const mapped = EloquentCastMapper.map(targetType);
        return new ScannedModelCastDescriptor({
            column,
            targetType,
            castKind,
            valueType
        });
    }
}
