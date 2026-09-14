/**
 * offsetCatamorphism.ts
 *
 * Catamorphic Offset Key Evaluator.
 * Zero Record, zero if, zero ternary.
 *
 * @module cli/parsers/php/ast
 */

import type { PhpGrammarNode, GrammarIdentifier, GrammarString, GrammarNumber, GrammarVariable, GrammarUnknown } from './grammar';

export interface OffsetVisitor<R> {
    readonly identifier: (node: GrammarIdentifier) => R;
    readonly string: (node: GrammarString) => R;
    readonly number: (node: GrammarNumber) => R;
    readonly variable: (node: GrammarVariable) => R;
    readonly unknown: (node: GrammarUnknown) => R;
}

export const OFFSET_STRING_VISITOR: OffsetVisitor<string> = Object.freeze({
    identifier: (n) => n.name,
    string: (n) => String(n.value),
    number: (n) => String(n.value),
    variable: (n) => `$${n.name}`,
    unknown: () => ''
});

export function matchOffset<R>(offset: PhpGrammarNode | undefined, visitor: OffsetVisitor<R>): R {
    const k = offset ? (offset.kind as keyof OffsetVisitor<R>) : 'unknown';
    const handler = visitor[k] ?? visitor.unknown;
    return handler(offset as any);
}

export function extractOffsetString(offset: PhpGrammarNode | undefined): string {
    return matchOffset(offset, OFFSET_STRING_VISITOR);
}
