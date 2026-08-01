/**
 * PassGraph.ts
 * 
 * Implements pass dependency resolution and topological sorting.
 * PassGraph analyzes pass dependencies to determine valid execution orders.
 */

import type { ArtifactKey } from '../artifacts/types';
import type { ExecutablePass } from './ExecutablePass';

/**
 * PassGraph provides algorithms for analyzing and resolving pass dependencies.
 * 
 * Key operations:
 * - buildAdjacency: Build adjacency map from artifacts to consuming passes
 * - resolve: Compute topologically-sorted linear execution order
 * - resolveLayers: Compute wave-based parallel execution layers
 */
export class PassGraph {
    /**
     * Build adjacency map from artifact keys to passes that consume them.
     * 
     * Used internally for dependency resolution algorithms.
     * 
     * @param passes - Passes to analyze
     * @returns Map from artifact key to set of passes that consume that artifact
     */
    public static buildAdjacency(
        passes: readonly ExecutablePass[]
    ): Map<ArtifactKey, Set<ExecutablePass>> {
        const map = new Map<ArtifactKey, Set<ExecutablePass>>();

        for (const pass of passes) {
            for (const req of pass.descriptor.consumes) {
                const set = map.get(req) ?? new Set();
                set.add(pass);
                map.set(req, set);
            }
        }

        return map;
    }

    /**
     * Resolve passes to topologically-sorted linear execution order.
     * 
     * Algorithm:
     * 1. Validate no duplicate producers
     * 2. Validate all consumed artifacts are available
     * 3. Compute indegree (# of internal dependencies) for each pass
     * 4. Topological sort using Kahn's algorithm
     * 5. Detect cycles if sort doesn't include all passes
     * 
     * @param passes - Passes to resolve
     * @param externalInputs - Artifacts provided externally (not by passes)
     * @returns Topologically-sorted pass execution order
     * @throws Error if cycles detected or missing providers
     */
    public static resolve(
        passes: readonly ExecutablePass[],
        externalInputs: readonly ArtifactKey[] = []
    ): readonly ExecutablePass[] {
        const adj = this.buildAdjacency(passes);
        const indegree = new Map<string, number>();
        const nodeMap = new Map<string, ExecutablePass>();

        // Build producer map and detect duplicate producers
        const producers = new Map<ArtifactKey, string>();
        for (const pass of passes) {
            for (const prod of pass.descriptor.produces) {
                if (producers.has(prod)) {
                    throw new Error(
                        `Multiple producers detected for artifact: ${prod} ` +
                        `(owned by ${producers.get(prod)} and ${pass.name})`
                    );
                }
                producers.set(prod, pass.name);
            }
        }

        // Validate all consumed artifacts have providers
        const allAvailable = new Set<ArtifactKey>(externalInputs);
        for (const p of passes) {
            for (const prod of p.descriptor.produces) {
                allAvailable.add(prod);
            }
        }
        for (const p of passes) {
            for (const consume of p.descriptor.consumes) {
                if (!allAvailable.has(consume)) {
                    throw new Error(
                        `Missing provider for artifact: ${consume} consumed by ${p.name}`
                    );
                }
            }
        }

        // Compute indegree: count internal dependencies (excludes external inputs)
        for (const pass of passes) {
            nodeMap.set(pass.name, pass);

            const internalConsumes = pass.descriptor.consumes.filter(c =>
                passes.some(p => p !== pass && p.descriptor.produces.includes(c))
            );
            indegree.set(pass.name, internalConsumes.length);
        }

        // Kahn's algorithm for topological sort
        const queue = Array.from(indegree.entries())
            .filter(([_, v]) => v === 0)
            .map(([k]) => k);

        const result: string[] = [];

        while (queue.length > 0) {
            const current = queue.shift()!;
            result.push(current);

            const currentPass = nodeMap.get(current)!;
            for (const prod of currentPass.descriptor.produces) {
                const dependents = adj.get(prod) ?? new Set();
                for (const dep of dependents) {
                    const nextVal = (indegree.get(dep.name) ?? 0) - 1;
                    indegree.set(dep.name, nextVal);
                    if (nextVal === 0) {
                        queue.push(dep.name);
                    }
                }
            }
        }

        // Detect cycles
        if (result.length !== passes.length) {
            throw new Error('Compiler pass cycle detected');
        }

        return result.map(name => nodeMap.get(name)!);
    }

    /**
     * Resolve passes to wave-based parallel execution layers.
     * 
     * Each layer contains passes that can execute concurrently (no dependencies
     * between them). Layers must execute sequentially.
     * 
     * Algorithm:
     * 1. Compute indegree for each pass
     * 2. Repeatedly find all passes with indegree 0 (form a layer)
     * 3. Remove layer passes and decrement indegrees
     * 4. Repeat until all passes assigned to layers
     * 5. Detect cycles if any pass remains
     * 
     * @param passes - Passes to resolve
     * @param externalInputs - Artifacts provided externally
     * @returns Array of layers, where each layer is an array of concurrent passes
     * @throws Error if cycles detected
     */
    public static resolveLayers(
        passes: readonly ExecutablePass[],
        externalInputs: readonly ArtifactKey[] = []
    ): readonly (readonly ExecutablePass[])[] {
        const adj = this.buildAdjacency(passes);
        const indegree = new Map<string, number>();
        const nodeMap = new Map<string, ExecutablePass>();

        // Compute indegree
        for (const pass of passes) {
            nodeMap.set(pass.name, pass);
            const internalConsumes = pass.descriptor.consumes.filter(c =>
                passes.some(p => p !== pass && p.descriptor.produces.includes(c))
            );
            indegree.set(pass.name, internalConsumes.length);
        }

        const layers: ExecutablePass[][] = [];
        const remaining = new Set<string>(nodeMap.keys());

        // Build layers iteratively
        while (remaining.size > 0) {
            // Find all passes with indegree 0 (current layer)
            const currentLayer = Array.from(remaining.values())
                .filter(name => (indegree.get(name) ?? 0) === 0)
                .map(name => nodeMap.get(name)!);

            if (currentLayer.length === 0) {
                throw new Error('Compiler pass cycle detected');
            }

            layers.push(currentLayer);

            // Remove current layer and decrement indegrees
            for (const pass of currentLayer) {
                remaining.delete(pass.name);
                for (const prod of pass.descriptor.produces) {
                    const dependents = adj.get(prod) ?? new Set();
                    for (const dep of dependents) {
                        const val = indegree.get(dep.name) ?? 0;
                        indegree.set(dep.name, Math.max(0, val - 1));
                    }
                }
            }
        }

        return layers;
    }
}
