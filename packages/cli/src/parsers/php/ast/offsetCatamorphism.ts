/**
 * Exhaustive offset-key fold. Unknown/missing offset is a parser boundary error.
 */

import type { PhpGrammarNode, GrammarIdentifier, GrammarString, GrammarNumber, GrammarVariable } from './grammar';

export interface OffsetVisitor<R> {
    readonly identifier: (node: GrammarIdentifier) => R;
    readonly string: (node: GrammarString) => R;
    readonly number: (node: GrammarNumber) => R;
    readonly variable: (node: GrammarVariable) => R;
}

export const OFFSET_STRING_VISITOR: OffsetVisitor<string> = Object.freeze({
    identifier: node => node.name,
    string: node => String(node.value),
    number: node => String(node.value),
    variable: node => `$${node.name}`
});

export function matchOffset<R>(offset: PhpGrammarNode, visitor: OffsetVisitor<R>): R {
    switch (offset.kind) {
        case 'identifier': return visitor.identifier(offset);
        case 'string': return visitor.string(offset);
        case 'number': return visitor.number(offset);
        case 'variable': return visitor.variable(offset);
        default: throw new Error(`PHP AST boundary: invalid offset node ${offset.kind}`);
    }
}

export function extractOffsetString(offset: PhpGrammarNode): string {
    return matchOffset(offset, OFFSET_STRING_VISITOR);
}
