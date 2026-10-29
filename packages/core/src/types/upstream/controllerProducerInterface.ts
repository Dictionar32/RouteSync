import type { ControllerAst } from './ast';
import type { ControllerMethod, ControllerMethodContract } from './controller';
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { ControllerDeclarationEvidence, ControllerMethodEvidence } from './controllerEvidence';
import type { PhpAstExpressionKind } from './phpAstSyntaxKind';
import type { ControllerName, SourceFile } from './names';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { ResponseShape } from '../domain/responseShapes';
import type { ControllerResponseAttributeClassNameContextEvidence } from './controllerEvidence';

/** Input facts are already source-derived; the producer must not infer invocation meaning. */
export interface ControllerProducerInput {
  readonly declaration: ControllerDeclarationEvidence;
  /** Canonical source identity and its exact integrated response travel as one judgment. */
  readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;
}

/** Canonical controller artifacts produced from the supplied declaration evidence. */
export interface ControllerMethodEvidenceSyntax {
  readonly source: Readonly<{ readonly startOffset: number; readonly endOffset: number }>;
  readonly responseAttribute: Readonly<{ readonly kind: 'response_attribute_not_declared' }> | Readonly<{ readonly kind: 'response_attribute_declared'; readonly responseName: import('./names').ResponseTypeName; readonly shape: ResponseShape; readonly classNameResolutionContext: ControllerResponseAttributeClassNameContextEvidence; readonly source: Readonly<{ readonly startOffset: number; readonly endOffset: number }> }>;
  readonly returns: readonly Readonly<{
    readonly source: Readonly<{ readonly startOffset: number; readonly endOffset: number }>;
    readonly expression: Readonly<{
      readonly source: Readonly<{ readonly startOffset: number; readonly endOffset: number }>;
      readonly kind: PhpAstExpressionKind;
    }>;
  }>[];
}

export interface ControllerMethodEvidenceProjectionInput {
  readonly controller: ControllerName;
  readonly sourceFile: SourceFile;
  readonly method: ControllerMethodEvidenceSyntax;
  readonly action: ControllerActionFlowContract;
  readonly contract: ControllerMethodContract;
}

export interface ControllerProducerResult {
  readonly ast: ControllerAst;
  readonly actions: readonly ControllerActionFlowContract[];
  readonly methods: Sequence<ControllerMethodContract>;
  /** Exact upstream judgment received by the producer; never reconstructed or widened. */
  readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;
}

/** Semantic ownership contract for declaration-to-controller-artifact projection. */
export interface ControllerProducerContract {
  readonly kind: 'controller_producer_contract';
  readonly version: 5;
  readonly inputOwnership: 'controller-declaration-evidence-and-one-source-correlated-invocation-judgment-are-the-only-input-authorities';
  readonly projectionRule: 'producer-projects-declared-method-actions-and-method-contracts-without-reclassifying-invocation-judgments';
  readonly sourceRule: 'canonical-controller-ast-source-file-comes-from-the-invocation-judgment-and-declaration-offsets-remain-source-derived';
  readonly invocationRule: 'producer-forwards-the-exact-source-correlated-invocation-judgment-and-its-integrated-response-without-reconstruction-or-reclassification';
  readonly methodEvidenceProjectionRule: 'producer-projects-method-AST-observations-and-precomputed-action-contracts-into-closed-controller-method-evidence-without-reclassifying-action-semantics';
  readonly responseAttributeProvenanceRule: 'declared-response-attribute-evidence-retains-the-exact-parser-token-span-and-never-substitutes-the-whole-method-span';
}

/** Upstream-owned contract consumed by the scanner-local implementation. */
export interface ControllerProducer {
  readonly kind: 'controller_producer';
  readonly contract: ControllerProducerContract;
  readonly produce: (input: ControllerProducerInput) => ControllerProducerResult;
  /** AST/evidence projection only: action and contract semantics are already supplied by their existing owners. */
  readonly projectMethodEvidence: (input: ControllerMethodEvidenceProjectionInput) => ControllerMethodEvidence;
}
