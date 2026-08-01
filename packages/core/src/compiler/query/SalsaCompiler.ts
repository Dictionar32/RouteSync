/**
 * @fileoverview Salsa-inspired incremental compilation system
 * @module compiler/query/SalsaCompiler
 */

import type { FileSpan } from '../types/FileSpan';
import type { SemanticType } from '../types/SemanticType';
import { PrimitiveType, PrimitiveKind } from '../types/SemanticType';
/**
 * Unique identifier for a query
 */
export interface QueryKey {
    readonly queryName: string;
    readonly targetId: string;
    readonly optionsHash: string;
}

/**
 * Node in the query dependency graph
 */
export interface QueryNode {
    readonly key: QueryKey;
    readonly value: unknown;
    readonly dependencies: ReadonlySet<string>;
    readonly dependents: ReadonlySet<string>;
    readonly lastChangedRevision: number;
    readonly lastVerifiedRevision: number;
}

/**
 * Context information for a query
 */
export interface QueryContext {
    readonly packageId?: string;
    readonly moduleId?: string;
    readonly symbolId?: string;
}

/**
 * Stack frame for query execution
 */
export interface QueryFrame {
    readonly key: QueryKey;
    readonly queryKind: string;
    readonly context?: QueryContext;
    readonly span?: FileSpan;
}

/**
 * Error thrown when a query cycle is detected
 */
export class QueryCycleError extends Error {
    constructor(
        message: string,
        public readonly queryStack: readonly QueryFrame[]
    ) {
        super(message);
        this.name = 'QueryCycleError';
    }
}

/**
 * Simple symbol database interface
 */
import { SymbolDatabase } from '../analysis';

/**
 * Salsa-inspired incremental compilation engine
 * 
 * Implements demand-driven computation with:
 * - Fine-grained dependency tracking
 * - Cycle detection
 * - Incremental invalidation
 * - Revision-based caching
 * 
 * Based on the Salsa framework: https://salsa-rs.github.io/salsa/
 * 
 * @example
 * ```typescript
 * const compiler = new SalsaCompiler(symbolDb);
 * 
 * const type = compiler.typecheck('User', 1);
 * 
 * // Later revisions reuse results if dependencies haven't changed
 * const cachedType = compiler.typecheck('User', 2);
 * ```
 */
export class SalsaCompiler {
    private queryGraph = new Map<string, QueryNode>();
    private activeQueries = new Set<string>();
    private activeQueryStack: string[] = [];
    private queryKeys = new Map<string, QueryKey>();

    constructor(
        private readonly symbolDb: SymbolDatabase
    ) { }

    /**
     * Executes a query with incremental caching
     * 
     * @template I Input type
     * @template O Output type
     * @param key Query key
     * @param compute Computation function
     * @param input Query input
     * @param currentRevision Current revision number
     * @returns Computed or cached result
     * @throws {QueryCycleError} If a query cycle is detected
     */
    public executeQuery<I, O>(
        key: QueryKey,
        compute: (input: I) => O,
        input: I,
        currentRevision: number
    ): O {
        const keyStr = `${key.queryName}:${key.targetId}:${key.optionsHash}`;

        // Detect cycles
        if (this.activeQueries.has(keyStr)) {
            const cycleFrames = this.activeQueryStack.map(k => {
                const queryKey = this.queryKeys.get(k)!;
                return {
                    key: queryKey,
                    queryKind: queryKey.queryName,
                    context: {
                        symbolId: queryKey.targetId
                    }
                };
            });
            cycleFrames.push({
                key,
                queryKind: key.queryName,
                context: {
                    symbolId: key.targetId
                }
            });
            const cyclePath = [...this.activeQueryStack, keyStr].join(' -> ');
            throw new QueryCycleError(`Query cycle detected: ${cyclePath}`, cycleFrames);
        }

        // Track dependency from parent
        if (this.activeQueryStack.length > 0) {
            const parentKey = this.activeQueryStack[this.activeQueryStack.length - 1]!;
            const parentNode = this.queryGraph.get(parentKey);
            if (parentNode) {
                const nextDeps = new Set([...parentNode.dependencies, keyStr]);
                this.queryGraph.set(parentKey, { ...parentNode, dependencies: nextDeps });
            }

            const childNode = this.queryGraph.get(keyStr);
            if (childNode) {
                const nextDepsOfChild = new Set([...childNode.dependents, parentKey]);
                this.queryGraph.set(keyStr, { ...childNode, dependents: nextDepsOfChild });
            }
        }

        // Check cache
        const cached = this.queryGraph.get(keyStr);
        if (cached) {
            let dependenciesValid = true;
            for (const depKey of cached.dependencies) {
                const depNode = this.queryGraph.get(depKey);
                if (!depNode || depNode.lastChangedRevision > cached.lastVerifiedRevision) {
                    dependenciesValid = false;
                    break;
                }
            }

            if (dependenciesValid && cached.lastVerifiedRevision === currentRevision) {
                return cached.value as O;
            }
        }

        // Execute query
        this.activeQueries.add(keyStr);
        this.queryKeys.set(keyStr, key);
        this.activeQueryStack.push(keyStr);
        const existingNode = this.queryGraph.get(keyStr);
        this.queryGraph.set(keyStr, {
            key,
            value: existingNode ? existingNode.value : undefined,
            dependencies: new Set(),
            dependents: existingNode ? existingNode.dependents : new Set(),
            lastChangedRevision: existingNode ? existingNode.lastChangedRevision : currentRevision,
            lastVerifiedRevision: currentRevision
        });

        try {
            const value = compute(input);
            const node = this.queryGraph.get(keyStr);
            if (node) {
                const valueChanged = JSON.stringify(node.value) !== JSON.stringify(value);
                this.queryGraph.set(keyStr, {
                    ...node,
                    value,
                    lastChangedRevision: valueChanged ? currentRevision : node.lastChangedRevision,
                    lastVerifiedRevision: currentRevision
                });

                if (valueChanged) {
                    this.invalidateDependents(keyStr, currentRevision);
                }
            }
            return value;
        } finally {
            this.activeQueries.delete(keyStr);
            this.activeQueryStack.pop();
        }
    }

    /**
     * Invalidates all queries that depend on the given query
     * 
     * @param keyStr Query key string
     * @param revision Current revision
     * @private
     */
    private invalidateDependents(keyStr: string, revision: number): void {
        const queue = [keyStr];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const current = queue.shift()!;
            visited.add(current);

            const node = this.queryGraph.get(current);
            if (node) {
                for (const dep of node.dependents) {
                    if (!visited.has(dep)) {
                        const depNode = this.queryGraph.get(dep);
                        if (depNode) {
                            this.queryGraph.set(dep, {
                                ...depNode,
                                lastVerifiedRevision: revision - 1
                            });
                            queue.push(dep);
                        }
                    }
                }
            }
        }
    }

    /**
     * Example: Typecheck query
     * 
     * @param symbolId Symbol identifier
     * @param revision Current revision
     * @returns Semantic type of the symbol
     */
    public typecheck(symbolId: string, revision: number): SemanticType {
        const key: QueryKey = {
            queryName: 'typecheck',
            targetId: symbolId,
            optionsHash: 'default'
        };

        return this.executeQuery(
            key,
            () => {
                const sym = this.symbolDb.getSymbol(symbolId);
                if (!sym) {
                    throw new Error(`Symbol not found: ${symbolId}`);
                }
                // Simple placeholder - real implementation would analyze the symbol
                return new PrimitiveType(PrimitiveKind.STRING);
            },
            undefined,
            revision
        );
    }

    /**
     * Gets statistics about the query system
     */
    public getStats(): {
        totalQueries: number;
        activeQueries: number;
        graphSize: number;
    } {
        return {
            totalQueries: this.queryGraph.size,
            activeQueries: this.activeQueries.size,
            graphSize: this.queryGraph.size
        };
    }

    /**
     * Clears all cached queries
     */
    public clear(): void {
        this.queryGraph.clear();
        this.activeQueries.clear();
        this.activeQueryStack = [];
        this.queryKeys.clear();
    }
}
