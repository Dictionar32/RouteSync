import { PrimitiveKind } from "../../compiler/types/SemanticType";
import type { ParsedColumn } from "./databaseColumns";
import type { ParsedCast, ParsedAccessor, ParsedRelation, ModelKeyType } from "./eloquentTypes";

/**
 * Pure Ordered Eloquent Model AST (0 Record, 0 Object.entries).
 */
export interface ParsedModel {
  readonly name: string;       // e.g. 'App\\Models\\User'
  readonly shortName: string;  // e.g. 'User' (Guaranteed from class_basename in PHP)
  readonly table: string;
  readonly primaryKey: string; // ✅ Guaranteed ('id')
  readonly keyType: ModelKeyType; // ✅ Guaranteed ('int' | 'bigint' | 'uuid')
  readonly keySemanticType: PrimitiveKind; // ✅ Guaranteed (PrimitiveKind.NUMBER | STRING)
  readonly incrementing: boolean; // ✅ Guaranteed boolean
  readonly softDeletes: boolean;  // ✅ Guaranteed boolean (true if SoftDeletes trait or deleted_at column present)
  readonly timestamps: boolean;   // ✅ Guaranteed boolean (true if created_at & updated_at columns present)
  readonly columns: readonly ParsedColumn[];
  readonly fillable: readonly string[];
  readonly guarded: readonly string[];
  readonly hidden: readonly string[];
  readonly appends: readonly string[];
  readonly casts: readonly ParsedCast[];
  readonly accessors: readonly ParsedAccessor[];
  readonly relations: readonly ParsedRelation[];
}
