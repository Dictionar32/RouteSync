/**
 * AnalysisManager.ts
 *
 * Active Consumer: Registry-typed analysis caching and dependency invalidation.
 *
 * @module compiler/analysis/AnalysisManager
 */

import { FIFOQueue } from '../utils/Queue';
import type { AnalysisKey } from '../passes/PassResult';
import type { AnalysisKeyName, AnalysisRegistry } from './AnalysisRegistry';
import { PassAnalysisStore } from './PassAnalysisStore';
import {
    AnalysisDependencyGraph,
    type AnyAnalysisKey
} from './manager';

export { AnalysisDependencyGraph };

export class AnalysisManager<R extends object = AnalysisRegistry> {
    private readonly cache = new PassAnalysisStore<R>();
    private readonly graph = new AnalysisDependencyGraph<R>();

    public get<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): R[K] | undefined {
        return this.cache.get(key);
    }

    public set<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
        value: R[K],
    ): void {
        this.cache.set(key, value);
    }

    public has<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): boolean {
        return this.cache.has(key);
    }

    public registerDependency<
        TParent extends AnalysisKeyName<R>,
        TChild extends AnalysisKeyName<R>,
    >(
        parent: AnalysisKey<R, TParent>,
        child: AnalysisKey<R, TChild>,
    ): void {
        this.graph.addDependency(parent, child);
    }

    public collectDependents<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): ReadonlySet<AnyAnalysisKey<R>> {
        const visited = new Set<AnyAnalysisKey<R>>();
        const queue = new FIFOQueue<AnyAnalysisKey<R>>();
        queue.enqueue(key);

        while (!queue.isEmpty) {
            const current = queue.dequeue();
            if (!current || visited.has(current)) {
                continue;
            }

            visited.add(current);
            for (const dependent of this.graph.dependents(current)) {
                queue.enqueue(dependent);
            }
        }

        return visited;
    }

    public invalidate<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): void {
        for (const dependent of this.collectDependents(key)) {
            this.cache.delete(dependent);
        }
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
        this.graph.clear();
    }

    public getStats(): {
        cachedAnalyses: number;
        dependencies: number;
    } {
        return {
            cachedAnalyses: this.cache.size,
            dependencies: this.graph.dependencyCount(),
        };
    }
}
