/**
 * arrayParser.ts
 *
 * Parses PHP array declarations into structured key-value entries leveraging exact source slicing.
 *
 * @module core/compiler/scanner/lexer/arrayParser
 */

import { TokenDescriptor, PhpArrayEntry, ParsedPhpArrayResult } from './PhpAst';
import { classifyAstTokens } from './astClassifier';

/**
 * Parses a PHP array declaration into structured key-value entries leveraging exact source slicing.
 */
export function parsePhpArray(
    source: string,
    tokens: readonly TokenDescriptor[],
    startIndex: number = 0
): ParsedPhpArrayResult {
    const entries: PhpArrayEntry[] = [];
    let endIndex = startIndex;

    // Skip to array start: '[' or 'array('
    while (endIndex < tokens.length) {
        if (tokens[endIndex].value === '[') {
            const prev = endIndex > startIndex ? tokens[endIndex - 1] : null;
            const isSubscript = prev && (
                prev.type === 'VARIABLE' ||
                (prev.type === 'IDENTIFIER' && prev.value !== 'return' && prev.value !== 'yield') ||
                prev.value === ')' ||
                prev.value === ']' ||
                prev.value === '}'
            );
            if (isSubscript) {
                let depth = 1;
                endIndex++;
                while (endIndex < tokens.length && depth > 0) {
                    if (tokens[endIndex].value === '[') depth++;
                    else if (tokens[endIndex].value === ']') depth--;
                    endIndex++;
                }
                continue;
            }
            endIndex++; // skip '['
            break;
        }
        if (tokens[endIndex].value === 'array' && tokens[endIndex + 1]?.value === '(') {
            endIndex += 2; // skip 'array' and '('
            break;
        }
        endIndex++;
    }
    if (endIndex >= tokens.length) return { entries: [], endIndex };

    let autoIndex = 0;

    while (endIndex < tokens.length) {
        const token = tokens[endIndex];
        if (token.value === ']' || token.value === ')') {
            endIndex++;
            break;
        }

        if (token.value === ',') {
            endIndex++;
            continue;
        }

        let key = String(autoIndex);

        // Check if key is explicitly declared: 'key' => value
        if (endIndex + 1 < tokens.length && tokens[endIndex + 1].value === '=>') {
            key = tokens[endIndex].value;
            endIndex += 2;
        } else {
            autoIndex++;
        }

        // Value parsing
        if (endIndex < tokens.length) {
            const valToken = tokens[endIndex];

            // Nested Array
            if (valToken.value === '[' || valToken.value === 'array') {
                const nested = parsePhpArray(source, tokens, endIndex);
                entries.push({ key, value: { kind: 'nested_array', entries: nested.entries }, rawExpression: 'array' });
                endIndex = nested.endIndex;
                continue;
            }

            // Scalar value / Chained Expression extraction via source.slice()
            const valTokenIndex = endIndex;
            const exprStartOffset = valToken.startOffset;
            let exprEndOffset = valToken.endOffset;
            let depth = 0;

            while (endIndex < tokens.length) {
                const nextToken = tokens[endIndex];

                // Delimiter reached at top-level depth
                if (depth === 0 && (nextToken.value === ',' || nextToken.value === ']' || nextToken.value === ')')) {
                    break;
                }

                // Track nested depth
                if (nextToken.value === '(' || nextToken.value === '[') {
                    depth++;
                } else if (nextToken.value === ')' || nextToken.value === ']') {
                    depth--;
                }

                exprEndOffset = nextToken.endOffset;
                endIndex++;
            }

            const rawExpression = source.slice(exprStartOffset, exprEndOffset);
            const astValue = classifyAstTokens(tokens.slice(valTokenIndex, endIndex), rawExpression);
            entries.push({ key, value: astValue, rawExpression });
        }
    }

    return { entries, endIndex };
}
