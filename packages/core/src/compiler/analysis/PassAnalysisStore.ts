/** Relation-backed analysis artifact storage. */
import type { AnalysisKey } from '../passes/PassResult';
import type { AnalysisKeyName, AnalysisRegistry } from './AnalysisRegistry';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../semantic/kernel/relationMembership';
import { relationOptionFold, relationSelect, type RelationOption } from '../../semantic/kernel/relationalSequence';
import { relationEqual, relationNotEqual } from '../../semantic/kernel/semanticRelations';

export interface PassAnalysisStore<R extends object = AnalysisRegistry> {
    readonly get: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => RelationOption<R[K]>;
    readonly set: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>, value: R[K]) => void;
    readonly has: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => boolean;
    readonly delete: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => boolean;
    readonly clear: () => void;
    readonly size: number;
}

export const createPassAnalysisStore = <R extends object = AnalysisRegistry>(): PassAnalysisStore<R> => {
    let values: RelationIndex<string, R[keyof R]> = Object.freeze([]);
    const get = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): RelationOption<R[K]> =>
        relationIndexLookup(values, key.name) as RelationOption<R[K]>;
    const set = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>, value: R[K]): void => {
        values = relationIndexAdd(values, key.name, value);
    };
    const has = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): boolean =>
        relationEqual(get(key).kind, 'some');
    const remove = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): boolean => {
        const existed = has(key);
        values = Object.freeze(relationSelect(values, entry => relationNotEqual(entry[0], key.name)));
        return existed;
    };
    const clear = (): void => { values = Object.freeze([]); };
    return Object.freeze({ get, set, has, delete: remove, clear, get size(): number { return values.length; } });
};
