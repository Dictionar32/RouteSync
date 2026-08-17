/**
 * @file AnalysisManager.ts
 * @description Registry-typed analysis caching and dependency invalidation.
 */
import { FIFOQueue } from '../utils/Queue';
import type { AnalysisKey } from '../passes/PassResult';
import type { AnalysisKeyName, AnalysisRegistry } from './AnalysisRegistry';
import { PassAnalysisStore } from './PassAnalysisStore';

type AnyAnalysisKey<R extends object> = AnalysisKey<R, AnalysisKeyName<R>>;

export class AnalysisDependencyGraph<R extends object = AnalysisRegistry> {
    private readonly dependentsMap = new Map<
        AnyAnalysisKey<R>,
        Set<AnyAnalysisKey<R>>
    >();

    private readonly dependenciesMap = new Map<
        AnyAnalysisKey<R>,
        Set<AnyAnalysisKey<R>>
    >();

    public addDependency<
        TParent extends AnalysisKeyName<R>,
        TChild extends AnalysisKeyName<R>,
    >(
        parent: AnalysisKey<R, TParent>,
        child: AnalysisKey<R, TChild>,
    ): void {
        const deps = this.dependentsMap.get(parent) ?? new Set<AnyAnalysisKey<R>>();
        deps.add(child);
        this.dependentsMap.set(parent, deps);

        const reverse = this.dependenciesMap.get(child) ?? new Set<AnyAnalysisKey<R>>();
        reverse.add(parent);
        this.dependenciesMap.set(child, reverse);
    }

    public removeDependency<
        TParent extends AnalysisKeyName<R>,
        TChild extends AnalysisKeyName<R>,
    >(
        parent: AnalysisKey<R, TParent>,
        child: AnalysisKey<R, TChild>,
    ): void {
        const deps = this.dependentsMap.get(parent);
        if (deps) {
            deps.delete(child);
            if (deps.size === 0) {
                this.dependentsMap.delete(parent);
            }
        }

        const reverse = this.dependenciesMap.get(child);
        if (reverse) {
            reverse.delete(parent);
            if (reverse.size === 0) {
                this.dependenciesMap.delete(child);
            }
        }
    }

    public dependents<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): ReadonlySet<AnyAnalysisKey<R>> {
        return this.dependentsMap.get(key) ?? new Set<AnyAnalysisKey<R>>();
    }

    public dependencies<K extends AnalysisKeyName<R>>(
        key: AnalysisKey<R, K>,
    ): ReadonlySet<AnyAnalysisKey<R>> {
        return this.dependenciesMap.get(key) ?? new Set<AnyAnalysisKey<R>>();
    }

    public dependencyCount(): number {
        let total = 0;
        for (const deps of this.dependentsMap.values()) {
            total += deps.size;
        }
        return total;
    }

    public clear(): void {
        this.dependentsMap.clear();
        this.dependenciesMap.clear();
    }
}

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
