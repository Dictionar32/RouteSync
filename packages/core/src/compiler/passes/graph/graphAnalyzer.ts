/**
 * graphAnalyzer.ts
 *
 * Validates pass contracts, detects cycles, and indexes producers and nodes.
 *
 * @module core/compiler/passes/graph
 */

import type { ArtifactKey } from '../../artifacts/types';
import type { ExecutablePass } from '../ExecutablePass';

export interface GraphAnalysis {
  readonly producers: ReadonlyMap<ArtifactKey, ExecutablePass>;
  readonly nodes: ReadonlyMap<string, ExecutablePass>;
}

export function buildAdjacency(
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

export function analyzePassGraph(
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
