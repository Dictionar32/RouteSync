/**
 * arrayParser.ts
 *
 * Parses PHP array declarations into structured key-value entries leveraging exact source slicing.
 *
 * @module core/compiler/scanner/lexer/arrayParser
 */

import { TokenDescriptor, PhpArrayEntry, ParsedPhpArrayResult, PhpArrayKey } from './PhpAst';
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

        let key: PhpArrayKey | undefined;
        if (endIndex + 1 < tokens.length && tokens[endIndex + 1].value === '=>') {
            const keyToken = tokens[endIndex];
            key = keyToken.type === 'STRING'
                ? { kind: 'string', value: keyToken.value }
                : keyToken.type === 'NUMBER'
                    ? { kind: 'integer', value: Number(keyToken.value) }
                    : { kind: 'expression', value: classifyAstTokens([keyToken]) };
            endIndex += 2;
        } else {
        }

        // Value parsing
        if (endIndex < tokens.length) {
            const valToken = tokens[endIndex];

            // Nested Array
            if (valToken.value === '[' || (valToken.value === 'array' && valToken.type === 'IDENTIFIER')) {
                const nested = parsePhpArray(source, tokens, endIndex);
                entries.push(key ? { kind: 'keyed', key, value: { kind: 'nested_array', entries: nested.entries } } : { kind: 'positional', value: { kind: 'nested_array', entries: nested.entries } });
                endIndex = nested.endIndex;
                continue;
            }

            // Scalar value / Chained Expression extraction via source.slice()
            const valTokenIndex = endIndex;
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

                endIndex++;
            }

            const astValue = classifyAstTokens(tokens.slice(valTokenIndex, endIndex));
            entries.push(key ? { kind: 'keyed', key, value: astValue } : { kind: 'positional', value: astValue });
        }
    }

    return { entries, endIndex };
}
