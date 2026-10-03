/** Relation-backed analysis dependency graph. */
import type { AnalysisKey } from '../../passes/PassResult';
import type { AnalysisKeyName, AnalysisRegistry } from '../AnalysisRegistry';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { relationOptionFold, relationSelect, relationProject, relationFold } from '../../../semantic/kernel/relationalSequence';
import { relationNotEqual } from '../../../semantic/kernel/semanticRelations';

export type AnyAnalysisKey<R extends object> = AnalysisKey<R, AnalysisKeyName<R>>;
type Adjacency<R extends object> = RelationIndex<AnyAnalysisKey<R>, readonly AnyAnalysisKey<R>[]>;

export interface AnalysisDependencyGraph<R extends object = AnalysisRegistry> {
    readonly addDependency: <TParent extends AnalysisKeyName<R>, TChild extends AnalysisKeyName<R>>(parent: AnalysisKey<R, TParent>, child: AnalysisKey<R, TChild>) => void;
    readonly removeDependency: <TParent extends AnalysisKeyName<R>, TChild extends AnalysisKeyName<R>>(parent: AnalysisKey<R, TParent>, child: AnalysisKey<R, TChild>) => void;
    readonly dependents: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => readonly AnyAnalysisKey<R>[];
    readonly dependencies: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => readonly AnyAnalysisKey<R>[];
    readonly dependencyCount: () => number;
    readonly clear: () => void;
}

const adjacencyRead = <R extends object>(index: Adjacency<R>, key: AnyAnalysisKey<R>): readonly AnyAnalysisKey<R>[] =>
    relationOptionFold(relationIndexLookup(index, key), () => [], value => value);

const adjacencyWrite = <R extends object>(index: Adjacency<R>, key: AnyAnalysisKey<R>, value: readonly AnyAnalysisKey<R>[]): Adjacency<R> =>
    relationIndexAdd(index, key, Object.freeze(relationSelect(value, candidate => relationNotEqual(candidate, key))));

const adjacencyRemove = <R extends object>(index: Adjacency<R>, key: AnyAnalysisKey<R>, target: AnyAnalysisKey<R>): Adjacency<R> =>
    relationIndexAdd(index, key, Object.freeze(relationSelect(adjacencyRead(index, key), candidate => relationNotEqual(candidate, target))));

export const createAnalysisDependencyGraph = <R extends object = AnalysisRegistry>(): AnalysisDependencyGraph<R> => {
    let dependentsIndex: Adjacency<R> = Object.freeze([]);
    let dependenciesIndex: Adjacency<R> = Object.freeze([]);
    const addDependency = <TParent extends AnalysisKeyName<R>, TChild extends AnalysisKeyName<R>>(parent: AnalysisKey<R, TParent>, child: AnalysisKey<R, TChild>): void => {
        const parentKey = parent as AnyAnalysisKey<R>;
        const childKey = child as AnyAnalysisKey<R>;
        dependentsIndex = adjacencyWrite(dependentsIndex, parentKey, [...adjacencyRead(dependentsIndex, parentKey), childKey]);
        dependenciesIndex = adjacencyWrite(dependenciesIndex, childKey, [...adjacencyRead(dependenciesIndex, childKey), parentKey]);
    };
    const removeDependency = <TParent extends AnalysisKeyName<R>, TChild extends AnalysisKeyName<R>>(parent: AnalysisKey<R, TParent>, child: AnalysisKey<R, TChild>): void => {
        dependentsIndex = adjacencyRemove(dependentsIndex, parent as AnyAnalysisKey<R>, child as AnyAnalysisKey<R>);
        dependenciesIndex = adjacencyRemove(dependenciesIndex, child as AnyAnalysisKey<R>, parent as AnyAnalysisKey<R>);
    };
    const dependents = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): readonly AnyAnalysisKey<R>[] => adjacencyRead(dependentsIndex, key as AnyAnalysisKey<R>);
    const dependencies = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): readonly AnyAnalysisKey<R>[] => adjacencyRead(dependenciesIndex, key as AnyAnalysisKey<R>);
    const dependencyCount = (): number => relationFold(dependentsIndex, 0, (total, entry) => total + entry[1].length);
    const clear = (): void => { dependentsIndex = Object.freeze([]); dependenciesIndex = Object.freeze([]); };
    return Object.freeze({ addDependency, removeDependency, dependents, dependencies, dependencyCount, clear });
};
