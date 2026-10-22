import type { FormRequestSource } from '../domain/request';
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

/** Completed schema judgment retains the exact source identity and derivation outcome. */
export interface ControllerActionSchemaSemanticJudgment<TSourceIdentity> {
  readonly kind: 'controller_action_schema_semantic_judgment_completed';
  readonly sourceIdentity: TSourceIdentity;
  readonly derivation: ControllerActionSchemaDerivation;
  /** Inline validation provenance survives schema closure rather than being discarded after lowering. */
  readonly inlineValidationEntries: readonly RouteValidationRuleEntry[];
}

/** Upstream authority contract for closing request and inline-validation schema evidence. */
export interface ControllerActionSchemaSemanticJudgmentAuthorityInterface<TSourceIdentity> {
  readonly kind: 'controller_action_schema_semantic_judgment_authority';
  readonly contractVersion: 3;
  readonly sourceCorrelation: 'schema-judgment-retains-the-exact-action-source-identity';
  readonly derivationClosure: 'schema-origin-is-explicit-and-the-canonical-route-schema-payload-is-published-once;form-request-presence-is-decided-by-the-evidence-discriminant-not-by-field-cardinality';
  readonly judge: (input: Readonly<{
    readonly requestEvidence: ControllerActionSchemaRequestEvidence;
    readonly inlineSchema: RouteSchemaPayload;
    readonly inlineValidationEntries: readonly RouteValidationRuleEntry[];
    readonly sourceIdentity: TSourceIdentity;
  }>) => ControllerActionSchemaSemanticJudgment<TSourceIdentity>;
}
