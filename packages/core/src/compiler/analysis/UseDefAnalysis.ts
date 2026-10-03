/** Relation-backed use-def analysis. */
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../semantic/kernel/relationMembership';
import { relationOptionFold, relationSelect, relationFold, relationGate, type RelationOption } from '../../semantic/kernel/relationalSequence';
import { relationEqual, relationNotEqual } from '../../semantic/kernel/semanticRelations';

export interface UseDefGraph {
    readonly recordDef: (valueId: number, instructionId: number) => void;
    readonly recordUse: (valueId: number, instructionId: number) => void;
    readonly getDefinition: (valueId: number) => RelationOption<number>;
    readonly getUses: (valueId: number) => readonly number[];
    readonly isUsed: (valueId: number) => boolean;
    readonly removeUse: (valueId: number, instructionId: number) => void;
    readonly clear: () => void;
    readonly getStats: () => { readonly totalDefs: number; readonly totalUses: number; readonly unusedValues: number };
}

export function UseDefGraph(): UseDefGraph {
    let defs: RelationIndex<number, number> = Object.freeze([]);
    let uses: RelationIndex<number, readonly number[]> = Object.freeze([]);
    const recordDef = (valueId: number, instructionId: number): void => { defs = relationIndexAdd(defs, valueId, instructionId); };
    const recordUse = (valueId: number, instructionId: number): void => {
        const previous = relationOptionFold(relationIndexLookup(uses, valueId), () => [], value => value);
        uses = relationIndexAdd(uses, valueId, Object.freeze([...previous, instructionId]));
    };
    const getDefinition = (valueId: number): RelationOption<number> => relationIndexLookup(defs, valueId);
    const getUses = (valueId: number): readonly number[] => relationOptionFold(relationIndexLookup(uses, valueId), () => [], value => value);
    const isUsed = (valueId: number): boolean => getUses(valueId).length > 0;
    const removeUse = (valueId: number, instructionId: number): void => {
        const next = relationSelect(getUses(valueId), value => relationNotEqual(value, instructionId));
        uses = relationGate(relationEqual(next.length, 0), () => relationSelect(uses, entry => relationNotEqual(entry[0], valueId)), () => relationIndexAdd(uses, valueId, Object.freeze(next)));
    };
    const clear = (): void => { defs = Object.freeze([]); uses = Object.freeze([]); };
    const getStats = (): { readonly totalDefs: number; readonly totalUses: number; readonly unusedValues: number } => ({
        totalDefs: defs.length,
        totalUses: relationFold(uses, 0, (total, entry) => total + entry[1].length),
        unusedValues: relationSelect(uses, entry => relationEqual(entry[1].length, 0)).length,
    });
    return Object.freeze({ recordDef, recordUse, getDefinition, getUses, isUsed, removeUse, clear, getStats });
}
