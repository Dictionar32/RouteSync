/**
 * topologicalSorter.ts
 *
 * Resolves deterministic sequential topological execution order and parallel layers.
 *
 * @module core/compiler/passes/graph
 */

import type { ArtifactKey } from '../../artifacts/types';
import type { ExecutablePass } from '../ExecutablePass';
import { analyzePassGraph, buildAdjacency } from './graphAnalyzer';

export function resolveTopologicalOrder(
  passes: readonly ExecutablePass[],
  externalInputs: readonly ArtifactKey[] = []
): readonly ExecutablePass[] {
  const { nodes, producers } = analyzePassGraph(passes, externalInputs);
  const adjacency = buildAdjacency(passes);
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

export function resolveParallelLayers(
  passes: readonly ExecutablePass[],
  externalInputs: readonly ArtifactKey[] = []
): readonly (readonly ExecutablePass[])[] {
  const { nodes, producers } = analyzePassGraph(passes, externalInputs);
  const adjacency = buildAdjacency(passes);
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
