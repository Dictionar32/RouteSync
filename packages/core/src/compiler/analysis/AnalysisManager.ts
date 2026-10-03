/** Relation-native analysis registry, dependency closure, and invalidation. */
import type { AnalysisKey } from '../passes/PassResult';
import type { AnalysisKeyName, AnalysisRegistry } from './AnalysisRegistry';
import { createPassAnalysisStore, type PassAnalysisStore } from './PassAnalysisStore';
import { createAnalysisDependencyGraph, type AnalysisDependencyGraph, type AnyAnalysisKey } from './manager';
import { relationContains } from '../../semantic/kernel/relationMembership';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import { relationExpand, relationGate, relationFold, type RelationOption } from '../../semantic/kernel/relationalSequence';

export type { AnalysisDependencyGraph };

export interface AnalysisManager<R extends object = AnalysisRegistry> {
    readonly get: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => RelationOption<R[K]>;
    readonly set: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>, value: R[K]) => void;
    readonly has: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => boolean;
    readonly registerDependency: <TParent extends AnalysisKeyName<R>, TChild extends AnalysisKeyName<R>>(parent: AnalysisKey<R, TParent>, child: AnalysisKey<R, TChild>) => void;
    readonly collectDependents: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => readonly AnyAnalysisKey<R>[];
    readonly invalidate: <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>) => void;
    readonly clear: () => void;
    readonly getStats: () => { readonly cachedAnalyses: number; readonly dependencies: number };
}

const closure = <R extends object>(graph: AnalysisDependencyGraph<R>, frontier: readonly AnyAnalysisKey<R>[], visited: readonly AnyAnalysisKey<R>[]): readonly AnyAnalysisKey<R>[] =>
    relationGate(relationEqual(frontier.length, 0), () => visited, () => {
        const current = frontier[0];
        const tail = frontier.slice(1);
        return relationGate(relationContains(visited, current), () => closure(graph, tail, visited), () => {
            const next = relationExpand([current], value => graph.dependents(value));
            return closure(graph, [...tail, ...next], Object.freeze([...visited, current]));
        });
    });

export function AnalysisManager<R extends object = AnalysisRegistry>(): AnalysisManager<R> {
    const cache: PassAnalysisStore<R> = createPassAnalysisStore<R>();
    const graph: AnalysisDependencyGraph<R> = createAnalysisDependencyGraph<R>();
    const get = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): RelationOption<R[K]> => cache.get(key);
    const set = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>, value: R[K]): void => cache.set(key, value);
    const has = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): boolean => cache.has(key);
    const registerDependency = <TParent extends AnalysisKeyName<R>, TChild extends AnalysisKeyName<R>>(parent: AnalysisKey<R, TParent>, child: AnalysisKey<R, TChild>): void => graph.addDependency(parent, child);
    const collectDependents = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): readonly AnyAnalysisKey<R>[] => closure(graph, [key as AnyAnalysisKey<R>], []);
    const invalidate = <K extends AnalysisKeyName<R>>(key: AnalysisKey<R, K>): void => {
        relationFold(collectDependents(key), false, (done, dependent) => { cache.delete(dependent); return done; });
        cache.delete(key);
    };
    const clear = (): void => { cache.clear(); graph.clear(); };
    const getStats = (): { readonly cachedAnalyses: number; readonly dependencies: number } => ({ cachedAnalyses: cache.size, dependencies: graph.dependencyCount() });
    return Object.freeze({ get, set, has, registerDependency, collectDependents, invalidate, clear, getStats });
}
