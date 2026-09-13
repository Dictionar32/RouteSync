/**
 * queryGraphManager.ts
 *
 * Dependency graph and cache invalidation engine for Salsa incremental compiler.
 *
 * @module core/compiler/query/salsa/queryGraphManager
 */

import type { QueryNode } from './salsaTypes';

export class QueryGraphManager {
    private readonly queryGraph = new Map<string, QueryNode>();

    public getNode(keyId: string): QueryNode | undefined {
        return this.queryGraph.get(keyId);
    }

    public setNode(keyId: string, node: QueryNode): void {
        this.queryGraph.set(keyId, node);
    }

    public isCacheValid(
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

    public recordDependency(parentId: string, childId: string): void {
        const parentNode = this.queryGraph.get(parentId);
        if (parentNode) {
            const dependencies = new Set(parentNode.dependencies);
            dependencies.add(childId);

            this.queryGraph.set(parentId, {
                ...parentNode,
                dependencies,
            });
        }

        const childNode = this.queryGraph.get(childId);
        if (childNode) {
            const dependents = new Set(childNode.dependents);
            dependents.add(parentId);

            this.queryGraph.set(childId, {
                ...childNode,
                dependents,
            });
        }
    }

    public invalidateDependents(
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

    public get size(): number {
        return this.queryGraph.size;
    }

    public clear(): void {
        this.queryGraph.clear();
    }
}
