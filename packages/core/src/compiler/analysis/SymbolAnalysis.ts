/** Relation-backed symbol database and reference analysis. */
import type { SymbolNode, SymbolStats } from './symbol';
import { createSymbolReferenceGraph, type SymbolReferenceGraph, resolveClassHierarchy, filterSymbolsByKind, filterSymbolsByNamespace, filterSymbolsByParent } from './symbol';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../semantic/foundation/relationMembership';
import { relationSelect, relationFold } from '../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../semantic/foundation/relationFoundation';
import type { RelationOption } from '../../semantic/foundation/relationFoundation';

export { type SymbolNode, type SymbolStats };

export interface SymbolDatabase {
    readonly registerSymbol: (node: SymbolNode) => void;
    readonly addReference: (fromId: string, toId: string) => void;
    readonly getSymbol: (id: string) => RelationOption<SymbolNode>;
    readonly getReferences: (fromId: string) => RelationOption<readonly string[]>;
    readonly findReferencingSymbols: (symbolId: string) => readonly string[];
    readonly getSymbolsByKind: (kind: SymbolNode['kind']) => readonly SymbolNode[];
    readonly getSymbolsInNamespace: (namespace: string) => readonly SymbolNode[];
    readonly getChildren: (parentId: string) => readonly SymbolNode[];
    readonly getClassHierarchy: (classId: string) => readonly string[];
    readonly isUnused: (symbolId: string) => boolean;
    readonly clear: () => void;
    readonly getStats: () => SymbolStats;
}

export const createSymbolDatabase = (): SymbolDatabase => {
    let symbols: RelationIndex<string, SymbolNode> = Object.freeze([]);
    const referenceGraph: SymbolReferenceGraph = createSymbolReferenceGraph();
    const getSymbol = (id: string): RelationOption<SymbolNode> => relationIndexLookup(symbols, id);
    const symbolValues = (): readonly SymbolNode[] => relationFold(symbols, Object.freeze([] as readonly SymbolNode[]), (output, entry) => [...output, entry[1]]);
    return {
        registerSymbol: node => { symbols = relationIndexAdd(symbols, node.id, node); },
        addReference: (fromId, toId) => referenceGraph.addReference(fromId, toId),
        getSymbol,
        getReferences: referenceGraph.getReferences,
        findReferencingSymbols: referenceGraph.findReferencingSymbols,
        getSymbolsByKind: kind => filterSymbolsByKind(symbolValues(), kind),
        getSymbolsInNamespace: namespace => filterSymbolsByNamespace(symbolValues(), namespace),
        getChildren: parentId => filterSymbolsByParent(symbolValues(), parentId),
        getClassHierarchy: classId => resolveClassHierarchy(classId, getSymbol),
        isUnused: referenceGraph.isUnused,
        clear: () => { symbols = Object.freeze([]); referenceGraph.clear(); },
        getStats: () => {
            const values = symbolValues();
            return {
                totalSymbols: values.length,
                classes: relationSelect(values, symbol => relationEqual(symbol.kind, 'class')).length,
                methods: relationSelect(values, symbol => relationEqual(symbol.kind, 'method')).length,
                properties: relationSelect(values, symbol => relationEqual(symbol.kind, 'property')).length,
                totalReferences: referenceGraph.countTotalReferences(),
            };
        },
    };
};
