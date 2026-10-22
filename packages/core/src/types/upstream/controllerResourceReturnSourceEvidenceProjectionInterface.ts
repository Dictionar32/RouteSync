import type {
  ControllerResourceBindingCandidate,
} from './controllerResourceBindingInterface';
import type { ControllerResponseReferenceJudgment, ControllerSemanticVariableFlow } from './controller';
import type {
  ControllerStaticCallClassNameResolutionContextEvidence,
  ControllerStaticCallModelClassIdentity,
} from './controllerStaticCallOriginInterface';

/** A returned source expression paired with the candidate evidence projected from it. */
export interface ControllerResourceReturnSourceEvidence<TSourceLocation> {
  readonly kind: 'controller_resource_return_source_evidence';
  readonly source: TSourceLocation;
  readonly candidate: ControllerResourceBindingCandidate;
}

/**
 * One source-level return expression as parser evidence. The expression itself remains
 * opaque to this upstream contract; only the scanner adapter knows its concrete AST.
 */
export interface ControllerResourceReturnExpressionEvidence<TExpression, TSourceLocation> {
  readonly kind: 'controller_resource_return_expression_evidence';
  readonly expression: TExpression;
  readonly source: TSourceLocation;
}

/**
 * Complete, source-bound input for projecting returned resource candidates. This is
 * deliberately a projection contract, not a second resource semantic authority:
 * applicability and resolved/unresolved outcomes remain owned by
 * ControllerResourceBindingAuthorityInterface.
 */
export interface ControllerResourceReturnSourceEvidenceProjectionInput<
  TExpression,
  TSourceLocation,
> {
  readonly kind: 'controller_resource_return_source_evidence_projection_input';
  readonly returnedExpressions: readonly ControllerResourceReturnExpressionEvidence<TExpression, TSourceLocation>[];
  readonly semanticVariables: ControllerSemanticVariableFlow;
  readonly response: ControllerResponseReferenceJudgment;
  readonly modelClasses: readonly ControllerStaticCallModelClassIdentity[];
  readonly classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence;
}

/**
 * Projects syntax into typed candidate evidence without deciding resource applicability.
 * A production implementation must preserve the exact source location of each candidate.
 */
export interface ControllerResourceReturnSourceEvidenceProjectionInterface<
  TExpression,
  TSourceLocation,
> {
  readonly kind: 'controller_resource_return_source_evidence_projection';
  readonly contractVersion: 1;
  readonly project: (
    input: ControllerResourceReturnSourceEvidenceProjectionInput<TExpression, TSourceLocation>,
  ) => readonly ControllerResourceReturnSourceEvidence<TSourceLocation>[];
  readonly semanticOwnership: 'source-shape-only;ControllerResourceBindingAuthorityInterface-owns-applicability-and-closed-resource-judgment';
  readonly provenanceOwnership: 'each-candidate-retains-the-source-location-of-the-exact-return-expression-that-produced-it';
}

