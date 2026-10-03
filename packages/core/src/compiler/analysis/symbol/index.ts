/** Symbol analysis sub-domain: relation-backed declarations and projections. */
export { type SymbolNode, type SymbolStats } from './symbolTypes';
export { createSymbolReferenceGraph, type SymbolReferenceGraph } from './symbolGraph';
export { resolveClassHierarchy, filterSymbolsByKind, filterSymbolsByNamespace, filterSymbolsByParent } from './symbolHierarchy';
