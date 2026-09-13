/**
 * types.ts
 *
 * Scanned model parameter types.
 *
 * @module compiler/scanner/descriptors/model/entity
 */

import type {
    ParsedColumn,
    ParsedCast,
    ParsedAccessor,
    ParsedRelation,
    ModelKeyType
} from "../../../../../types/route";
import type { PrimitiveKind } from "../../../../types/SemanticType";

export interface ScannedModelParams {
    readonly name: string;
    readonly shortName: string;
    readonly table: string;
    readonly primaryKey: string;
    readonly keyType: ModelKeyType;
    readonly keySemanticType: PrimitiveKind;
    readonly incrementing: boolean;
    readonly softDeletes: boolean;
    readonly timestamps: boolean;
    readonly columns: readonly ParsedColumn[];
    readonly fillable: readonly string[];
    readonly guarded: readonly string[];
    readonly hidden: readonly string[];
    readonly appends: readonly string[];
    readonly casts: readonly ParsedCast[];
    readonly accessors: readonly ParsedAccessor[];
    readonly relations: readonly ParsedRelation[];
}
