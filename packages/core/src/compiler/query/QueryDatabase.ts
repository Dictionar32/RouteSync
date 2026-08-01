/**
 * @fileoverview Query-based incremental computation database
 * @module compiler/query/QueryDatabase
 */

import { TypedCache, MemoizedQueryKey, createMemoizedQueryKey } from './TypedCache';
import { QueryCell, createPendingCell, createReadyCell, isReady, addDependency } from './QueryCell';

/**
 * Descriptor for a cached query computation
 * 
 * @template I Input type
 * @template O Output type
 */
export interface QueryDescriptor<I, O> {
    readonly key: MemoizedQueryKey<O>;
    readonly inputHash: string;
    compute(input: I): O;
}

/**
 * Simple query database with input-based caching
 * 
 * Caches query results based on:
 * - Query key
 * - Input hash
 * - Dependency fingerprint
 * 
 * @example
 * ```typescript
 * const db = new QueryDatabase();
 * 
 * const query: QueryDescriptor<User, string> = {
 *   key: createMemoizedQueryKey('userName'),
 *   inputHash: hashUser(user),
 *   compute: (user) => user.name
 * };
 * 
 * const name = db.executeQuery(query, user, 'deps-hash');
 * ```
 */
export class QueryDatabase {
    private cache = new TypedCache();

    /**
     * Executes a query with caching
     * 
     * @template I Input type
     * @template O Output type
     * @param query Query descriptor
     * @param input Query input
     * @param dependencyFingerprint Hash of dependencies
     * @returns Computed or cached result
     */
    public executeQuery<I, O>(
        query: QueryDescriptor<I, O>,
        input: I,
        dependencyFingerprint: string
    ): O {
        const keyId = `${query.key.id}:${query.inputHash}:${dependencyFingerprint}`;
        const cacheKey = createMemoizedQueryKey<O>(keyId);

        const cached = this.cache.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }

        const value = query.compute(input);
        this.cache.set(cacheKey, value);

        return value;
    }

    /**
     * Clears all cached queries
     */
    public clear(): void {
        this.cache.clear();
    }

    /**
     * Gets cache statistics
     */
    public getStats(): { size: number } {
        return {
            size: this.cache.size
        };
    }
}

/**
 * Memoized query database with dependency tracking
 * 
 * Tracks dependencies between queries and invalidates dependent queries
 * when their dependencies change. Uses revision numbers to determine
 * when cached values are still valid.
 * 
 * @example
 * ```typescript
 * const db = new MemoizedQueryDatabase();
 * 
 * const result = db.runQuery(
 *   userTypeKey,
 *   (userId) => resolveUserType(userId),
 *   'user-123',
 *   'rev1'
 * );
 * ```
 */
export class MemoizedQueryDatabase {
    private cells = new TypedCache();
    private activeStack: string[] = [];

    /**
     * Runs a query with memoization and dependency tracking
     * 
     * @template I Input type
     * @template O Output type
     * @param key Query key
     * @param compute Computation function
     * @param input Query input
     * @param revision Current revision
     * @returns Computed or cached result
     */
    public runQuery<I, O>(
        key: MemoizedQueryKey<O>,
        compute: (input: I) => O,
        input: I,
        revision: string
    ): O {
        const queryId = key.id;

        // Track dependency from parent query
        if (this.activeStack.length > 0) {
            const parent = this.activeStack[this.activeStack.length - 1]!;
            const parentCellKey = createMemoizedQueryKey<QueryCell<unknown>>(parent);
            const parentCell = this.cells.get(parentCellKey);

            if (parentCell) {
                const newDeps = [...parentCell.dependencies, queryId];
                if (parentCell.kind === 'Ready') {
                    this.cells.set(parentCellKey, {
                        kind: 'Ready',
                        value: parentCell.value,
                        dependencies: newDeps,
                        verifiedAtRevision: parentCell.verifiedAtRevision
                    });
                } else {
                    this.cells.set(parentCellKey, {
                        kind: 'Pending',
                        dependencies: newDeps,
                        verifiedAtRevision: parentCell.verifiedAtRevision
                    });
                }
            }
        }

        // Check for cached result
        const cellKey = createMemoizedQueryKey<QueryCell<O>>(queryId);
        const cached = this.cells.get(cellKey);

        if (cached && cached.kind === 'Ready' && cached.verifiedAtRevision === revision) {
            return cached.value;
        }

        // Execute query
        this.activeStack.push(queryId);
        this.cells.set(cellKey, {
            kind: 'Pending',
            dependencies: [],
            verifiedAtRevision: revision
        });

        try {
            const value = compute(input);

            const cell = this.cells.get(cellKey);
            if (cell) {
                this.cells.set(cellKey, createReadyCell(value, revision, cell.dependencies));
            }

            return value;
        } finally {
            this.activeStack.pop();
        }
    }

    /**
     * Clears all cached queries
     */
    public clear(): void {
        this.cells.clear();
        this.activeStack = [];
    }

    /**
     * Gets the current query stack (for debugging)
     */
    public getActiveStack(): readonly string[] {
        return this.activeStack;
    }

    /**
     * Gets cache statistics
     */
    public getStats(): {
        size: number;
        activeQueries: number;
    } {
        return {
            size: this.cells.size,
            activeQueries: this.activeStack.length
        };
    }
}
