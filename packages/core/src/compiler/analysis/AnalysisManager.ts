/**
 * @file AnalysisManager.ts
 * @description Analysis result caching dan dependency tracking
 */

import type { AnalysisKey } from '../passes/PassResult';
import { FIFOQueue } from '../utils/Queue';

/**
 * Analysis dependency graph
 * 
 * Tracks dependencies between analyses untuk proper invalidation.
 * When analysis A changes, all dependent analyses must be invalidated.
 */
export class AnalysisDependencyGraph {
    /** Map dari analysis ke analyses yang depend on it */
    private dependentsMap = new Map<AnalysisKey<unknown>, Set<AnalysisKey<unknown>>>();

    /** Map dari analysis ke analyses it depends on */
    private dependenciesMap = new Map<AnalysisKey<unknown>, Set<AnalysisKey<unknown>>>();

    /**
     * Add dependency: child depends on parent
     * 
     * @param parent - Analysis yang depended upon
     * @param child - Analysis yang depends on parent
     */
    public addDependency(parent: AnalysisKey<unknown>, child: AnalysisKey<unknown>): void {
        // Track dependents (forward edges)
        const deps = this.dependentsMap.get(parent) ?? new Set();
        deps.add(child);
        this.dependentsMap.set(parent, deps);

        // Track dependencies (backward edges)
        const revs = this.dependenciesMap.get(child) ?? new Set();
        revs.add(parent);
        this.dependenciesMap.set(child, revs);
    }

    /**
     * Remove dependency
     * 
     * @param parent - Parent analysis
     * @param child - Child analysis
     */
    public removeDependency(parent: AnalysisKey<unknown>, child: AnalysisKey<unknown>): void {
        const deps = this.dependentsMap.get(parent);
        if (deps) {
            deps.delete(child);
            if (deps.size === 0) {
                this.dependentsMap.delete(parent);
            }
        }

        const revs = this.dependenciesMap.get(child);
        if (revs) {
            revs.delete(parent);
            if (revs.size === 0) {
                this.dependenciesMap.delete(child);
            }
        }
    }

    /**
     * Get all analyses yang depend on given analysis
     * 
     * @param key - Analysis key
     * @returns Set of dependent analyses
     */
    public dependents(key: AnalysisKey<unknown>): ReadonlySet<AnalysisKey<unknown>> {
        return this.dependentsMap.get(key) ?? new Set();
    }

    /**
     * Get all analyses yang this analysis depends on
     * 
     * @param key - Analysis key
     * @returns Set of dependency analyses
     */
    public dependencies(key: AnalysisKey<unknown>): ReadonlySet<AnalysisKey<unknown>> {
        return this.dependenciesMap.get(key) ?? new Set();
    }

    /**
     * Clear all dependencies
     */
    public clear(): void {
        this.dependentsMap.clear();
        this.dependenciesMap.clear();
    }
}

/**
 * Analysis result manager dengan caching dan invalidation
 * 
 * Manages:
 * - Cached analysis results
 * - Analysis dependencies
 * - Automatic invalidation when dependencies change
 * 
 * @example
 * ```typescript
 * const manager = new AnalysisManager();
 * 
 * // Store analysis result
 * manager.set(CFGAnalysis, controlFlowGraph);
 * 
 * // Register dependency
 * manager.registerDependency(DominatorsAnalysis, CFGAnalysis);
 * 
 * // Retrieve result
 * const cfg = manager.get(CFGAnalysis);
 * 
 * // Invalidate (also invalidates dependents)
 * manager.invalidate(CFGAnalysis); // Will also invalidate DominatorsAnalysis
 * ```
 */
export class AnalysisManager {
    /** Cache dari analysis results */
    private cache = new Map<AnalysisKey<unknown>, unknown>();

    /** Dependency graph */
    private graph = new AnalysisDependencyGraph();

    /**
     * Get cached analysis result
     * 
     * @param key - Analysis key
     * @returns Cached result atau undefined
     */
    public get<T>(key: AnalysisKey<T>): T | undefined {
        return this.cache.get(key as unknown as AnalysisKey<unknown>) as T | undefined;
    }

    /**
     * Store analysis result dalam cache
     * 
     * @param key - Analysis key
     * @param value - Analysis result
     */
    public set<T>(key: AnalysisKey<T>, value: T): void {
        this.cache.set(key as unknown as AnalysisKey<unknown>, value);
    }

    /**
     * Check apakah analysis result is cached
     * 
     * @param key - Analysis key
     * @returns True jika result is cached
     */
    public has<T>(key: AnalysisKey<T>): boolean {
        return this.cache.has(key as unknown as AnalysisKey<unknown>);
    }

    /**
     * Register dependency between analyses
     * 
     * @param parent - Analysis yang depended upon
     * @param child - Analysis yang depends on parent
     */
    public registerDependency(
        parent: AnalysisKey<unknown>,
        child: AnalysisKey<unknown>
    ): void {
        this.graph.addDependency(parent, child);
    }

    /**
     * Collect all analyses transitively dependent on given analysis
     * 
     * Uses BFS untuk traverse dependency graph.
     * 
     * @param key - Root analysis key
     * @returns Set of all dependent analyses
     */
    public collectDependents(key: AnalysisKey<unknown>): ReadonlySet<AnalysisKey<unknown>> {
        const visited = new Set<AnalysisKey<unknown>>();
        const queue = new FIFOQueue<AnalysisKey<unknown>>();
        queue.enqueue(key);

        while (!queue.isEmpty) {
            const current = queue.dequeue()!;

            if (visited.has(current)) continue;
            visited.add(current);

            const deps = this.graph.dependents(current);
            for (const dep of deps) {
                queue.enqueue(dep);
            }
        }

        return visited;
    }

    /**
     * Invalidate analysis dan all dependent analyses
     * 
     * Removes cached results untuk analysis dan semua analyses yang depend on it.
     * 
     * @param key - Analysis key to invalidate
     */
    public invalidate(key: AnalysisKey<unknown>): void {
        const dependents = this.collectDependents(key);

        for (const dep of dependents) {
            this.cache.delete(dep);
        }
    }

    /**
     * Clear all cached results dan dependencies
     */
    public clear(): void {
        this.cache.clear();
        this.graph.clear();
    }

    /**
     * Get statistics about cached analyses
     */
    public getStats(): {
        cachedAnalyses: number;
        dependencies: number;
    } {
        let totalDeps = 0;
        for (const deps of this.graph['dependentsMap'].values()) {
            totalDeps += deps.size;
        }

        return {
            cachedAnalyses: this.cache.size,
            dependencies: totalDeps
        };
    }
}
