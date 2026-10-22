import type { RouteSchemaPayload } from '../domain/validationRules';
import type { HttpErrorResponseDescriptor } from '../domain/httpErrors';
import type { SourceStatements } from './sourceStatements';
import type { RouteValidationRuleEntry } from '../domain/validationRules';

/** Closed semantic facts for a controller body, separated from compiler-owned AST projection. */
export interface ControllerBodySemanticJudgment<TSourceIdentity> {
  readonly kind: 'controller_body_semantic_judgment_completed';
  readonly sourceIdentity: TSourceIdentity;
  readonly statements: SourceStatements;
  readonly schema: RouteSchemaPayload;
  /** Canonical inline-validation facts retain per-entry source provenance through judgment publication. */
  readonly validationEntries: readonly RouteValidationRuleEntry[];
  readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

/** Upstream contract for deriving body meaning from source-bound evidence. */
export interface ControllerBodySemanticJudgmentAuthorityInterface<TBodyEvidence, TMethodEvidence, TSourceIdentity> {
  readonly kind: 'controller_body_semantic_judgment_authority';
  readonly contractVersion: 5;
  readonly sourceCorrelation: 'body-judgment-retains-the-exact-source-identity-supplied-as-input';
  readonly judgmentClosure: 'raw-typed-controller-body-evidence-is-consumed-by-the-existing-body-authority;validation-entry-lowering-and-known-error-response-judgment-are-authority-owned;source-identity-and-validation-provenance-remain-closed-through-schema-projection';
  readonly judge: (input: Readonly<{
    readonly body: TBodyEvidence;
    readonly method: TMethodEvidence;
    readonly sourceIdentity: TSourceIdentity;
  }>) => ControllerBodySemanticJudgment<TSourceIdentity>;
}
