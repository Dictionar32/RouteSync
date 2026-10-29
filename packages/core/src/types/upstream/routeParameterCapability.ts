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

/** Closed operation surface consumed by route projection and CLI SDK generation. */
export interface RouteParameterCapabilityOperationsInterface {
  readonly kind: 'route_parameter_capability_operations';
  readonly contractVersion: 1;
  readonly fromRoute: (
    parameter: RouteParameter,
    targetScope: 'collection' | 'member',
  ) => RouteParameterCapabilityContract;
  readonly referenceFromCapability: (
    capability: RouteParameterCapabilityContract,
  ) => RouteParameterCapabilityReference;
  readonly referencesFromRoute: (
    route: RouteSemanticFlow,
  ) => readonly RouteParameterCapabilityReference[];
  readonly referenceFromRoute: (
    route: RouteSemanticFlow,
  ) => RouteParameterCapabilityReference | undefined;
  readonly targetScopeFromRoute: (route: RouteSemanticFlow) => 'collection' | 'member';
}

const routeTargetScopeFromRouteImpl = (route: RouteSemanticFlow): 'collection' | 'member' =>
  route.identity.parameters.path.length > 0 ? 'member' : 'collection';

const routeParameterCapabilityFromRouteImpl = (
  parameter: RouteParameter,
  targetScope: 'collection' | 'member',
): RouteParameterCapabilityContract => {
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
};

const routeParameterCapabilityReferenceFromCapabilityImpl = (
  capability: RouteParameterCapabilityContract,
): RouteParameterCapabilityReference => Object.freeze({
  kind: 'route_parameter_capability_reference',
  name: capability.parameter.name.value.value,
  targetScope: capability.targetScope,
});

/** Resolve canonical path-parameter capability references once at the upstream boundary. */
const routeParameterCapabilityReferencesFromRouteImpl = (
  route: RouteSemanticFlow,
): readonly RouteParameterCapabilityReference[] => {
  const targetScope = routeTargetScopeFromRouteImpl(route);
  return Object.freeze(route.identity.parameters.path.map((parameter) =>
    routeParameterCapabilityReferenceFromCapabilityImpl(
      routeParameterCapabilityFromRouteImpl(parameter, targetScope),
    ),
  ));
};

const routeParameterCapabilityReferenceFromRouteImpl = (
  route: RouteSemanticFlow,
): RouteParameterCapabilityReference | undefined =>
  routeParameterCapabilityReferencesFromRouteImpl(route)[0];

/** Runtime operation object is the only exported value-level authority for this contract. */
export const routeParameterCapabilityOperations: RouteParameterCapabilityOperationsInterface = Object.freeze({
  kind: 'route_parameter_capability_operations',
  contractVersion: 1,
  fromRoute: routeParameterCapabilityFromRouteImpl,
  referenceFromCapability: routeParameterCapabilityReferenceFromCapabilityImpl,
  referencesFromRoute: routeParameterCapabilityReferencesFromRouteImpl,
  referenceFromRoute: routeParameterCapabilityReferenceFromRouteImpl,
  targetScopeFromRoute: routeTargetScopeFromRouteImpl,
});
