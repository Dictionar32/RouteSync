import type { ArtifactKey } from '../artifacts/types';
import type { ExecutablePass } from './ExecutablePass';
import { passGraphAnalysisOperations, type PassGraphAnalysisInterface } from './graph/graphAnalyzer';
import { passGraphOrderingOperations } from './graph/topologicalSorter';

export class PassGraph {
  public static buildAdjacency(passes: readonly ExecutablePass[]): PassGraphAnalysisInterface['adjacency'] {
    return passGraphAnalysisOperations.buildAdjacency(passes);
  }

  public static resolve(passes: readonly ExecutablePass[], externalInputs: readonly ArtifactKey[] = []): readonly ExecutablePass[] {
    return passGraphOrderingOperations.resolveTopologicalOrder(passes, externalInputs);
  }

  public static resolveLayers(passes: readonly ExecutablePass[], externalInputs: readonly ArtifactKey[] = []): readonly (readonly ExecutablePass[])[] {
    return passGraphOrderingOperations.resolveParallelLayers(passes, externalInputs);
  }
}
