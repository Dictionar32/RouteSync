/**
 * symbolHierarchy.ts
 *
 * Traversal and query helpers for symbol inheritance and scope hierarchy.
 *
 * @module compiler/analysis/symbol
 */

import type { SymbolNode } from './symbolTypes';

export function resolveClassHierarchy(
    classId: string,
    symbolLookup: (id: string) => SymbolNode | undefined
): readonly string[] {
    const hierarchy: string[] = [classId];
    let current = symbolLookup(classId);

    while (current?.extendsId) {
        hierarchy.push(current.extendsId);
        current = symbolLookup(current.extendsId);

        // Prevent infinite loop
        if (hierarchy.length > 100) break;
    }

    return hierarchy;
}

export function filterSymbolsByKind(
    symbols: Iterable<SymbolNode>,
    kind: SymbolNode['kind']
): readonly SymbolNode[] {
    return Array.from(symbols).filter(s => s.kind === kind);
}

export function filterSymbolsByNamespace(
    symbols: Iterable<SymbolNode>,
    namespace: string
): readonly SymbolNode[] {
    return Array.from(symbols).filter(s => s.namespace === namespace);
}

export function filterSymbolsByParent(
    symbols: Iterable<SymbolNode>,
    parentId: string
): readonly SymbolNode[] {
    return Array.from(symbols).filter(s => s.parentId === parentId);
}
