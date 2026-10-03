/** Relation-native symbol reference graph. */
import { relationIndexAdd, relationIndexLookup, type RelationIndex, relationContains, relationInsert } from '../../../semantic/kernel/relationMembership';
import { relationOptionFold, relationFold, relationResolve } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/relationFoundation';
import type { RelationOption } from '../../../semantic/kernel/relationFoundation';

export interface SymbolReferenceGraph {
    readonly addReference: (fromId: string, toId: string) => void;
    readonly getReferences: (fromId: string) => RelationOption<readonly string[]>;
    readonly findReferencingSymbols: (symbolId: string) => readonly string[];
    readonly isUnused: (symbolId: string) => boolean;
    readonly clear: () => void;
    readonly countTotalReferences: () => number;
}

export const createSymbolReferenceGraph = (): SymbolReferenceGraph => {
    let referenceGraph: RelationIndex<string, readonly string[]> = Object.freeze([]);
    const getReferences = (fromId: string): RelationOption<readonly string[]> => relationIndexLookup(referenceGraph, fromId);
    const addReference = (fromId: string, toId: string): void => {
        const refs = relationOptionFold(getReferences(fromId), () => [], value => value);
        referenceGraph = relationIndexAdd(referenceGraph, fromId, relationInsert(refs, toId));
    };
    const findReferencingSymbols = (symbolId: string): readonly string[] => relationFold(
        referenceGraph,
        Object.freeze([] as readonly string[]),
        (referencers, entry) => relationResolve(relationContains(entry[1], symbolId), () => [...referencers, entry[0]], () => referencers),
    );
    return {
        addReference,
        getReferences,
        findReferencingSymbols,
        isUnused: symbolId => relationEqual(findReferencingSymbols(symbolId).length, 0),
        clear: () => { referenceGraph = Object.freeze([]); },
        countTotalReferences: () => relationFold(referenceGraph, 0, (total, entry) => total + entry[1].length),
    };
};
