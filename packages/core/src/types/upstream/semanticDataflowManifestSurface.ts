/**
 * Canonical manifest-level dataflow seed surface.
 *
 * This is an input surface only. It transports controller-scoped semantic
 * dataflow inputs assembled from already-resolved upstream contracts. It does
 * not contain closure/reaches/path results and therefore cannot become a
 * second dataflow authority.
 */
import type { CompleteLaravelSourceModel } from './highLevelSourceModel';
import type { SemanticDataflowInput } from './semanticDataflow';
import type { ControllerActionFlowContract } from './highLevelContracts';
import { semanticDataflowRouteParameterFacts } from './semanticDataflowRouteProjection';
import { semanticDataflowControllerFacts } from './semanticDataflowControllerProjection';
import { semanticDataflowControllerQueryFacts } from './semanticDataflowControllerQueryProjection';
import { semanticDataflowRequestFacts } from './semanticDataflowRequestProjection';
import type { Sequence } from './collections';

const sequence = <T>(items: readonly T[], index = 0): Sequence<T> =>
  index < items.length
    ? { kind: 'cons', head: items[index], tail: sequence(items, index + 1) }
    : { kind: 'empty' };

const sequenceItems = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceItems(items.tail, [...output, items.head]);

const controllerInput = (
  sourceModel: CompleteLaravelSourceModel,
  controller: ControllerActionFlowContract,
): SemanticDataflowInput => Object.freeze({
  ...controller.semantic.dataflow,
  facts: Object.freeze([
    ...controller.semantic.dataflow.facts,
    ...semanticDataflowRouteParameterFacts(sourceModel, controller),
    ...semanticDataflowControllerFacts(controller),
    ...semanticDataflowControllerQueryFacts(controller),
    ...semanticDataflowRequestFacts(sourceModel, controller),
  ]),
});

/** Assemble canonical seed inputs once at the manifest boundary. */
export const semanticDataflowInputsFromSourceModel = (
  sourceModel: CompleteLaravelSourceModel,
): Sequence<SemanticDataflowInput> => sequence(
  sequenceItems(sourceModel.contracts.controllers).map(controller => controllerInput(sourceModel, controller)),
);

export interface ManifestDataflowSeedSurface {
  /** Controller-scoped canonical inputs; never contains `reaches` closure facts. */
  readonly dataflowInputs: Sequence<SemanticDataflowInput>;
}
