/**
 * Upstream boundary for constructing canonical semantic dataflow inputs.
 *
 * Scanner/wiring code may supply already-normalized semantic evidence, but it
 * must not own canonical input construction or producer lineage. Those belong
 * to this upstream contract so manifest, controller, route, request, and
 * resource producers converge on one input shape.
 */
import type { SemanticDataflowFact, SemanticDataflowIdentity, SemanticDataflowInput, SemanticDataflowRole, SemanticDataflowGuard } from './semanticDataflow';
import type { CompleteLaravelSourceModel } from './highLevelSourceModel';
import type { ControllerActionFlowContract } from './highLevelContracts';
import { semanticDataflowRouteParameterFacts } from './semanticDataflowRouteProjection';
import { semanticDataflowControllerFacts } from './semanticDataflowControllerProjection';
import { semanticDataflowControllerQueryFacts } from './semanticDataflowControllerQueryProjection';
import { semanticDataflowRequestFacts } from './semanticDataflowRequestProjection';
import type { Sequence } from './collections';
import type { SourceSpan } from './provenance';
import { semanticDataflowFactWithLineage } from './semanticDataflow';

export type SemanticDataflowInputEvidenceFact = Readonly<{
  readonly kind: 'dependency' | 'value_flow';
  readonly source: SemanticDataflowIdentity;
  readonly target: SemanticDataflowIdentity;
  readonly role: SemanticDataflowRole;
  readonly guard?: SemanticDataflowGuard;
}>;

export type SemanticDataflowEvidenceProducer = 'route' | 'controller' | 'request' | 'resource';

/**
 * Closed upstream evidence boundary. Scanner/wiring supplies semantic evidence
 * as one value; canonical input construction and lineage remain upstream-owned.
 */
export type SemanticDataflowEvidence = Readonly<{
  readonly node: SemanticDataflowIdentity;
  readonly source: SourceSpan;
  readonly facts: readonly SemanticDataflowInputEvidenceFact[];
  readonly producer: SemanticDataflowEvidenceProducer;
}>;

export interface SemanticDataflowInputProducerInterface {
  readonly create: (evidence: SemanticDataflowEvidence) => SemanticDataflowInput;
}


export interface SemanticDataflowSeedProducerInterface extends SemanticDataflowInputProducerInterface {
  readonly controllerSeed: (
    sourceModel: CompleteLaravelSourceModel,
    controller: ControllerActionFlowContract,
  ) => SemanticDataflowInput;
  readonly sourceModelSeeds: (
    sourceModel: CompleteLaravelSourceModel,
  ) => Sequence<SemanticDataflowInput>;
}

const sequence = <T>(items: readonly T[], index = 0): Sequence<T> =>
  index < items.length
    ? { kind: 'cons', head: items[index], tail: sequence(items, index + 1) }
    : { kind: 'empty' };

const sequenceItems = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceItems(items.tail, [...output, items.head]);

const canonicalFact = (
  fact: SemanticDataflowInputEvidenceFact,
  producer: SemanticDataflowEvidenceProducer,
): Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }> => semanticDataflowFactWithLineage(
  Object.freeze({
    kind: fact.kind,
    source: fact.source,
    target: fact.target,
    role: fact.role,
    ...(fact.guard === undefined ? {} : { guard: fact.guard }),
  }),
  producer,
);

const create = (
  evidence: SemanticDataflowEvidence,
): SemanticDataflowInput => Object.freeze({
  kind: 'semantic_dataflow_input',
  node: evidence.node,
  source: evidence.source,
  facts: Object.freeze(evidence.facts.map(fact => canonicalFact(fact, evidence.producer))),
  origin: Object.freeze({
    kind: 'semantic_dataflow_origin',
    source: 'semantic_dataflow_input',
    identity: evidence.node,
    closed: true,
  }),
  closed: true,
});

const controllerSeed = (
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

export const semanticDataflowInputProducer: SemanticDataflowSeedProducerInterface = Object.freeze({
  create,
  controllerSeed,
  sourceModelSeeds: (sourceModel: CompleteLaravelSourceModel) => sequence(
    sequenceItems(sourceModel.contracts.controllers).map(controller => controllerSeed(sourceModel, controller)),
  ),
});
