/**
 * Symbol analysis sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */

export { type SymbolNode, type SymbolStats } from './symbolTypes';
export { SymbolReferenceGraph } from './symbolGraph';
export {
    resolveClassHierarchy,
    filterSymbolsByKind,
    filterSymbolsByNamespace,
    filterSymbolsByParent
} from './symbolHierarchy';
