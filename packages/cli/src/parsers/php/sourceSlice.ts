/** Extract source text from a parser node with verified location data. */
import { relationOptionalFold } from '@routesync/core';
import type { GrammarLocation, PhpGrammarNode } from './ast/grammar';

export function sliceNodeSource(node: PhpGrammarNode, source: string): string {
  return relationOptionalFold<GrammarLocation, string>(
    node.loc,
    () => { throw Error(`PHP AST source boundary: node has no usable location for ${node.kind}`); },
    location => source.slice(location.start.offset, location.end.offset),
  );
}
