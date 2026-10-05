import type { ArtifactKey } from '../../artifacts/types';
import type { ExecutablePass } from '../ExecutablePass';
import {
  relationContains,
  relationIndexAdd,
  relationIndexLookup,
  type RelationIndex,
} from '../../../semantic/foundation/relationMembership';
import {
  relationAny,
  relationEqual,
  relationFirstOption,
  relationOptionFold,
  relationProject,
  relationResolve,
} from '../../../semantic/foundation/relationalSequence';

export type PassRelationIndex = RelationIndex<string, ExecutablePass>;
export type ProducerRelationIndex = RelationIndex<ArtifactKey, ExecutablePass>;
export type AdjacencyRelation = RelationIndex<ArtifactKey, readonly ExecutablePass[]>;

export interface GraphAnalysis {
  readonly producers: ProducerRelationIndex;
  readonly nodes: PassRelationIndex;
  readonly adjacency: AdjacencyRelation;
}

const relationUniqueArtifacts = (
  values: readonly ArtifactKey[],
  index = 0,
  output: readonly ArtifactKey[] = [],
): readonly ArtifactKey[] => relationResolve(
  relationEqual(index, values.length),
  () => output,
  () => relationUniqueArtifacts(
    values,
    index + 1,
    relationResolve(
      relationContains(output, values[index]),
      () => output,
      () => [...output, values[index]],
    ),
  ),
);

const appendDependent = (
  adjacency: AdjacencyRelation,
  artifact: ArtifactKey,
  pass: ExecutablePass,
): AdjacencyRelation => relationIndexAdd(
  adjacency,
  artifact,
  [
    ...relationOptionFold(
      relationIndexLookup(adjacency, artifact),
      () => [] as readonly ExecutablePass[],
      value => value,
    ),
    pass,
  ],
);

const buildAdjacencyArtifacts = (
  passes: readonly ExecutablePass[],
  passIndex: number,
  artifacts: readonly ArtifactKey[],
  artifactIndex: number,
  adjacency: AdjacencyRelation,
): AdjacencyRelation => relationResolve(
  relationEqual(artifactIndex, artifacts.length),
  () => buildAdjacencyAt(passes, passIndex + 1, adjacency),
  () => buildAdjacencyArtifacts(
    passes,
    passIndex,
    artifacts,
    artifactIndex + 1,
    appendDependent(adjacency, artifacts[artifactIndex], passes[passIndex]),
  ),
);

const buildAdjacencyAt = (
  passes: readonly ExecutablePass[],
  passIndex: number,
  adjacency: AdjacencyRelation,
): AdjacencyRelation => relationResolve(
  relationEqual(passIndex, passes.length),
  () => adjacency,
  () => buildAdjacencyArtifacts(
    passes,
    passIndex,
    passes[passIndex].descriptor.consumes,
    0,
    adjacency,
  ),
);

export const buildAdjacency = (passes: readonly ExecutablePass[]): AdjacencyRelation =>
  buildAdjacencyAt(passes, 0, []);

const validatePassNames = (
  passes: readonly ExecutablePass[],
  index: number,
  nodes: PassRelationIndex,
): PassRelationIndex => relationResolve(
  relationEqual(index, passes.length),
  () => nodes,
  () => {
    const pass = passes[index];
    return relationResolve(
      relationEqual(pass.name, ''),
      () => { throw Error('Compiler pass requires a name'); },
      () => relationOptionFold(
        relationIndexLookup(nodes, pass.name),
        () => validatePassNames(passes, index + 1, relationIndexAdd(nodes, pass.name, pass)),
        () => { throw Error(`Duplicate compiler pass name: ${pass.name}`); },
      ),
    );
  },
);

const validateProducedArtifacts = (
  pass: ExecutablePass,
  artifacts: readonly ArtifactKey[],
  index: number,
  seen: readonly ArtifactKey[],
  producers: ProducerRelationIndex,
  external: readonly ArtifactKey[],
): ProducerRelationIndex => relationResolve(
  relationEqual(index, artifacts.length),
  () => producers,
  () => {
    const artifact = artifacts[index];
    return relationResolve(
      relationContains(seen, artifact),
      () => { throw Error(`Pass ${pass.name} declares duplicate output artifact: ${artifact}`); },
      () => relationResolve(
        relationContains(external, artifact),
        () => { throw Error(`Artifact ${artifact} cannot be both external input and pass output`); },
        () => relationOptionFold(
          relationIndexLookup(producers, artifact),
          () => validateProducedArtifacts(
            pass,
            artifacts,
            index + 1,
            [...seen, artifact],
            relationIndexAdd(producers, artifact, pass),
            external,
          ),
          () => { throw Error(`Multiple producers detected at artifact: ${artifact}`); },
        ),
      ),
    );
  },
);

const validatePasses = (
  passes: readonly ExecutablePass[],
  index: number,
  producers: ProducerRelationIndex,
  external: readonly ArtifactKey[],
): ProducerRelationIndex => relationResolve(
  relationEqual(index, passes.length),
  () => producers,
  () => {
    const pass = passes[index];
    const consumes = relationUniqueArtifacts(pass.descriptor.consumes);
    const overlap = relationAny(relationProject(
      consumes,
      artifact => relationContains(pass.descriptor.produces, artifact),
    ));
    return relationResolve(
      overlap,
      () => { throw Error(`Pass ${pass.name} both consumes and produces an artifact`); },
      () => validatePasses(
        passes,
        index + 1,
        validateProducedArtifacts(pass, pass.descriptor.produces, 0, [], producers, external),
        external,
      ),
    );
  },
);

const validateDependencies = (
  pass: ExecutablePass,
  artifacts: readonly ArtifactKey[],
  index: number,
  producers: ProducerRelationIndex,
  external: readonly ArtifactKey[],
): void => relationResolve(
  relationEqual(index, artifacts.length),
  () => {},
  () => {
    const artifact = artifacts[index];
    relationOptionFold(
      relationIndexLookup(producers, artifact),
      () => relationResolve(
        relationContains(external, artifact),
        () => validateDependencies(pass, artifacts, index + 1, producers, external),
        () => { throw Error(`Missing provider at artifact: ${artifact} consumed by ${pass.name}`); },
      ),
      candidate => {
        const dependency = relationFirstOption(pass.requires, item => relationEqual(item.artifact, artifact));
        return relationOptionFold(
          dependency,
          () => validateDependencies(pass, artifacts, index + 1, producers, external),
          requirement => relationResolve(
            relationAny([
              relationEqual(requirement.producer, ''),
              relationEqual(requirement.producer, candidate.name),
            ]),
            () => validateDependencies(pass, artifacts, index + 1, producers, external),
            () => { throw Error(`Producer mismatch at artifact ${artifact} consumed by ${pass.name}`); },
          ),
        );
      },
    );
  },
);

const validateAllDependencies = (
  passes: readonly ExecutablePass[],
  index: number,
  producers: ProducerRelationIndex,
  external: readonly ArtifactKey[],
): void => relationResolve(
  relationEqual(index, passes.length),
  () => {},
  () => {
    validateDependencies(passes[index], passes[index].descriptor.consumes, 0, producers, external);
    validateAllDependencies(passes, index + 1, producers, external);
  },
);

export function analyzePassGraph(
  passes: readonly ExecutablePass[],
  externalInputs: readonly ArtifactKey[] = [],
): GraphAnalysis {
  const nodes = validatePassNames(passes, 0, []);
  const producers = validatePasses(passes, 0, [], externalInputs);
  validateAllDependencies(passes, 0, producers, externalInputs);
  return Object.freeze({ nodes, producers, adjacency: buildAdjacency(passes) });
}
