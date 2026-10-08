/** Closed upstream route-parameter capability and projection reference. */
import { semanticReasoningContract } from './semanticReasoning';
import type { SemanticCapabilityEvidence, SemanticCapabilityContractInterface } from './semanticCapability';
import type { RouteParameter } from './route';
import type { RouteSemanticFlow } from '../domain/routes';

export interface RouteParameterCapabilityEvidence extends SemanticCapabilityEvidence {
  readonly kind: 'route_parameter_capability_evidence';
  readonly source: 'route_identity_parameters';
}

export interface RouteParameterCapabilityAlgebraInterface
  extends SemanticCapabilityContractInterface<'route_parameter_capability', RouteParameterCapabilityEvidence, string> {
  readonly parameter: RouteParameter;
  readonly targetScope: 'collection' | 'member';
}

export interface RouteParameterCapabilityContract extends RouteParameterCapabilityAlgebraInterface {}
export interface RouteParameterCapabilityInterface extends RouteParameterCapabilityContract {}
export interface RouteParameterCapabilityConsumerInterface extends RouteParameterCapabilityInterface {}

export interface RouteParameterCapabilityReference {
  readonly kind: 'route_parameter_capability_reference';
  readonly name: string;
  readonly targetScope: 'collection' | 'member';
}

export function routeParameterCapabilityFromRoute(
  parameter: RouteParameter,
  targetScope: 'collection' | 'member',
): RouteParameterCapabilityContract {
  const name = parameter.name.value.value;
  return Object.freeze({
    kind: 'route_parameter_capability' as const,
    authority: 'upstream' as const,
    identity: name,
    parameter,
    targetScope,
    evidence: Object.freeze({
      kind: 'route_parameter_capability_evidence' as const,
      source: 'route_identity_parameters' as const,
      closed: true as const,
    }),
    derivation: Object.freeze({
      kind: 'semantic_capability_derivation' as const,
      strategy: 'evidence_resolution' as const,
      closed: true as const,
    }),
    provenance: Object.freeze({
      kind: 'semantic_capability_provenance' as const,
      lane: 'upstream' as const,
      closed: true as const,
    }),
    reasoning: semanticReasoningContract('evidence_resolution'),
    closed: true as const,
  });
}

export function routeParameterCapabilityReferenceFromCapability(
  capability: RouteParameterCapabilityContract,
): RouteParameterCapabilityReference {
  return Object.freeze({
    kind: 'route_parameter_capability_reference' as const,
    name: capability.parameter.name.value.value,
    targetScope: capability.targetScope,
  });
}


/** Projection helper: resolve the canonical path parameter once upstream. */
export function routeParameterCapabilityReferenceFromRoute(
  route: RouteSemanticFlow,
): RouteParameterCapabilityReference | undefined {
  const parameter = route.identity.parameters.path[0];
  if (!parameter) return undefined;
  return routeParameterCapabilityReferenceFromCapability(
    routeParameterCapabilityFromRoute(parameter, 'member'),
  );
}


export function routeTargetScopeFromRoute(route: RouteSemanticFlow): 'collection' | 'member' {
  return route.identity.parameters.path.length > 0 ? 'member' : 'collection';
}
