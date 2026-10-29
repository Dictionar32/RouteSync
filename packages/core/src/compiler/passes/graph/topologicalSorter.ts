import type { ArtifactKey } from '../../artifacts/types';
import type { ExecutablePass } from '../ExecutablePass';
import { passGraphAnalysisOperations, type PassGraphAnalysisInterface } from './graphAnalyzer';

export interface PassGraphOrderingOperationsInterface {
  readonly resolveParallelLayers: (passes: readonly ExecutablePass[], externalInputs?: readonly ArtifactKey[]) => readonly (readonly ExecutablePass[])[];
  readonly resolveTopologicalOrder: (passes: readonly ExecutablePass[], externalInputs?: readonly ArtifactKey[]) => readonly ExecutablePass[];
}

const passIsReady = (
  analysis: PassGraphAnalysisInterface,
  pass: ExecutablePass,
  remaining: readonly ExecutablePass[],
): boolean => !pass.descriptor.consumes.some((artifact) => analysis.containsRemainingProducer(artifact, remaining));

const resolveLayers = (
  analysis: PassGraphAnalysisInterface,
  remaining: readonly ExecutablePass[],
): readonly (readonly ExecutablePass[])[] => {
  if (remaining.length === 0) return [];
  const ready = remaining.filter((pass) => passIsReady(analysis, pass, remaining));
  if (ready.length === 0) throw Error('Compiler pass cycle detected');
  const readyNames = new Set(ready.map((pass) => pass.name));
  const next = remaining.filter((pass) => !readyNames.has(pass.name));
  return Object.freeze([Object.freeze(ready), ...resolveLayers(analysis, next)]);
};

const resolveParallelLayers = (
  passes: readonly ExecutablePass[],
  externalInputs: readonly ArtifactKey[] = [],
): readonly (readonly ExecutablePass[])[] => resolveLayers(
  passGraphAnalysisOperations.analyze(passes, externalInputs),
  passes,
);

const resolveTopologicalOrder = (
  passes: readonly ExecutablePass[],
  externalInputs: readonly ArtifactKey[] = [],
): readonly ExecutablePass[] => Object.freeze(
  resolveParallelLayers(passes, externalInputs).flatMap((layer) => [...layer]),
);

export const passGraphOrderingOperations: PassGraphOrderingOperationsInterface = Object.freeze({
  resolveParallelLayers,
  resolveTopologicalOrder,
});
