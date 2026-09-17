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
import { PrimitiveType, type PrimitiveKind, type SemanticType } from '../../../types/SemanticType';
import { SemanticValueFactory, type ColumnName, type CastTypeName } from '../../../../types/domain/semanticValues';

export interface ScannedModelCastParams {
    readonly column: string;
    readonly targetType: string;
    readonly castKind: EloquentCastKind;
    readonly semanticType: PrimitiveKind;
}

/**
 * Reusable Constructor: Scanned Model Cast Descriptor.
 */
export class ScannedModelCastDescriptor implements ParsedCast {
    public readonly column: ColumnName;
    public readonly targetType: CastTypeName;
    public readonly castKind: EloquentCastKind;
    public readonly semanticType: SemanticType;

    constructor({ column, targetType, castKind, semanticType }: ScannedModelCastParams) {
        this.column = SemanticValueFactory.columnName(column);
        this.targetType = SemanticValueFactory.castTypeName(targetType);
        this.castKind = castKind;
        this.semanticType = new PrimitiveType(semanticType);
        Object.freeze(this);
    }

    public static create({ column, targetType }: { readonly column: string; readonly targetType: string }): ScannedModelCastDescriptor {
        const mapped = EloquentCastMapper.map(targetType);
        return new ScannedModelCastDescriptor({
            column,
            targetType,
            castKind: mapped.castKind,
            semanticType: mapped.semanticType
        });
    }

    public static fromMapping(
        column: string,
        targetType: string,
        castKind?: EloquentCastKind,
        semanticType?: PrimitiveKind
    ): ScannedModelCastDescriptor {
        const mapped = EloquentCastMapper.map(targetType);
        return new ScannedModelCastDescriptor({
            column,
            targetType,
            castKind: castKind ?? mapped.castKind,
            semanticType: semanticType ?? mapped.semanticType
        });
    }
}
