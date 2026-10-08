import type { RouteIdentity, RouteCapabilityContract } from './route';
import type { SemanticReasoningContract } from './semanticReasoning';
import type {
  OperationIdentity,
  OperationIdentityCapabilityContract,
} from './operationIdentityCapability';

/**
 * Upstream semantic authority for operation identity.
 *
 * This module owns construction of the closed capability. The public
 * interface/contract module contains only types; it does not reason, derive,
 * or construct semantic judgments.
 */
export function operationIdentityCapabilityFromRoute(
  route: Pick<RouteCapabilityContract, 'evidence' | 'derivation' | 'provenance' | 'reasoning' | 'closed'> & { readonly identity: RouteIdentity },
): OperationIdentityCapabilityContract {
  const identity: OperationIdentity = Object.freeze({ kind: 'operation_identity', route: route.identity });
  const reasoning: SemanticReasoningContract = route.reasoning;

  return Object.freeze({
    kind: 'operation_identity_capability',
    authority: 'upstream',
    identity,
    reasoning,
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

