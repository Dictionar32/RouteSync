/**
 * Canonical Resource -> Model knowledge/data-flow.
 *
 * Semantic truth lives in immutable facts. Maps are derived indexes only.
 * This module deliberately does not depend on parser/Tree-sitter syntax.
 */

import type { ModelName, RelationName, ResourceName } from '../../../../types/upstream/names';
import { absent, fromOptional, present, type Presence } from '../../../../types/upstream/presence';
import { relationEqual, relationGate } from '../../../../semantic/kernel/semanticRelations';
import { relationFold, relationFirstOption, relationOptionFold } from '../../../../semantic/kernel/relationalSequence';

export type ResourceModelResolutionOriginCode =
    | 'controller_dataflow'
    | 'convention'
    | 'relation_propagation';

export interface ResourceModelResolutionFact {
    readonly kind: 'resource_model_resolution';
    readonly resource: ResourceName;
    readonly model: ModelName;
    readonly origin: ResourceModelResolutionOriginCode;
    readonly viaRelation: Presence<RelationName>;
}

export interface ResourceRelationKnowledgeFact {
    readonly kind: 'resource_relation';
    readonly parentResource: ResourceName;
    readonly childResource: ResourceName;
    readonly relationKey: RelationName;
}

export interface ResourceModelKnowledgeDataFlow {
    readonly kind: 'resource_model_knowledge_data_flow';
    readonly relations: readonly ResourceRelationKnowledgeFact[];
    readonly resolutions: readonly ResourceModelResolutionFact[];
}

export const emptyResourceModelKnowledgeDataFlow = (): ResourceModelKnowledgeDataFlow => Object.freeze({
    kind: 'resource_model_knowledge_data_flow',
    relations: Object.freeze([]),
    resolutions: Object.freeze([]),
});

export const createResourceModelResolutionFact = (
    resource: ResourceName,
    model: ModelName,
    origin: ResourceModelResolutionOriginCode,
    viaRelation?: RelationName,
): ResourceModelResolutionFact => Object.freeze({
    kind: 'resource_model_resolution',
    resource,
    model,
    origin,
    viaRelation: fromOptional(viaRelation),
});

export const createResourceRelationFact = (
    parentResource: ResourceName,
    childResource: ResourceName,
    relationKey: RelationName,
): ResourceRelationKnowledgeFact => Object.freeze({
    kind: 'resource_relation',
    parentResource,
    childResource,
    relationKey,
});

/**
 * Derived lookup. This function is intentionally the only place where the
 * semantic resolution collection is projected into a Map for lookup speed.
 */
export const deriveResourceModelResolutionIndex = (
    dataFlow: ResourceModelKnowledgeDataFlow,
): readonly (readonly [ResourceName, ModelName])[] =>
    relationFold(
        dataFlow.resolutions,
        [] as readonly (readonly [ResourceName, ModelName])[],
        (index, fact) => [
            ...index,
            [fact.resource, fact.model] as const,
        ],
    );

export const resourceModelResolutionFor = (
    dataFlow: ResourceModelKnowledgeDataFlow,
    resource: ResourceName,
): Presence<ResourceModelResolutionFact> =>
    relationOptionFold(
        relationFirstOption(
            [...dataFlow.resolutions].reverse(),
            fact => relationEqual(fact.resource.value.value, resource.value.value),
        ),
        () => absent<ResourceModelResolutionFact>(),
        fact => present(fact),
    );
