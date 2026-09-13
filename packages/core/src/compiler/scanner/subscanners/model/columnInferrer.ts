/**
 * columnInferrer.ts
 *
 * Resolves or infers model columns from migration schemas or convention heuristics.
 *
 * @module core/compiler/scanner/subscanners/model/columnInferrer
 */

import type { ParsedColumn, ParsedCast } from "../../../../types/route";
import { PrimitiveKind } from "../../../types/SemanticType";
import { ScannedModelColumnDescriptor } from "../../descriptors/modelDescriptors";

/**
 * Infers model columns from migration schema if available, otherwise falls back to
 * fillable conventions and cast types.
 */
export function inferModelColumns(
    table: string,
    fillable: readonly string[],
    casts: readonly ParsedCast[],
    migrationMap?: Map<string, ParsedColumn[]>
): readonly ParsedColumn[] {
    const migrationCols = migrationMap?.get(table);
    if (migrationCols && migrationCols.length > 0) {
        return migrationCols;
    }

    return Array.from(new Set(['id', ...fillable, 'created_at', 'updated_at'])).map(col => {
        const castEntry = casts.find(c => c.column === col);
        let primKind: PrimitiveKind = PrimitiveKind.STRING;
        if (castEntry) {
            primKind = castEntry.semanticType;
        } else if (col === 'id' || col.endsWith('_id') || col.endsWith('Id')) {
            primKind = PrimitiveKind.NUMBER;
        } else if (col.endsWith('_at')) {
            primKind = PrimitiveKind.DATETIME;
        }

        let colType = 'varchar';
        if (primKind === PrimitiveKind.NUMBER) {
            colType = 'int';
        } else if (primKind === PrimitiveKind.BOOLEAN) {
            colType = 'boolean';
        } else if (primKind === PrimitiveKind.DATETIME) {
            colType = 'timestamp';
        }

        return ScannedModelColumnDescriptor.fromSchema({
            name: col,
            type: colType,
            nullable: col !== 'id',
            semanticType: primKind
        });
    });
}
