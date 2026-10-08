/**
 * arrayParser.ts
 *
 * Parses PHP array declarations through recursive relation closure.
 *
 * @module core/compiler/scanner/lexer/arrayParser
 */

import { createSourceOffset } from './PhpAst';
import type { TokenDescriptor, PhpArrayEntry, ParsedPhpArrayResult, PhpArrayKey } from './PhpAst';
import { classifyAstTokens } from './astClassifier';
import { relationAll, relationFirst, relationOptionFold, relationResolve, relationSlice, type RelationOption } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';
import { tokenValueEquals, tokenKindEquals } from './tokenEvidence';

const some = <T>(value: T): RelationOption<T> => ({ kind: 'some', value });
const none = <T>(): RelationOption<T> => ({ kind: 'none' });

/**
 * Parses a PHP array declaration into structured key-value entries.
 * Collection traversal is represented as recursive relation closure.
 */
export function parsePhpArray(
    source: string,
    tokens: readonly TokenDescriptor[],
    startIndex: number = 0
): ParsedPhpArrayResult {
    const opening = locateArrayOpening(tokens, startIndex);
    return relationOptionFold(opening, () => ({ entries: [], endIndex: startIndex }), index => parseArrayBody(source, tokens, index));
}

const locateArrayOpening = (
    tokens: readonly TokenDescriptor[],
    index: number,
): RelationOption<number> =>
    relationResolve(index < tokens.length,
        () => relationResolve(isArrayLiteralOpening(tokens, index),
            () => some(openingEnd(tokens, index)),
            () => relationResolve(isSubscriptOpening(tokens, index),
                () => locateAfterSubscript(tokens, index + 1, 1),
                () => locateArrayOpening(tokens, index + 1))),
        () => none());

const isArrayLiteralOpening = (tokens: readonly TokenDescriptor[], index: number): boolean =>
    relationResolve(tokenValueEquals(tokens, index, '['),
        () => relationResolve(isSubscriptOpening(tokens, index), () => false, () => true),
        () => relationAll([
            tokenValueEquals(tokens, index, 'array'),
            tokenValueEquals(tokens, index + 1, '('),
        ]));

const openingEnd = (tokens: readonly TokenDescriptor[], index: number): number =>
    relationResolve(tokenValueEquals(tokens, index, '['), () => index + 1, () => index + 2);

const isSubscriptOpening = (tokens: readonly TokenDescriptor[], index: number): boolean => {
    const previous = relationResolve(index > 0, () => tokens[index - 1], () => tokens[index]);
    const variable = relationEqual(previous.type, 'VARIABLE');
    const identifier = relationResolve(relationEqual(previous.type, 'IDENTIFIER'),
        () => relationResolve(relationResolve(relationEqual(previous.value, 'return'), () => true, () => relationEqual(previous.value, 'yield')), () => false, () => true),
        () => false);
    const postfix = relationResolve(relationEqual(previous.value, ')'), () => true, () =>
        relationResolve(relationEqual(previous.value, ']'), () => true, () => relationEqual(previous.value, '}')));
    return relationResolve(tokenValueEquals(tokens, index, '['),
        () => relationResolve(variable, () => true, () => relationResolve(identifier, () => true, () => postfix)),
        () => false);
};

const locateAfterSubscript = (
    tokens: readonly TokenDescriptor[],
    index: number,
    depth: number,
): RelationOption<number> =>
    relationResolve(index < tokens.length,
        () => {
            const token = tokens[index];
            const nextDepth = relationResolve(relationEqual(token.value, '['),
                () => depth + 1,
                () => relationResolve(relationEqual(token.value, ']'), () => depth - 1, () => depth));
            return relationResolve(nextDepth <= 0,
                () => locateArrayOpening(tokens, index + 1),
                () => locateAfterSubscript(tokens, index + 1, nextDepth));
        },
        () => none());

const parseArrayBody = (
    source: string,
    tokens: readonly TokenDescriptor[],
    index: number,
    entries: readonly PhpArrayEntry[] = [],
): ParsedPhpArrayResult =>
    relationResolve(index < tokens.length,
        () => {
            const token = tokens[index];
            return relationResolve(relationResolve(relationEqual(token.value, ']'), () => true, () => relationEqual(token.value, ')')),
                () => ({ entries: Object.freeze(entries), endIndex: index + 1 }),
                () => relationResolve(relationEqual(token.value, ','),
                    () => parseArrayBody(source, tokens, index + 1, entries),
                    () => parseArrayEntry(source, tokens, index, entries)));
        },
        () => ({ entries: Object.freeze(entries), endIndex: index }));

const parseArrayEntry = (
    source: string,
    tokens: readonly TokenDescriptor[],
    index: number,
    entries: readonly PhpArrayEntry[],
): ParsedPhpArrayResult => {
    const keyCandidate = relationResolve(tokenValueEquals(tokens, index + 1, '=>'),
        () => some(tokens[index]),
        () => none<TokenDescriptor>());
    const key = relationOptionFold(keyCandidate, () => none<PhpArrayKey>(), token => some(parseArrayKey(token)));
    const valueIndex = relationResolve(tokenValueEquals(tokens, index + 1, '=>'), () => index + 2, () => index);
    return parseArrayValue(source, tokens, valueIndex, key, entries);
};

const parseArrayKey = (token: TokenDescriptor): PhpArrayKey =>
    relationResolve(relationEqual(token.type, 'STRING'),
        () => ({ kind: 'string', value: token.value }),
        () => relationResolve(relationEqual(token.type, 'NUMBER'),
            () => ({ kind: 'integer', value: Number(token.value) }),
            () => ({ kind: 'expression', value: classifyAstTokens([token]) })));

const parseArrayValue = (
    source: string,
    tokens: readonly TokenDescriptor[],
    index: number,
    key: RelationOption<PhpArrayKey>,
    entries: readonly PhpArrayEntry[],
): ParsedPhpArrayResult => {
    const valueToken = tokens[index];
    return relationResolve(index < tokens.length,
        () => relationResolve(isNestedArrayStart(tokens, index),
            () => {
                const nested = parsePhpArray(source, tokens, index);
                const endToken = relationOptionFold(relationFirst(relationSlice(tokens, Math.max(0, nested.endIndex - 1), nested.endIndex), () => true), () => valueToken, token => token);
                const sourceRange = {
                    startOffset: createSourceOffset(valueToken.startOffset),
                    endOffset: createSourceOffset(endToken.endOffset),
                };
                const value = Object.freeze({ kind: 'nested_array' as const, entries: nested.entries, source: sourceRange });
                const entry = relationOptionFold(key,
                    () => ({ kind: 'positional' as const, value, source: sourceRange }),
                    current => ({ kind: 'keyed' as const, key: current, value, source: sourceRange }));
                return parseArrayBody(source, tokens, nested.endIndex, [...entries, entry]);
            },
            () => parseScalarValue(source, tokens, index, key, entries)),
        () => ({ entries: Object.freeze(entries), endIndex: index }));
};

const isNestedArrayStart = (tokens: readonly TokenDescriptor[], index: number): boolean =>
    relationResolve(tokenValueEquals(tokens, index, '['),
        () => true,
        () => relationAll([
            tokenValueEquals(tokens, index, 'array'),
            tokenKindEquals(tokens, index, 'IDENTIFIER'),
        ]));

const parseScalarValue = (
    source: string,
    tokens: readonly TokenDescriptor[],
    index: number,
    key: RelationOption<PhpArrayKey>,
    entries: readonly PhpArrayEntry[],
): ParsedPhpArrayResult => {
    const endIndex = locateValueEnd(tokens, index, 0);
    const astValue = classifyAstTokens(relationSlice(tokens, index, endIndex));
    const firstToken = tokens[index];
    const lastToken = relationOptionFold(relationFirst(relationSlice(tokens, Math.max(index, endIndex - 1), endIndex), () => true), () => firstToken, token => token);
    const sourceRange = {
        startOffset: createSourceOffset(firstToken.startOffset),
        endOffset: createSourceOffset(lastToken.endOffset),
    };
    const entry = relationOptionFold(key,
        () => ({ kind: 'positional' as const, value: astValue, source: sourceRange }),
        current => ({ kind: 'keyed' as const, key: current, value: astValue, source: sourceRange }));
    return parseArrayBody(source, tokens, endIndex, [...entries, entry]);
};

const locateValueEnd = (
    tokens: readonly TokenDescriptor[],
    index: number,
    depth: number,
): number =>
    relationResolve(index < tokens.length,
        () => {
            const token = tokens[index];
            const delimiter = relationAll([
                relationEqual(depth, 0),
                relationResolve(relationEqual(token.value, ','), () => true, () => relationResolve(relationEqual(token.value, ']'), () => true, () => relationEqual(token.value, ')'))),
            ]);
            const nextDepth = relationResolve(relationResolve(relationEqual(token.value, '('), () => true, () => relationEqual(token.value, '[')),
                () => depth + 1,
                () => relationResolve(relationResolve(relationEqual(token.value, ')'), () => true, () => relationEqual(token.value, ']')), () => depth - 1, () => depth));
            return relationResolve(delimiter,
                () => index,
                () => locateValueEnd(tokens, index + 1, nextDepth));
        },
        () => index);