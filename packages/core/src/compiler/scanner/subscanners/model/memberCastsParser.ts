/**
 * Model Member Casts Parser.
 * Scans Eloquent model $casts property and Laravel 11 casts() method.
 *
 * @module core/compiler/scanner/subscanners/model
 */

import type { ParsedCast } from "../../../../types/route";
import { LaravelSourceLexer, type TokenDescriptor } from "../../LaravelSourceLexer";
import { ScannedModelCastDescriptor } from "../../descriptors/modelDescriptors";

export function tryParseModelCasts(
    source: string,
    tokens: readonly TokenDescriptor[],
    i: number,
    castsMap: Record<string, string>,
    casts: ParsedCast[]
): void {
    const token = tokens[i];

    // $casts = [ ... ];
    if (token.value === '$casts' && tokens[i + 1]?.value === '=') {
        const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
        for (const entry of parsed.entries) {
            const castVal = entry.value.kind === 'literal' && entry.value.literalType === 'string'
                ? String(entry.value.value)
                : (entry.rawExpression || 'string').replace(/::class$/, '').trim();
            castsMap[entry.key] = castVal;
            casts.push(ScannedModelCastDescriptor.create({
                column: entry.key,
                targetType: castVal
            }));
        }
    }

    // Laravel 11 style: protected function casts(): array { return [ ... ]; }
    if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER' && tokens[i + 1].value === 'casts') {
        let k = i + 2;
        while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') k++;
        if (tokens[k]?.value === '{') {
            let depth = 1;
            k++;
            while (k < tokens.length && depth > 0) {
                if (tokens[k].value === '{') depth++;
                else if (tokens[k].value === '}') depth--;
                if (tokens[k].value === 'return') {
                    const parsed = LaravelSourceLexer.parseArray(source, tokens, k + 1);
                    for (const entry of parsed.entries) {
                        const castVal = entry.value.kind === 'literal' && entry.value.literalType === 'string'
                            ? String(entry.value.value)
                            : (entry.rawExpression || 'string').replace(/::class$/, '').trim();
                        castsMap[entry.key] = castVal;
                        casts.push(ScannedModelCastDescriptor.create({
                            column: entry.key,
                            targetType: castVal
                        }));
                    }
                    k = Math.max(k, parsed.endIndex - 1);
                }
                k++;
            }
        }
    }
}
