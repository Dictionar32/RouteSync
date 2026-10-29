import type { FormRequestSource } from '../domain/request';
import type { ControllerInlineSchemaEvidence } from './controllerBodySemanticJudgmentInterface';
import type { RouteSchemaPayload, RouteValidationRuleEntry } from '../domain/validationRules';

/** Only request evidence relevant to action schema derivation crosses this boundary. */
export type ControllerActionSchemaRequestEvidence =
  | Readonly<{ readonly kind: 'form_request_schema_evidence'; readonly source: FormRequestSource }>
  | Readonly<{ readonly kind: 'no_form_request_schema_evidence' }>;

/** Schema provenance is a semantic result, not an inference left to the projection. */
export type ControllerActionSchemaDerivation =
  | Readonly<{ readonly kind: 'inline_validation_schema'; readonly schema: RouteSchemaPayload }>
  | Readonly<{ readonly kind: 'form_request_schema'; readonly schema: RouteSchemaPayload }>
  | Readonly<{ readonly kind: 'form_request_and_inline_validation_schema'; readonly schema: RouteSchemaPayload }>;

/** A schema projection that keeps its originating evidence attached as one domain value. */
export interface RouteRequestSchemaBoundaryProjection<TSourceIdentity> {
  readonly schema: RouteSchemaPayload;
  readonly schemaEvidence: RouteRequestSchemaEvidence<TSourceIdentity>;
}

/** Schema evidence projected for a route request keeps source and origin attached. */
export interface ControllerActionSchemaRouteRequestEvidence<TSourceIdentity> {
  readonly kind: 'controller_action_route_request_schema_evidence';
  readonly sourceIdentity: TSourceIdentity;
  readonly schemaOrigin: ControllerActionSchemaDerivation['kind'];
  readonly schema: RouteSchemaPayload;
  readonly inlineValidationEntries: readonly RouteValidationRuleEntry[];
  /** Domain continuation projects the canonical schema without re-deriving origin. */
  readonly continueToSchema: () => RouteSchemaPayload;
  /** Projects schema and its exact evidence together for the route boundary. */
  readonly continueToRouteBoundarySchema: () => RouteRequestSchemaBoundaryProjection<TSourceIdentity>;
}

/** Explicit absence for route targets that have no correlated controller-action schema judgment. */
export interface RouteRequestSchemaEvidenceUnavailable<TSourceIdentity> {
  readonly kind: 'route_request_schema_evidence_unavailable';
  readonly reason: 'action_judgment_unmatched' | 'action_judgment_ambiguous' | 'action_judgment_provenance_invalid' | 'non_controller_route_target';
  readonly continueToSchema: () => RouteSchemaPayload;
  /** Projects canonical empty schema together with the typed absence evidence and reason. */
  readonly continueToRouteBoundarySchema: () => RouteRequestSchemaBoundaryProjection<TSourceIdentity>;
}

export type RouteRequestSchemaEvidence<TSourceIdentity> =
  | ControllerActionSchemaRouteRequestEvidence<TSourceIdentity>
  | RouteRequestSchemaEvidenceUnavailable<TSourceIdentity>;

/** Completed schema judgment retains its source and owns the next route-domain operation. */
export interface ControllerActionSchemaSemanticJudgment<TSourceIdentity> {
  readonly kind: 'controller_action_schema_semantic_judgment_completed';
  readonly sourceIdentity: TSourceIdentity;
  readonly derivation: ControllerActionSchemaDerivation;
  /** Inline validation provenance survives schema closure rather than being discarded after lowering. */
  readonly inlineValidationEntries: readonly RouteValidationRuleEntry[];
  /** Domain operation: continue the closed schema judgment into route-request evidence without re-deriving origin. */
  readonly forRouteRequest: () => ControllerActionSchemaRouteRequestEvidence<TSourceIdentity>;
  /** One explicit evidence value continues through route boundary and manifest projections. */
  readonly routeRequestEvidence: ControllerActionSchemaRouteRequestEvidence<TSourceIdentity>;
}

/** Upstream authority contract for closing request and inline-validation schema evidence. */
export interface ControllerActionSchemaSemanticJudgmentAuthorityInterface<TSourceIdentity> {
  readonly kind: 'controller_action_schema_semantic_judgment_authority';
  readonly contractVersion: 7;
  readonly sourceCorrelation: 'schema-judgment-retains-the-exact-action-source-identity';
  readonly derivationClosure: 'schema-origin-is-explicit-and-the-canonical-route-schema-payload-is-published-once;form-request-presence-is-decided-by-the-evidence-discriminant-not-by-field-cardinality';
  readonly judge: (input: Readonly<{
    readonly requestEvidence: ControllerActionSchemaRequestEvidence;
    readonly inlineSchema: RouteSchemaPayload;
    readonly inlineSchemaEvidence: ControllerInlineSchemaEvidence;
    readonly inlineValidationEntries: readonly RouteValidationRuleEntry[];
    readonly sourceIdentity: TSourceIdentity;
  }>) => ControllerActionSchemaSemanticJudgment<TSourceIdentity>;
}
