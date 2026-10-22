/**
 * Canonical Resource -> Model knowledge operations.
 *
 * This is semantic/compiler ownership, not a scanner subcomponent. Facts are
 * canonical; the resolution index is derived and never becomes semantic truth.
 */
import type {
  ResourceModelKnowledgeDataFlow,
  ResourceModelKnowledgeDataFlowOperationsInterface,
  ResourceModelResolutionFact,
  ResourceModelResolutionOrigin,
  ResourceRelationKnowledgeFact,
} from '../../types/upstream/resourceModelKnowledgeDataFlowInterface';
import type { ModelName, RelationName, ResourceName } from '../../types/upstream/names';
import { absent, present, presenceFold, presenceOf, type Presence } from '../../types/upstream/presence';

export type {
  ResourceModelResolutionOrigin,
  ResourceModelResolutionFact,
  ResourceRelationKnowledgeFact,
  ResourceModelKnowledgeDataFlow,
} from '../../types/upstream/resourceModelKnowledgeDataFlowInterface';

export const resourceModelKnowledgeDataFlowOperations: ResourceModelKnowledgeDataFlowOperationsInterface = Object.freeze({
  empty: (): ResourceModelKnowledgeDataFlow => Object.freeze({
    kind: 'resource_model_knowledge_data_flow',
    relations: Object.freeze([]),
    resolutions: Object.freeze([]),
  }),
  createResolutionFact: (
    resource: ResourceName,
    model: ModelName,
    origin: ResourceModelResolutionOrigin,
    viaRelation: Presence<RelationName>,
  ): ResourceModelResolutionFact => Object.freeze({
    kind: 'resource_model_resolution', resource, model, origin, viaRelation,
  }),
  createRelationFact: (
    parentResource: ResourceName,
    childResource: ResourceName,
    relationKey: RelationName,
  ): ResourceRelationKnowledgeFact => Object.freeze({
    kind: 'resource_relation', parentResource, childResource, relationKey,
  }),
  deriveResolutionIndex: (dataFlow: ResourceModelKnowledgeDataFlow) =>
    Object.freeze(dataFlow.resolutions.map(fact => Object.freeze<[ResourceName, ModelName]>([fact.resource, fact.model]))),
  resolutionFor: (dataFlow: ResourceModelKnowledgeDataFlow, resource: ResourceName): Presence<ResourceModelResolutionFact> =>
    presenceFold(
      presenceOf(dataFlow.resolutions.findLast(fact => fact.resource.value.value === resource.value.value)),
      () => absent<ResourceModelResolutionFact>(),
      fact => present(fact),
    ),
});

export const emptyResourceModelKnowledgeDataFlow: ResourceModelKnowledgeDataFlowOperationsInterface['empty'] =
  resourceModelKnowledgeDataFlowOperations.empty;
export const createResourceModelResolutionFact: ResourceModelKnowledgeDataFlowOperationsInterface['createResolutionFact'] =
  resourceModelKnowledgeDataFlowOperations.createResolutionFact;
export const createResourceRelationFact: ResourceModelKnowledgeDataFlowOperationsInterface['createRelationFact'] =
  resourceModelKnowledgeDataFlowOperations.createRelationFact;
export const deriveResourceModelResolutionIndex: ResourceModelKnowledgeDataFlowOperationsInterface['deriveResolutionIndex'] =
  resourceModelKnowledgeDataFlowOperations.deriveResolutionIndex;
export const resourceModelResolutionFor: ResourceModelKnowledgeDataFlowOperationsInterface['resolutionFor'] =
  resourceModelKnowledgeDataFlowOperations.resolutionFor;
