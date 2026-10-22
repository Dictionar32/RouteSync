import type { ModelName, RelationName, ResourceName } from './names';
import type { Presence } from './presence';

export type ResourceModelResolutionOrigin =
  | Readonly<{ readonly kind: 'controller_dataflow' }>
  | Readonly<{ readonly kind: 'convention' }>
  | Readonly<{ readonly kind: 'relation_propagation' }>;

/** Canonical constructors for the closed Resource model-resolution origin ADT. */
export const ResourceModelResolutionOrigin: Readonly<{
  controllerDataflow: Readonly<{ readonly kind: 'controller_dataflow' }>;
  convention: Readonly<{ readonly kind: 'convention' }>;
  relationPropagation: Readonly<{ readonly kind: 'relation_propagation' }>;
}> = Object.freeze({
  controllerDataflow: Object.freeze({ kind: 'controller_dataflow' }),
  convention: Object.freeze({ kind: 'convention' }),
  relationPropagation: Object.freeze({ kind: 'relation_propagation' }),
});

export interface ResourceModelResolutionFact {
  readonly kind: 'resource_model_resolution';
  readonly resource: ResourceName;
  readonly model: ModelName;
  readonly origin: ResourceModelResolutionOrigin;
  readonly viaRelation: Presence<RelationName>;
}

export interface ResourceRelationKnowledgeFact {
  readonly kind: 'resource_relation';
  readonly parentResource: ResourceName;
  readonly childResource: ResourceName;
  readonly relationKey: RelationName;
}

/** Closed semantic knowledge payload shared by Resource evidence and binding authorities. */
export interface ResourceModelKnowledgeDataFlow {
  readonly kind: 'resource_model_knowledge_data_flow';
  readonly relations: readonly ResourceRelationKnowledgeFact[];
  readonly resolutions: readonly ResourceModelResolutionFact[];
}


/** Typed operations for constructing and querying canonical Resource model knowledge. */
export interface ResourceModelKnowledgeDataFlowOperationsInterface {
  readonly empty: () => ResourceModelKnowledgeDataFlow;
  readonly createResolutionFact: (
    resource: ResourceName,
    model: ModelName,
    origin: ResourceModelResolutionOrigin,
    viaRelation: Presence<RelationName>,
  ) => ResourceModelResolutionFact;
  readonly createRelationFact: (
    parentResource: ResourceName,
    childResource: ResourceName,
    relationKey: RelationName,
  ) => ResourceRelationKnowledgeFact;
  readonly deriveResolutionIndex: (
    dataFlow: ResourceModelKnowledgeDataFlow,
  ) => readonly (readonly [ResourceName, ModelName])[];
  readonly resolutionFor: (
    dataFlow: ResourceModelKnowledgeDataFlow,
    resource: ResourceName,
  ) => Presence<ResourceModelResolutionFact>;
}
