import type { ArtifactKey } from '../../artifacts/types';
import type { ExecutablePass } from '../ExecutablePass';

export interface PassGraphAnalysisInterface {
  readonly producers: readonly Readonly<{ artifact: ArtifactKey; pass: ExecutablePass }>[];
  readonly nodes: readonly Readonly<{ name: string; pass: ExecutablePass }>[];
  readonly adjacency: readonly Readonly<{ artifact: ArtifactKey; passes: readonly ExecutablePass[] }>[];
  readonly producerOf: (artifact: ArtifactKey) => ExecutablePass | undefined;
  readonly containsRemainingProducer: (artifact: ArtifactKey, remaining: readonly ExecutablePass[]) => boolean;
  readonly dependentsOf: (artifact: ArtifactKey) => readonly ExecutablePass[];
}

export interface PassGraphAnalysisOperationsInterface {
  readonly buildAdjacency: (passes: readonly ExecutablePass[]) => PassGraphAnalysisInterface['adjacency'];
  readonly analyze: (passes: readonly ExecutablePass[], externalInputs?: readonly ArtifactKey[]) => PassGraphAnalysisInterface;
}

const sameArtifact = (left: ArtifactKey, right: ArtifactKey): boolean => left === right;
const samePass = (left: ExecutablePass, right: ExecutablePass): boolean => left.name === right.name;

const uniqueArtifacts = (values: readonly ArtifactKey[]): readonly ArtifactKey[] => {
  const unique: ArtifactKey[] = [];
  for (const value of values) {
    if (!unique.some((candidate) => sameArtifact(candidate, value))) unique.push(value);
  }
  return unique;
};

const buildAdjacency = (passes: readonly ExecutablePass[]): PassGraphAnalysisInterface['adjacency'] => {
  const adjacency: { artifact: ArtifactKey; passes: ExecutablePass[] }[] = [];
  for (const pass of passes) {
    for (const artifact of pass.descriptor.consumes) {
      const existing = adjacency.find((entry) => sameArtifact(entry.artifact, artifact));
      if (existing) existing.passes.push(pass);
      else adjacency.push({ artifact, passes: [pass] });
    }
  }
  return Object.freeze(adjacency.map((entry) => Object.freeze({
    artifact: entry.artifact,
    passes: Object.freeze([...entry.passes]),
  })));
};

const analyze = (
  passes: readonly ExecutablePass[],
  externalInputs: readonly ArtifactKey[] = [],
): PassGraphAnalysisInterface => {
  const nodes: { name: string; pass: ExecutablePass }[] = [];
  const producers: { artifact: ArtifactKey; pass: ExecutablePass }[] = [];
  const external = uniqueArtifacts(externalInputs);

  for (const pass of passes) {
    if (pass.name.length === 0) throw Error('Compiler pass requires a name');
    if (nodes.some((node) => node.name === pass.name)) throw Error(`Duplicate compiler pass name: ${pass.name}`);
    nodes.push({ name: pass.name, pass });
  }

  for (const pass of passes) {
    const consumes = uniqueArtifacts(pass.descriptor.consumes);
    if (consumes.some((artifact) => pass.descriptor.produces.some((produced) => sameArtifact(artifact, produced)))) {
      throw Error(`Pass ${pass.name} both consumes and produces an artifact`);
    }

    const seen: ArtifactKey[] = [];
    for (const artifact of pass.descriptor.produces) {
      if (seen.some((candidate) => sameArtifact(candidate, artifact))) {
        throw Error(`Pass ${pass.name} declares duplicate output artifact: ${artifact}`);
      }
      seen.push(artifact);
      if (external.some((candidate) => sameArtifact(candidate, artifact))) {
        throw Error(`Artifact ${artifact} cannot be both external input and pass output`);
      }
      if (producers.some((entry) => sameArtifact(entry.artifact, artifact))) {
        throw Error(`Multiple producers detected at artifact: ${artifact}`);
      }
      producers.push({ artifact, pass });
    }
  }

  const producerOf = (artifact: ArtifactKey): ExecutablePass | undefined =>
    producers.find((entry) => sameArtifact(entry.artifact, artifact))?.pass;

  for (const pass of passes) {
    for (const artifact of uniqueArtifacts(pass.descriptor.consumes)) {
      const producer = producerOf(artifact);
      if (!producer) {
        if (external.some((candidate) => sameArtifact(candidate, artifact))) continue;
        throw Error(`Missing provider for artifact: ${artifact}`);
      }
      const requirement = pass.requires.find((candidate) => candidate.artifact === artifact);
      if (requirement && requirement.producer !== undefined && requirement.producer !== '' && requirement.producer !== producer.name) {
        throw Error(`Producer mismatch at artifact ${artifact} consumed by ${pass.name}`);
      }
    }
  }

  const frozenNodes = Object.freeze(nodes.map((node) => Object.freeze(node)));
  const frozenProducers = Object.freeze(producers.map((entry) => Object.freeze(entry)));
  const adjacency = buildAdjacency(passes);
  return Object.freeze({
    nodes: frozenNodes,
    producers: frozenProducers,
    adjacency,
    producerOf,
    containsRemainingProducer: (artifact, remaining) => {
      const producer = producerOf(artifact);
      return producer !== undefined && remaining.some((candidate) => samePass(candidate, producer));
    },
    dependentsOf: (artifact) => adjacency.find((entry) => sameArtifact(entry.artifact, artifact))?.passes ?? [],
  });
};

export const passGraphAnalysisOperations: PassGraphAnalysisOperationsInterface = Object.freeze({
  buildAdjacency,
  analyze,
});
