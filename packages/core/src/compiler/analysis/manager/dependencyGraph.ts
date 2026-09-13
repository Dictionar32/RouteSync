/**
 * dependencyGraph.ts
 *
 * Dependency graph tracking for registry-typed analysis passes.
 *
 * @module compiler/analysis/manager
 */

import type { AnalysisKey } from '../../passes/PassResult';
import type { AnalysisKeyName, AnalysisRegistry } from '../AnalysisRegistry';

export type AnyAnalysisKey<R extends object> = AnalysisKey<R, AnalysisKeyName<R>>;

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
