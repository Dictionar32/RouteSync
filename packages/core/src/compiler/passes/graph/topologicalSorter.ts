import type { ArtifactKey } from '../../artifacts/types';
import type { ExecutablePass } from '../ExecutablePass';
import { relationContains, relationIndexLookup, type RelationIndex } from '../../../semantic/foundation/relationMembership';
import { relationAny, relationEqual, relationOptionFold, relationProject, relationResolve, relationSelect } from '../../../semantic/foundation/relationalSequence';
import { analyzePassGraph, type GraphAnalysis } from './graphAnalyzer';

const passProducerPresent = (
  analysis: GraphAnalysis,
  artifact: ArtifactKey,
  remaining: readonly ExecutablePass[],
): boolean => relationOptionFold(
  relationIndexLookup(analysis.producers, artifact),
  () => false,
  producer => relationContains(remaining, producer),
);

const passReady = (
  analysis: GraphAnalysis,
  pass: ExecutablePass,
  remaining: readonly ExecutablePass[],
): boolean => !relationAny(relationProject(
  pass.descriptor.consumes,
  artifact => passProducerPresent(analysis, artifact, remaining),
));

const resolveLayersFrom = (
  analysis: GraphAnalysis,
  remaining: readonly ExecutablePass[],
): readonly (readonly ExecutablePass[])[] => relationResolve(
  relationEqual(remaining.length, 0),
  () => [],
  () => {
    const ready = relationSelect(remaining, pass => passReady(analysis, pass, remaining));
    return relationResolve(
      relationEqual(ready.length, 0),
      () => { throw Error('Compiler pass cycle detected'); },
      () => [ready, ...resolveLayersFrom(analysis, relationSelect(remaining, pass => !relationContains(ready, pass)))],
    );
  },
);

export function resolveParallelLayers(
  passes: readonly ExecutablePass[],
  externalInputs: readonly ArtifactKey[] = [],
): readonly (readonly ExecutablePass[])[] {
  const analysis = analyzePassGraph(passes, externalInputs);
  return resolveLayersFrom(analysis, passes);
}

export function resolveTopologicalOrder(
  passes: readonly ExecutablePass[],
  externalInputs: readonly ArtifactKey[] = [],
): readonly ExecutablePass[] {
  const analysis = analyzePassGraph(passes, externalInputs);
  const layers = resolveLayersFrom(analysis, passes);
  const flatten = (items: readonly (readonly ExecutablePass[])[], index = 0, output: readonly ExecutablePass[] = []): readonly ExecutablePass[] =>
    relationResolve(
      relationEqual(index, items.length),
      () => output,
      () => flatten(items, index + 1, [...output, ...items[index]]),
    );
  return flatten(layers);
}
