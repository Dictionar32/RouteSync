/** Extract source text from a parser node with verified location data. */
import { relationOptionalFold } from '@routesync/core';
import type { GrammarLocation, PhpGrammarNode } from './ast/grammar';

const sliceNodeSourceImplementation = (node: PhpGrammarNode, source: string): string => {
  return relationOptionalFold<GrammarLocation, string>(
    node.loc,
    () => { throw Error(`PHP AST source boundary: node has no usable location for ${node.kind}`); },
    location => source.slice(location.start.offset, location.end.offset),
  );
}


export interface PhpNodeSourceSliceOperationInterface {
  readonly slice: (node: PhpGrammarNode, source: string) => string;
}

export const phpNodeSourceSliceOperation: PhpNodeSourceSliceOperationInterface = Object.freeze({
  slice: sliceNodeSourceImplementation,
});
