/**
 * @fileoverview Salsa-inspired incremental query compiler.
 *
 * Phase 3B:
 * - Query output type is carried by QueryKey<O>.
 * - Query graph stores metadata only; values never become unknown.
 * - Cache values remain attached to typed query keys.
 * - No generic result assertion is required on cache reads.
 */

import type { FileSpan } from '../types/FileSpan';
import type { SemanticType } from '../types/SemanticType';
import { PrimitiveType, PrimitiveKind } from '../types/SemanticType';
import { SymbolDatabase } from '../analysis';
import {
    createMemoizedQueryKey,
    type MemoizedQueryKey,
} from './TypedCache';

export interface QueryKey<O> extends MemoizedQueryKey<O> {
    readonly queryName: string;
    readonly targetId: string;
    readonly optionsHash: string;

    derive(targetId: string, optionsHash?: string): QueryKey<O>;
}

function createQueryKeyInternal<O>(
    queryName: string,
    targetId: string,
    optionsHash: string,
    cacheRoot: MemoizedQueryKey<O>,
): QueryKey<O> {
    const id = `${queryName}:${targetId}:${optionsHash}`;
    const valueKey = cacheRoot.scope(id);

    return {
        ...valueKey,
        id,
        queryName,
        targetId,
        optionsHash,

        derive: (
            nextTargetId: string,
            nextOptionsHash = optionsHash,
        ) => createQueryKeyInternal(
            queryName,
            nextTargetId,
            nextOptionsHash,
            cacheRoot,
        ),
    };
}

export function createQueryKey<O>(
    queryName: string,
    targetId: string,
    optionsHash: string,
): QueryKey<O> {
    const root = createMemoizedQueryKey<O>(
        `${queryName}:${targetId}:${optionsHash}`,
    );

    return createQueryKeyInternal(
        queryName,
        targetId,
        optionsHash,
        root,
    );
}

export interface QueryNode {
    readonly keyId: string;
    readonly dependencies: ReadonlySet<string>;
    readonly dependents: ReadonlySet<string>;
    readonly lastChangedRevision: number;
    readonly lastVerifiedRevision: number;
}

export interface QueryContext {
    readonly packageId?: string;
    readonly moduleId?: string;
    readonly symbolId?: string;
}

export interface QueryFrame {
    readonly key: QueryKey<unknown>;
    readonly queryKind: string;
    readonly context?: QueryContext;
    readonly span?: FileSpan;
}

export class QueryCycleError extends Error {
    constructor(
        message: string,
        public readonly queryStack: readonly QueryFrame[],
    ) {
        super(message);
        this.name = 'QueryCycleError';
    }
}

interface ActiveQueryFrame {
    readonly keyId: string;
}

export class SalsaCompiler {
    private readonly queryGraph = new Map<string, QueryNode>();
    private readonly activeQueries = new Set<string>();
    private readonly activeQueryStack: ActiveQueryFrame[] = [];

    private readonly typecheckKey = createQueryKey<SemanticType>(
        'typecheck',
        '__root__',
        'default',
    );

    constructor(
        private readonly symbolDb: SymbolDatabase,
    ) { }

    public executeQuery<I, O>(
        key: QueryKey<O>,
        compute: (input: I) => O,
        input: I,
        currentRevision: number,
    ): O {
        const keyId = key.id;

        if (this.activeQueries.has(keyId)) {
            throw new QueryCycleError(
                `Query cycle detected: ${[
                    ...this.activeQueryStack.map((frame) => frame.keyId),
                    keyId,
                ].join(' -> ')}`,
                this.buildCycleFrames(key),
            );
        }

        this.recordParentDependency(keyId);

        const cachedNode = this.queryGraph.get(keyId);
        if (
            cachedNode &&
            this.isCacheValid(cachedNode, currentRevision) &&
            key.hasValue()
        ) {
            const cachedValue = key.read();
            if (cachedValue !== undefined) {
                return cachedValue;
            }
        }

        const existingDependents =
            cachedNode?.dependents ?? new Set<string>();

        const node: QueryNode = {
            keyId,
            dependencies: new Set<string>(),
            dependents: new Set(existingDependents),
            lastChangedRevision:
                cachedNode?.lastChangedRevision ?? currentRevision,
            lastVerifiedRevision: currentRevision,
        };

        this.queryGraph.set(keyId, node);
        this.activeQueries.add(keyId);
        this.activeQueryStack.push({ keyId });

        try {
            const previousValue = key.read();
            const value = compute(input);
            const valueChanged =
                !key.hasValue() ||
                JSON.stringify(previousValue) !== JSON.stringify(value);

            this.queryGraph.set(keyId, {
                ...node,
                lastChangedRevision: valueChanged
                    ? currentRevision
                    : node.lastChangedRevision,
                lastVerifiedRevision: currentRevision,
            });

            key.write(value);

            if (valueChanged) {
                this.invalidateDependents(keyId, currentRevision);
            }

            return value;
        } finally {
            this.activeQueries.delete(keyId);
            this.activeQueryStack.pop();
        }
    }

    private buildCycleFrames<O>(key: QueryKey<O>): readonly QueryFrame[] {
        const frames = this.activeQueryStack.map(
            (frame): QueryFrame => ({
                key: createQueryKey<unknown>(
                    'query',
                    frame.keyId,
                    'cycle',
                ),
                queryKind: 'query',
            }),
        );

        return [
            ...frames,
            {
                key: createQueryKey<unknown>(
                    key.queryName,
                    key.targetId,
                    key.optionsHash,
                ),
                queryKind: key.queryName,
                context: {
                    symbolId: key.targetId,
                },
            },
        ];
    }

    private recordParentDependency(childId: string): void {
        const parent = this.activeQueryStack.at(-1);
        if (!parent) {
            return;
        }

        const parentNode = this.queryGraph.get(parent.keyId);
        if (parentNode) {
            const dependencies = new Set(parentNode.dependencies);
            dependencies.add(childId);

            this.queryGraph.set(parent.keyId, {
                ...parentNode,
                dependencies,
            });
        }

        const childNode = this.queryGraph.get(childId);
        if (childNode) {
            const dependents = new Set(childNode.dependents);
            dependents.add(parent.keyId);

            this.queryGraph.set(childId, {
                ...childNode,
                dependents,
            });
        }
    }

    private isCacheValid(
        node: QueryNode,
        currentRevision: number,
    ): boolean {
        if (node.lastVerifiedRevision !== currentRevision) {
            return false;
        }

        for (const dependencyId of node.dependencies) {
            const dependency = this.queryGraph.get(dependencyId);

            if (
                !dependency ||
                dependency.lastChangedRevision > node.lastVerifiedRevision
            ) {
                return false;
            }
        }

        return true;
    }

    private invalidateDependents(
        keyId: string,
        revision: number,
    ): void {
        const queue = [keyId];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const current = queue.shift();

            if (!current || visited.has(current)) {
                continue;
            }

            visited.add(current);

            const node = this.queryGraph.get(current);
            if (!node) {
                continue;
            }

            for (const dependentId of node.dependents) {
                const dependent = this.queryGraph.get(dependentId);

                if (!dependent || visited.has(dependentId)) {
                    continue;
                }

                this.queryGraph.set(dependentId, {
                    ...dependent,
                    lastVerifiedRevision: revision - 1,
                });

                queue.push(dependentId);
            }
        }
    }

    public typecheck(
        symbolId: string,
        revision: number,
    ): SemanticType {
        const key = this.typecheckKey.derive(symbolId);

        return this.executeQuery(
            key,
            () => {
                const symbol = this.symbolDb.getSymbol(symbolId);

                if (!symbol) {
                    throw new Error(`Symbol not found: ${symbolId}`);
                }

                return new PrimitiveType(PrimitiveKind.STRING);
            },
            undefined,
            revision,
        );
    }

    public getStats(): {
        totalQueries: number;
        activeQueries: number;
        graphSize: number;
    } {
        return {
            totalQueries: this.queryGraph.size,
            activeQueries: this.activeQueries.size,
            graphSize: this.queryGraph.size,
        };
    }

    public clear(): void {
        this.queryGraph.clear();
        this.activeQueries.clear();
        this.activeQueryStack.length = 0;
    }
}