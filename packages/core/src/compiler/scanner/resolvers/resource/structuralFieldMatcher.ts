/**
 * structuralFieldMatcher.ts
 *
 * Weighted Structural Field Matching (Tier 4) for resolving Eloquent models from Resource fields.
 *
 * @module compiler/scanner/resolvers/resource/structuralFieldMatcher
 */

import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";
import { matchLookup } from "../../../../types/upstream/collections";

const GENERIC_COLUMNS = new Set([
    'id',
    'created_at',
    'updated_at',
    'deleted_at',
    'status',
    'name',
    'type',
    'description',
    'uuid',
    'is_active'
]);

/**
 * Matches field names against Eloquent models using weighted scoring.
 */
export function matchStructuralFields(
    fieldNames: readonly string[],
    modelSymbolTable: ModelSymbolTable
): OriginModelSymbol | undefined {
    let bestModel: OriginModelSymbol | undefined;
    let highestScore = 0;
    let runnerUpScore = 0;

    for (const model of modelSymbolTable.all()) {
        let score = 0;
        let matchedCount = 0;
        let distinctiveScore = 0;

        for (const field of fieldNames) {
            const lowerField = field.toLowerCase();
            const col = matchLookup(model.column(field), {
                missing: () => model.column(lowerField),
                found: lookup => lookup
            });
            if (col.kind === 'found') {
                matchedCount++;
                if (GENERIC_COLUMNS.has(lowerField)) {
                    score += 0.1;
                } else {
                    score += 1.0;
                    distinctiveScore += 1.0;
                }
            }
        }

        const coverage = fieldNames.length > 0 ? matchedCount / fieldNames.length : 0;
        if (matchedCount >= 2 && distinctiveScore >= 1.0 && coverage >= 0.4) {
            if (score > highestScore) {
                runnerUpScore = highestScore;
                highestScore = score;
                bestModel = model;
            } else if (score > runnerUpScore) {
                runnerUpScore = score;
            }
        }
    }

    if (bestModel && (highestScore - runnerUpScore >= 0.5 || runnerUpScore === 0)) {
        return bestModel;
    }

    return undefined;
}
