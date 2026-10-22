import type { RouteSemanticFlow } from '../domain/routes';
import type { CrudRole, RouteHookKind } from './routeExecutionVocabulary';

export type ResourceGroupShape = 'full_crud' | 'read_only_crud' | 'flexible_crud' | 'custom' | 'singleton';

export interface ResourceGroupCapabilityEvidence {
  readonly kind: 'resource_group_capability_evidence';
  readonly source: 'closed_route_capabilities';
  readonly routeCount: number;
  readonly roles: readonly CrudRole[];
  readonly hasItemRoute: boolean;
  readonly closed: true;
}

/** Closed identity of a route selected by upstream semantic reasoning. */
export interface ResourceGroupRouteReference {
  readonly kind: 'resource_group_route_reference';
  readonly routeName: string;
  readonly actionName: string;
  /** Canonical cache-operation identity resolved by upstream role algebra. */
  readonly cacheOperationKey: string;
  readonly hookKind: RouteHookKind;
  readonly parameterKey?: string;
  readonly targetScope: 'collection' | 'member';
  readonly closed: true;
}

/** Absence and ambiguity are explicit outcomes, never invitations to infer downstream. */
export type ResourceGroupSlotDecision =
  | { readonly kind: 'route'; readonly route: ResourceGroupRouteReference; readonly closed: true }
  | { readonly kind: 'absent'; readonly closed: true }
  | { readonly kind: 'ambiguous'; readonly routeNames: readonly string[]; readonly closed: true };

export interface ResourceGroupExecutionSlots {
  readonly index: ResourceGroupSlotDecision;
  readonly show: ResourceGroupSlotDecision;
  readonly create: ResourceGroupSlotDecision;
  readonly updateMember: ResourceGroupSlotDecision;
  readonly updateCollection: ResourceGroupSlotDecision;
  readonly deleteMember: ResourceGroupSlotDecision;
  readonly deleteCollection: ResourceGroupSlotDecision;
  readonly custom: readonly ResourceGroupRouteReference[];
  readonly closed: true;
}

/** Proof-carrying semantic contract for one canonical route group. */
export interface ResourceGroupCapabilityContract {
  readonly kind: 'resource_group_capability';
  readonly groupName: string;
  readonly shape: ResourceGroupShape;
  readonly evidence: ResourceGroupCapabilityEvidence;
  /** All route references, including normalized cache-operation identities. */
  readonly routes: readonly ResourceGroupRouteReference[];
  readonly executionSlots: ResourceGroupExecutionSlots;
  readonly closed: true;
}

/** Type-only algebra boundary: implementations compose only already-closed route capabilities. */
export interface ResourceGroupCapabilityAlgebraInterface {
  readonly compose: (routes: readonly RouteSemanticFlow[]) => readonly ResourceGroupCapabilityContract[];
}
