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
import { semanticDataflowRouteProjectionAuthority, type SemanticDataflowRouteProjectionAuthorityInterface } from './semanticDataflowRouteProjection';
import { semanticDataflowControllerProjectionAuthority, type SemanticDataflowControllerProjectionAuthorityInterface } from './semanticDataflowControllerProjection';
import { semanticDataflowControllerQueryProjectionAuthority, type SemanticDataflowControllerQueryProjectionAuthorityInterface } from './semanticDataflowControllerQueryProjection';
import { semanticDataflowRequestProjectionAuthority, type SemanticDataflowRequestProjectionAuthorityInterface } from './semanticDataflowRequestProjection';
import type { SourceSpan } from './provenance';
import { semanticDataflowFactLineageOperations } from './semanticDataflow';

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
  ) => readonly SemanticDataflowInput[];
}

const canonicalFact = (
  fact: SemanticDataflowInputEvidenceFact,
  producer: SemanticDataflowEvidenceProducer,
): Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }> => semanticDataflowFactLineageOperations.withLineage(
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

export interface SemanticDataflowProjectionAuthoritySetInterface {
  readonly route: SemanticDataflowRouteProjectionAuthorityInterface;
  readonly controller: SemanticDataflowControllerProjectionAuthorityInterface;
  readonly controllerQuery: SemanticDataflowControllerQueryProjectionAuthorityInterface;
  readonly request: SemanticDataflowRequestProjectionAuthorityInterface;
}

const controllerSeed = (
  sourceModel: CompleteLaravelSourceModel,
  controller: ControllerActionFlowContract,
  projections: SemanticDataflowProjectionAuthoritySetInterface,
): SemanticDataflowInput => {
  const routeEnrichedSeed = projections.route
    .project(sourceModel, controller)
    .appendToControllerSeed(controller.semantic.dataflow);
  return Object.freeze({
    ...routeEnrichedSeed,
    facts: Object.freeze([
      ...routeEnrichedSeed.facts,
      ...projections.controller.project(controller),
      ...projections.controllerQuery.project(controller),
      ...projections.request.project(sourceModel, controller),
    ]),
  });
};

const semanticDataflowProjectionAuthorities: SemanticDataflowProjectionAuthoritySetInterface = Object.freeze({
  route: semanticDataflowRouteProjectionAuthority,
  controller: semanticDataflowControllerProjectionAuthority,
  controllerQuery: semanticDataflowControllerQueryProjectionAuthority,
  request: semanticDataflowRequestProjectionAuthority,
});

export const semanticDataflowInputProducer: SemanticDataflowSeedProducerInterface = Object.freeze({
  create,
  controllerSeed: (sourceModel: CompleteLaravelSourceModel, controller: ControllerActionFlowContract) =>
    controllerSeed(sourceModel, controller, semanticDataflowProjectionAuthorities),
  sourceModelSeeds: (sourceModel: CompleteLaravelSourceModel): readonly SemanticDataflowInput[] => Object.freeze(
    sourceModel.contracts.controllers.map(controller => controllerSeed(sourceModel, controller, semanticDataflowProjectionAuthorities)),
  ),
});
