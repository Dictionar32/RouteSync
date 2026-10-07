/**
 * Canonical manifest-level dataflow seed surface.
 *
 * This surface only transports seeds produced by the upstream semantic
 * dataflow producer. It does not assemble facts or own closure.
 */
import type { SemanticDataflowInput } from './semanticDataflow';
import { semanticDataflowInputProducer } from './semanticDataflowInputFactory';
import type { CompleteLaravelSourceModel } from './highLevelSourceModel';
import type { Sequence } from './collections';

export const semanticDataflowInputsFromSourceModel = (
  sourceModel: CompleteLaravelSourceModel,
): Sequence<SemanticDataflowInput> => semanticDataflowInputProducer.sourceModelSeeds(sourceModel);

export interface ManifestDataflowSeedSurface {
  /** Controller-scoped canonical inputs; never contains `reaches` closure facts. */
  readonly dataflowInputs: Sequence<SemanticDataflowInput>;
}
