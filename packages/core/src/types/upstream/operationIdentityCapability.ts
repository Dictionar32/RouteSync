import type { RouteIdentity, RouteCapabilityContract } from './route';
import type { SemanticCapabilityContractInterface, SemanticCapabilityEvidence } from './semanticCapability';

export interface OperationIdentityCapabilityEvidence extends SemanticCapabilityEvidence {
  readonly kind: 'operation_identity_capability_evidence';
  readonly route: RouteIdentity;
}

export interface OperationIdentity {
  readonly kind: 'operation_identity';
  readonly route: RouteIdentity;
}

export interface OperationIdentityCapabilityAlgebraInterface
  extends SemanticCapabilityContractInterface<'operation_identity_capability', OperationIdentityCapabilityEvidence, OperationIdentity> {
  readonly identity: OperationIdentity;
}

export interface OperationIdentityCapabilityContract extends OperationIdentityCapabilityAlgebraInterface {}
export interface OperationIdentityCapabilityInterface extends OperationIdentityCapabilityContract {}
export interface OperationIdentityCapabilityConsumerInterface extends OperationIdentityCapabilityContract {}

/** Runtime-safe reference: representation only; semantic ownership remains upstream. */
export interface OperationIdentityReference {
  readonly kind: 'operation_identity_reference';
  readonly identity: Readonly<{
    readonly key: string;
    readonly method: string;
    readonly path: string;
  }>;
}

export function operationIdentityCapabilityFromRoute(
  route: Pick<RouteCapabilityContract, 'evidence' | 'derivation' | 'provenance' | 'closed'> & { readonly identity: RouteIdentity },
): OperationIdentityCapabilityContract {
  const identity: OperationIdentity = Object.freeze({ kind: 'operation_identity', route: route.identity });
  return Object.freeze({
    kind: 'operation_identity_capability',
    authority: 'upstream',
    identity,
    evidence: Object.freeze({
      kind: 'operation_identity_capability_evidence',
      route: route.identity,
      closed: true,
    }),
    derivation: route.derivation,
    provenance: route.provenance,
    closed: true,
  });
}

export function operationIdentityReferenceFromCapability(
  capability: OperationIdentityCapabilityContract,
): OperationIdentityReference {
  const route = capability.identity.route;
  return Object.freeze({
    kind: 'operation_identity_reference',
    identity: Object.freeze({
      key: route.key.value.value,
      method: route.method.kind === 'match' ? route.method.methods.join('|') : route.method.kind.toUpperCase(),
      path: route.path.value.value,
    }),
  });
}
