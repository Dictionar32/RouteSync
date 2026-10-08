/**
 * Closed upstream Resource -> Model -> primary-key capability.
 *
 * The resource/model relationship and the model key semantic type are source
 * semantics. Downstream consumers receive this closed capability and must not
 * rediscover the model by matching generated resource/group names.
 */
import type { ModelAst, ResourceAst } from './ast';
import type { ModelKeySemanticType } from './model';
import type { ModelName, ResourceName } from './names';
import type { SemanticCapabilityInterface, SemanticCapabilityEvidence } from './semanticCapability';
import type { UpstreamWiringInterface } from '../interfaces/interfaceDependencyBoundary';
import { semanticReasoningContract, type SemanticReasoningContract } from './semanticReasoning';

export interface ResourceModelKeyCapabilityEvidence extends SemanticCapabilityEvidence {
  readonly kind: 'resource_model_key_capability_evidence';
  readonly source: 'resource_model_reference';
  readonly closed: true;
}

export interface ResourceModelKeyCapabilityIdentity {
  readonly kind: 'resource_model_key_capability_identity';
  readonly resource: ResourceName;
  readonly model: ModelName;
}

export interface ResourceModelKeyCapabilityContract extends SemanticCapabilityInterface<
  'resource_model_key_capability',
  ResourceModelKeyCapabilityEvidence,
  ResourceModelKeyCapabilityIdentity
> {
  readonly key: ModelKeySemanticType;
  readonly reasoning: SemanticReasoningContract;
}


/**
 * Explicit upstream -> downstream boundary for the resource/model/key capability.
 * The downstream surface can only project a closed capability; it cannot resolve
 * the Resource -> Model relation again.
 */
export interface ResourceModelKeyCapabilityProjectionInterface<
  Downstream,
> extends UpstreamWiringInterface<
  ResourceModelKeyCapabilityContract,
  Downstream
> {}

const reasoning = semanticReasoningContract('evidence_resolution');

const sameModel = (left: ModelName, right: ModelName): boolean =>
  left.value.value === right.value.value;

/**
 * Construct the closed capability from already-resolved upstream AST facts.
 * No CLI/group-name heuristic participates in this relation.
 */
export const resourceModelKeyCapabilitiesFromAsts = (
  resources: readonly ResourceAst[],
  models: readonly ModelAst[],
): readonly ResourceModelKeyCapabilityContract[] => Object.freeze(
  resources.flatMap(resource => {
    const model = models.find(candidate => sameModel(candidate.semantic.identity.name, resource.semantic.model.name));
    if (!model) return [];

    return [Object.freeze({
      kind: 'resource_model_key_capability' as const,
      authority: 'upstream' as const,
      identity: Object.freeze({
        kind: 'resource_model_key_capability_identity' as const,
        resource: resource.semantic.name,
        model: model.semantic.identity.name,
      }),
      key: model.semantic.key.semanticType,
      reasoning,
      evidence: Object.freeze({
        kind: 'resource_model_key_capability_evidence' as const,
        source: 'resource_model_reference' as const,
        closed: true as const,
      }),
      derivation: Object.freeze({
        kind: 'semantic_capability_derivation' as const,
        strategy: reasoning.strategy,
        closed: true as const,
      }),
      provenance: Object.freeze({
        kind: 'semantic_capability_provenance' as const,
        lane: 'upstream' as const,
        closed: true as const,
      }),
      closed: true as const,
    })];
  }),
);

export const resourceModelKeyCapabilityFor = (
  capabilities: readonly ResourceModelKeyCapabilityContract[],
  resource: ResourceName,
): ResourceModelKeyCapabilityContract | undefined =>
  capabilities.find(capability => capability.identity.resource.value.value === resource.value.value);
