/**
 * Validates compiler-pass dependencies and computes deterministic execution
 * order or parallel execution layers.
 */
import type { ArtifactKey } from '../artifacts/types';
import type { ExecutablePass } from './ExecutablePass';

interface GraphAnalysis {
    readonly producers: ReadonlyMap<ArtifactKey, ExecutablePass>;
    readonly nodes: ReadonlyMap<string, ExecutablePass>;
}

export class PassGraph {
    /** Maps each consumed artifact to the passes that consume it. */
    public static buildAdjacency(
        passes: readonly ExecutablePass[]
    ): Map<ArtifactKey, Set<ExecutablePass>> {
        const map = new Map<ArtifactKey, Set<ExecutablePass>>();
        for (const pass of passes) {
            for (const artifact of pass.descriptor.consumes) {
                const consumers = map.get(artifact) ?? new Set<ExecutablePass>();
                consumers.add(pass);
                map.set(artifact, consumers);
            }
        }
        return map;
    }

    /** Validates pass contracts and builds producer/name indexes. */
    private static analyze(
        passes: readonly ExecutablePass[],
        externalInputs: readonly ArtifactKey[]
    ): GraphAnalysis {
        const nodes = new Map<string, ExecutablePass>();
        const producers = new Map<ArtifactKey, ExecutablePass>();
        const external = new Set(externalInputs);

        for (const pass of passes) {
            if (!pass.name) {
                throw new Error('Compiler pass must have a non-empty name');
            }
            if (nodes.has(pass.name)) {
                throw new Error(`Duplicate compiler pass name: ${pass.name}`);
            }
            nodes.set(pass.name, pass);

            const consumes = new Set<ArtifactKey>();
            for (const artifact of pass.descriptor.consumes) {
                if (consumes.has(artifact)) {
                    throw new Error(`Pass ${pass.name} declares duplicate input artifact: ${artifact}`);
                }
                consumes.add(artifact);
            }

            const produces = new Set<ArtifactKey>();
            for (const artifact of pass.descriptor.produces) {
                if (produces.has(artifact)) {
                    throw new Error(`Pass ${pass.name} declares duplicate output artifact: ${artifact}`);
                }
                if (consumes.has(artifact)) {
                    throw new Error(`Pass ${pass.name} both consumes and produces artifact: ${artifact}`);
                }
                if (external.has(artifact)) {
                    throw new Error(`Artifact ${artifact} cannot be both external input and pass output`);
                }
                if (producers.has(artifact)) {
                    const previous = producers.get(artifact)!;
                    throw new Error(
                        `Multiple producers detected for artifact: ${artifact} ` +
                        `(owned by ${previous.name} and ${pass.name})`
                    );
                }
                producers.set(artifact, pass);
                produces.add(artifact);
            }

            for (const dependency of pass.requires) {
                if (!consumes.has(dependency.artifact)) {
                    throw new Error(
                        `Pass ${pass.name} declares dependency on ${dependency.artifact} ` +
                        'but does not consume that artifact'
                    );
                }
                if (dependency.producer === pass.name) {
                    throw new Error(`Pass ${pass.name} cannot depend on itself`);
                }
            }
        }

        for (const pass of passes) {
            for (const artifact of pass.descriptor.consumes) {
                const producer = producers.get(artifact);
                if (!producer && !external.has(artifact)) {
                    throw new Error(
                        `Missing provider for artifact: ${artifact} consumed by ${pass.name}`
                    );
                }

                const dependency = pass.requires.find(item => item.artifact === artifact);
                if (dependency?.producer && producer?.name !== dependency.producer) {
                    throw new Error(
                        `Producer mismatch for artifact ${artifact} consumed by ${pass.name}: ` +
                        `expected ${dependency.producer}, got ${producer?.name ?? 'external input'}`
                    );
                }
            }
        }

        return { nodes, producers };
    }

    /** Computes a deterministic topological execution order. */
    public static resolve(
        passes: readonly ExecutablePass[],
        externalInputs: readonly ArtifactKey[] = []
    ): readonly ExecutablePass[] {
        const { nodes, producers } = this.analyze(passes, externalInputs);
        const adjacency = this.buildAdjacency(passes);
        const indegree = new Map<string, number>();

        for (const pass of passes) {
            let count = 0;
            for (const artifact of pass.descriptor.consumes) {
                const producer = producers.get(artifact);
                if (producer && producer.name !== pass.name) count++;
            }
            indegree.set(pass.name, count);
        }

        const queue = Array.from(nodes.values())
            .filter(pass => indegree.get(pass.name) === 0)
            .sort((a, b) => a.name.localeCompare(b.name));

        const result: ExecutablePass[] = [];
        while (queue.length > 0) {
            const current = queue.shift()!;
            result.push(current);

            for (const artifact of current.descriptor.produces) {
                const dependents = adjacency.get(artifact) ?? new Set<ExecutablePass>();
                for (const dependent of dependents) {
                    const next = (indegree.get(dependent.name) ?? 0) - 1;
                    indegree.set(dependent.name, next);
                    if (next === 0) {
                        queue.push(dependent);
                        queue.sort((a, b) => a.name.localeCompare(b.name));
                    }
                }
            }
        }

        if (result.length !== passes.length) {
            throw new Error('Compiler pass cycle detected');
        }

        return result;
    }

    /** Computes deterministic layers of passes that may execute together. */
    public static resolveLayers(
        passes: readonly ExecutablePass[],
        externalInputs: readonly ArtifactKey[] = []
    ): readonly (readonly ExecutablePass[])[] {
        const { nodes, producers } = this.analyze(passes, externalInputs);
        const adjacency = this.buildAdjacency(passes);
        const indegree = new Map<string, number>();

        for (const pass of passes) {
            let count = 0;
            for (const artifact of pass.descriptor.consumes) {
                if (producers.has(artifact)) count++;
            }
            indegree.set(pass.name, count);
        }

        const remaining = new Set(nodes.keys());
        const layers: ExecutablePass[][] = [];

        while (remaining.size > 0) {
            const currentLayer = Array.from(remaining)
                .filter(name => indegree.get(name) === 0)
                .map(name => nodes.get(name)!)
                .sort((a, b) => a.name.localeCompare(b.name));

            if (currentLayer.length === 0) {
                throw new Error('Compiler pass cycle detected');
            }

            layers.push(currentLayer);

            for (const pass of currentLayer) {
                remaining.delete(pass.name);
                for (const artifact of pass.descriptor.produces) {
                    const dependents = adjacency.get(artifact) ?? new Set<ExecutablePass>();
                    for (const dependent of dependents) {
                        indegree.set(dependent.name, (indegree.get(dependent.name) ?? 0) - 1);
                    }
                }
            }
        }

        return layers;
    }
}
