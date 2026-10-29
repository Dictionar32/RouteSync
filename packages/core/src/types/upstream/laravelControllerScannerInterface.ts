import type { ControllerStaticCallModelClassIdentity } from './controllerStaticCallOriginInterface';
import type { ControllerAst } from './ast';
import type { LaravelProjectDtoDeclarationInventoryInterface } from './laravelControllerResponseDtoDeclarationInterface';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { ControllerModelOrigin } from './controller';
import type { ActionName, ClassName, ControllerName, SourceFile } from './names';
import type { ResourceReference, ResponseReference } from './semanticReferences';
import type { SourceSpan } from './provenance';
import type { QueryAst } from './query';
import type { FormRequestSource } from '../domain/request';
import type { RouteSchemaPayload } from '../domain/validationRules';
import type { ControllerActionSchemaRouteRequestEvidence, RouteRequestSchemaEvidence } from './controllerActionSchemaSemanticJudgmentInterface';
import type { LaravelControllerAstProjectionResponseJudgment, LaravelControllerAstProjectionSemanticJudgment, LaravelControllerInvocationBlockedJudgment, LaravelControllerInvocationCompleteJudgment, LaravelControllerInvocationNotConnectedJudgment, LaravelControllerInvocationSemanticJudgmentInterface, LaravelControllerInvocationSourceBindingRejectedJudgment } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt } from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import type { ControllerDeclarationSemanticJudgmentAuthorityInterface } from './controllerDeclarationSemanticJudgmentInterface';
import type { ControllerDeclarationSelectionInventoryBlocker } from './controllerDeclarationSelectionInventoryClosureInterface';
import type { PhpClassConstructorSelectionAuthorityInterface } from './phpClassConstructorSelectionInterface';
import type { ControllerDeclarationSelectionInventoryClosureAuthorityInterface } from './controllerDeclarationSelectionInventoryClosureInterface';
import type { LaravelControllerResponseSemanticPipelineInterface } from './laravelControllerResponseSemanticJudgmentInterface';
import type { LaravelControllerActionSemanticJudgmentInterface, LaravelControllerActionProjectionMigration } from './laravelControllerActionSemanticJudgmentInterface';
import type { LaravelContextualAttributeInventory } from './laravelAttributeScannerInterface';
import type { ControllerDataflowAnalysisBlocked } from './controllerDataflowAnalysisOutcomeInterface';
import type { ControllerDataflowDefinitionPayloadMetadata } from './controllerDataflowBindingPayloadCorrespondenceInterface';
import type { EffectiveControllerActionPolicyCatalogJudgment } from './effectiveControllerActionPolicy';

/** Closed upstream contract for Laravel controller evidence and canonical ASTs. */
export interface LaravelControllerScannerInterface {
  readonly kind: 'laravel_controller_scanner';
  readonly closed: true;
  readonly contractVersion: 46;
  /** Existing response contracts are supplied as one explicit dependency bundle; the scanner does not own response semantics. */
  readonly responseSemanticPipeline: LaravelControllerResponseSemanticPipelineInterface;
  /** Existing upstream migration ADT exposes unresolved action-semantic ownership; scanner does not relabel it as completed. */
  readonly actionSemanticProjectionMigration: LaravelControllerActionProjectionMigration;
  /**
   * Controller declaration/action/ancestry decisions are delegated to the injected
   * closed upstream judgment authority. Its correspondence contract binds
   * each result as a source-bearing correspondence, so scanner consumers do not
   * zip parallel arrays or rediscover pairing through relations or path comparisons.
   */
  readonly declarationSemanticJudgmentAuthority: ControllerDeclarationSemanticJudgmentAuthorityInterface;
  /** Aggregate closure is upstream-owned; scanner runtime consumes its closed ADT rather than rechecking each selection. */
  readonly selectionInventoryClosureAuthority: ControllerDeclarationSelectionInventoryClosureAuthorityInterface;
  /** One upstream constructor-selection authority shared with attribute production; missing is consumer-interpreted, ambiguity blocks publication. */
  readonly constructorSelectionAuthority: PhpClassConstructorSelectionAuthorityInterface;
  /** The scanner receives closed upstream judgments; it never constructs invocation judgments. */
  /**
   * Declaration inventory closure is a publication gate: when any declaration
   * is blocked, no action scan, response judgment, or AST projection may execute.
   */
  readonly scan: (input: LaravelControllerScanInput) => Promise<LaravelControllerScanJudgment>;
}

export interface LaravelControllerScanInput {
  /** Source-backed request evidence consumed by controller action derivation. */
  readonly formRequests: readonly FormRequestSource[];
  /** Source-derived query facts consumed by controller dataflow derivation. */
  readonly queries: readonly QueryAst[];
  /** Closed source evidence for contextual attributes; the scanner must not infer this inventory from names. */
  readonly contextualAttributeInventory: LaravelContextualAttributeInventory;
  /** Canonical model-class identities from the same source-project scan. */
  readonly modelClasses: readonly ControllerStaticCallModelClassIdentity[];
  /**
   * Closed DTO discovery receipt from this same project. Controller scanning
   * cannot accept an unproven raw AST array as if it represented complete discovery.
   */
  readonly dtoDeclarationInventory: Extract<
    LaravelProjectDtoDeclarationInventoryInterface,
    { readonly kind: 'laravel_project_dto_declaration_inventory_complete' }
  >;
  /** Only an authority-validated total inventory can enter production scanning. */
  readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt;
}


/**
 * Exact canonical action judgment plus source-correlated route identity. Compiler projection
 * is a sibling product and is deliberately absent from this semantic publication.
 */
export interface ControllerActionJudgmentPublication {
  readonly kind: 'controller_action_judgment_publication';
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly sourceFile: import('./names').SourceFile;
  /** Exact method span from the canonical action judgment, not a controller-wide source approximation. */
  readonly source: SourceSpan;
  readonly judgment: LaravelControllerActionSemanticJudgmentInterface;
}

/** Route-side correlation is closed: a consumer cannot confuse no match with ambiguity. */
export type ControllerActionJudgmentRouteSelection =
  | Readonly<{ readonly kind: 'matched_action_judgment'; readonly publication: ControllerActionJudgmentPublication; readonly continueToRouteSchema: () => RouteSchemaPayload; readonly continueToRouteSchemaEvidence: () => RouteRequestSchemaEvidence<SourceFile> }>
  | Readonly<{ readonly kind: 'unmatched_action_judgment'; readonly continueToRouteSchema: () => RouteSchemaPayload; readonly continueToRouteSchemaEvidence: () => RouteRequestSchemaEvidence<SourceFile> }>
  | Readonly<{ readonly kind: 'ambiguous_action_judgments'; readonly first: ControllerActionJudgmentPublication; readonly second: ControllerActionJudgmentPublication; readonly remaining: readonly ControllerActionJudgmentPublication[]; readonly continueToRouteSchema: () => RouteSchemaPayload; readonly continueToRouteSchemaEvidence: () => RouteRequestSchemaEvidence<SourceFile> }>
  | Readonly<{ readonly kind: 'invalid_action_judgment_publication'; readonly publication: ControllerActionJudgmentPublication; readonly reason: 'publication_identity_mismatch' | 'source_span_mismatch'; readonly continueToRouteSchema: () => RouteSchemaPayload; readonly continueToRouteSchemaEvidence: () => RouteRequestSchemaEvidence<SourceFile> }>;

/** Shared AST/action/evidence products carried by one source-correlated judgment pair. */

type LaravelControllerIntegratedAstProjectionJudgment<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface,
  ResponseJudgment extends LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>,
> = Extract<
  LaravelControllerAstProjectionSemanticJudgment<InvocationJudgment>,
  { readonly kind: 'semantic_projection' }
> & Readonly<{
  /** Projection must retain the exact invocation subtype carried by its artifact. */
  readonly invocationJudgment: InvocationJudgment;
  /** Projection and artifact expose the same response-judgment type, not independent response unions. */
  readonly responseJudgment: ResponseJudgment;
}>;

/**
 * A controller artifact is only publishable as an integrated semantic product.
 * Syntax-only and invocation-only projection variants remain valid parser outputs,
 * but are not valid projections for an artifact that already carries both judgments.
 */
interface LaravelControllerScanArtifactBase<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface,
  ResponseJudgment extends LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>,
> {
  readonly kind: 'laravel_controller_scan_artifact';
  /** Canonical identity survives even when the declaration publishes no actions. */
  readonly identity: ControllerName;
  readonly ast: ControllerAst;
  readonly actions: readonly ControllerActionFlowContract[];
  /** Canonical controller-level policy inventory from declaration evidence, independent of action publication. */
  readonly policyInventory: readonly import('./controller').ControllerPolicyRelation[];
  /** Exact action judgments produced by the existing authority, correlated to controller/action/source. */
  readonly actionJudgments: readonly ControllerActionJudgmentPublication[];
  /** Source-correlated resource-return facts stay attached to their owning controller. */
  readonly resourceBindings: readonly ControllerResourceBindingEvidence[];
  /** Exact outcome-indexed invocation judgment supplied by upstream authority. */
  readonly invocationJudgment: InvocationJudgment;
  /** Response judgment for the same invocation subtype. */
  readonly responseJudgment: ResponseJudgment;
  /** Only integrated projection is admitted; its two judgments remain correlated with this artifact. */
  readonly projectionJudgment: LaravelControllerIntegratedAstProjectionJudgment<InvocationJudgment, ResponseJudgment>;
}

/**
 * Each artifact branch names one canonical invocation judgment explicitly.
 * This is a structural ADT declaration, not a conditional-type program that
 * computes the scanner's semantic outcomes. The upstream judgment owns the
 * outcome meaning; this contract only preserves the matching response/projection types.
 */
export type LaravelControllerScanArtifact =
  | LaravelControllerScanArtifactBase<
      LaravelControllerInvocationNotConnectedJudgment,
      LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationNotConnectedJudgment>
    >
  | LaravelControllerScanArtifactBase<
      LaravelControllerInvocationSourceBindingRejectedJudgment,
      LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationSourceBindingRejectedJudgment>
    >
  | LaravelControllerScanArtifactBase<
      LaravelControllerInvocationCompleteJudgment,
      LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationCompleteJudgment>
    >
  | LaravelControllerScanArtifactBase<
      LaravelControllerInvocationBlockedJudgment,
      LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationBlockedJudgment>
    >;

/**
 * Source-derived resource-return evidence retained by the controller scan.
 * It is not a resolved ResourceDefinition or a model-binding judgment; the
 * resource authority must still resolve the model against canonical model facts.
 */
export interface ControllerResourceBindingEvidence {
  readonly kind: 'controller_resource_binding_evidence';
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly resource: ResourceReference;
  readonly modelOrigin: ControllerModelOrigin;
  readonly response: ResponseReference;
  readonly source: SourceSpan;
}


/** Public compatibility name for the blocker ADT owned by the upstream closure authority. */
export type ControllerDeclarationSelectionBlocker = ControllerDeclarationSelectionInventoryBlocker | Readonly<{ readonly kind: 'controller_constructor_selection_ambiguous'; readonly controller: ControllerName; readonly candidates: readonly SourceSpan[] }> | Readonly<{ readonly kind: 'controller_constructor_selection_inventory_blocked'; readonly controller: ControllerName; readonly blockers: readonly SourceSpan[] }>;
/** Inventory-wide closure of controller declaration selection, owned by the existing declaration authority. */
export type ControllerDeclarationSelectionInventoryOutcome =
  | Readonly<{ readonly kind: 'controller_declaration_selection_inventory_complete' }>
  | Readonly<{ readonly kind: 'controller_declaration_selection_inventory_blocked'; readonly blockers: readonly ControllerDeclarationSelectionBlocker[] }>;

/**
 * Scanner publication is a closed ADT: a blocked declaration inventory cannot
 * publish even the artifacts produced for otherwise-resolved controllers.
 * This prevents downstream manifest construction from mistaking a partial
 * controller set for a complete source-project scan.
 */
/** A semantic body blocker keeps the original upstream outcome attached to its source method. */
export interface LaravelControllerSemanticBodyBlocker {
  readonly kind: 'laravel_controller_semantic_body_blocker';
  readonly controller: ControllerName;
  readonly action: ActionName;
  readonly sourceFile: SourceFile;
  readonly source: SourceSpan;
  readonly outcome: ControllerDataflowAnalysisBlocked<ControllerDataflowDefinitionPayloadMetadata>;
}

export type LaravelControllerScanCompleteJudgmentData = Readonly<{
  readonly kind: 'laravel_controller_scan_complete';
  readonly contractVersion: 46;
  readonly declarationSelection: Extract<ControllerDeclarationSelectionInventoryOutcome, { readonly kind: 'controller_declaration_selection_inventory_complete' }>;
  readonly sourceProject: SourceProjectIdentity;
  readonly controllers: readonly LaravelControllerScanArtifact[];
}>;

export type LaravelControllerScanBlockedJudgmentData =
  | Readonly<{
      readonly kind: 'laravel_controller_scan_blocked';
      readonly contractVersion: 46;
      readonly declarationSelection: Extract<ControllerDeclarationSelectionInventoryOutcome, { readonly kind: 'controller_declaration_selection_inventory_blocked' }>;
      readonly sourceProject: SourceProjectIdentity;
      readonly controllers: readonly [];
    }>
  | Readonly<{
      readonly kind: 'laravel_controller_scan_semantic_body_blocked';
      readonly contractVersion: 46;
      readonly sourceProject: SourceProjectIdentity;
      readonly blockers: readonly [LaravelControllerSemanticBodyBlocker, ...LaravelControllerSemanticBodyBlocker[]];
      readonly controllers: readonly [];
    }>;

export interface LaravelControllerScanContinuationHandlers<Result> {
  readonly onComplete: (judgment: LaravelControllerScanCompleteJudgment) => Result;
  readonly onBlocked: (judgment: LaravelControllerScanBlockedJudgment) => Result;
}

/** Route-policy continuation is a named domain operation, not a caller-owned kind test. */
export interface LaravelControllerScanRoutePolicyCatalogHandlers {
  readonly onComplete: (judgment: LaravelControllerScanCompleteJudgment) => EffectiveControllerActionPolicyCatalogJudgment;
  readonly onBlocked: (judgment: LaravelControllerScanBlockedJudgment) => EffectiveControllerActionPolicyCatalogJudgment;
}

/** Response projection is a scanner-owned continuation because only this ADT knows whether controller response artifacts are complete. */
export interface LaravelControllerScanResponseProjectionHandlers<Result> {
  readonly onComplete: (judgment: LaravelControllerScanCompleteJudgment) => Result;
  readonly onBlocked: (judgment: LaravelControllerScanBlockedJudgment) => Result;
}

export type LaravelControllerScanCompleteJudgment = LaravelControllerScanCompleteJudgmentData & Readonly<{
  readonly continueToSourceAstProjection: <Result>(handlers: LaravelControllerScanContinuationHandlers<Result>) => Result;
  readonly continueToRoutePolicyCatalog: (handlers: LaravelControllerScanRoutePolicyCatalogHandlers) => EffectiveControllerActionPolicyCatalogJudgment;
  readonly continueToResponseProjection: <Result>(handlers: LaravelControllerScanResponseProjectionHandlers<Result>) => Result;
}>;

export type LaravelControllerScanBlockedJudgment = LaravelControllerScanBlockedJudgmentData & Readonly<{
  readonly continueToSourceAstProjection: <Result>(handlers: LaravelControllerScanContinuationHandlers<Result>) => Result;
  readonly continueToRoutePolicyCatalog: (handlers: LaravelControllerScanRoutePolicyCatalogHandlers) => EffectiveControllerActionPolicyCatalogJudgment;
  readonly continueToResponseProjection: <Result>(handlers: LaravelControllerScanResponseProjectionHandlers<Result>) => Result;
}>;

export type LaravelControllerScanJudgment = LaravelControllerScanCompleteJudgment | LaravelControllerScanBlockedJudgment;

export interface LaravelControllerScanJudgmentOperationsInterface {
  readonly complete: (judgment: LaravelControllerScanCompleteJudgmentData) => LaravelControllerScanCompleteJudgment;
  readonly blocked: (judgment: LaravelControllerScanBlockedJudgmentData) => LaravelControllerScanBlockedJudgment;
}

/** Producer-side ADT constructors attach the follow-up operation to each exact judgment. */
export const laravelControllerScanJudgmentOperations: LaravelControllerScanJudgmentOperationsInterface = Object.freeze({
  complete: (judgment: LaravelControllerScanCompleteJudgmentData) => {
    let result: LaravelControllerScanCompleteJudgment;
    result = Object.freeze({
      ...judgment,
      continueToSourceAstProjection: <Result>(handlers: LaravelControllerScanContinuationHandlers<Result>): Result => handlers.onComplete(result),
      continueToRoutePolicyCatalog: (handlers: LaravelControllerScanRoutePolicyCatalogHandlers): EffectiveControllerActionPolicyCatalogJudgment => handlers.onComplete(result),
      continueToResponseProjection: <Result>(handlers: LaravelControllerScanResponseProjectionHandlers<Result>): Result => handlers.onComplete(result),
    });
    return result;
  },
  blocked: (judgment: LaravelControllerScanBlockedJudgmentData) => {
    let result: LaravelControllerScanBlockedJudgment;
    result = Object.freeze({
      ...judgment,
      continueToSourceAstProjection: <Result>(handlers: LaravelControllerScanContinuationHandlers<Result>): Result => handlers.onBlocked(result),
      continueToRoutePolicyCatalog: (handlers: LaravelControllerScanRoutePolicyCatalogHandlers): EffectiveControllerActionPolicyCatalogJudgment => handlers.onBlocked(result),
      continueToResponseProjection: <Result>(handlers: LaravelControllerScanResponseProjectionHandlers<Result>): Result => handlers.onBlocked(result),
    }) as LaravelControllerScanBlockedJudgment;
    return result;
  },
});

/** A traced structural parser caller and the projection contract it must satisfy. */
export type LaravelControllerStructuralParserCallSiteDisposition =
  | {
      readonly kind: 'structural_ast_consumer';
      readonly path: 'packages/core/src/compiler/scanner/laravelAttributeScanner.ts' | 'packages/core/src/compiler/scanner/operations/providerAstCanonical.ts';
      readonly semanticAuthority: 'not_an_invocation_semantic_authority';
      readonly migrationRequirement: 'use-the-explicit-syntax-only-projection-context-without-invocation-dataflow-analysis';
    }
  | {
      readonly kind: 'semantic_ast_consumer';
      readonly path: 'packages/core/src/compiler/scanner/operations/middlewareAstCanonical.ts' | 'packages/core/src/compiler/scanner/operations/responseScanner.ts';
      readonly semanticAuthority: 'canonical_invocation_judgment_required';
      readonly migrationRequirement: 'must-use-a-source-bound-judgment-context-and-must-not-claim-whole-file-invocation-coverage-while-the-source-pipeline-is-not-connected';
    }
  | {
      readonly kind: 'test_fixture';
      readonly path: 'packages/core/src/compiler/scanner/operations/controller/controllerMethodContract.phase894.test.ts' | 'packages/core/src/compiler/scanner/operations/controller/controllerInheritance.phase905.test.ts' | 'packages/core/src/compiler/scanner/operations/controller/controllerHasMiddleware.phase900.test.ts';
      readonly semanticAuthority: 'not_an_invocation_semantic_authority';
      readonly migrationRequirement: 'test-only-syntax-fixtures-must-not-be-counted-as-production-semantic-pipeline-coverage';
    }
  | {
      readonly kind: 'public_parser_facade';
      readonly path: 'packages/core/src/compiler/scanner/LaravelSourceLexer.ts';
      readonly semanticAuthority: 'not_an_invocation_semantic_authority';
      readonly migrationRequirement: 'expose-the-discriminated-projection-context-and-never-accept-independent-filePath-and-integratedResponse';
    };

/**
 * Ownership boundary between Laravel controller scanning and invocation semantics.
 * The scanner produces correlated source artifacts; it does not derive invocation
 * targets, argument bindings, effect flows, proof, or closure.
 */
export interface LaravelControllerInvocationSemanticBoundaryContract {
  readonly kind: 'laravel_controller_invocation_semantic_boundary_contract';
  readonly version: 109;
  readonly scannerOutput: 'controller-ast-action-contracts-resource-return-evidence-and-source-correlated-invocation-semantic-judgment-remain-one-artifact';
  readonly downstreamConsumerBoundary: 'route-and-resource-scanners-consume-the-whole-correlated-controller-scan-judgment-not-detached-action-arrays-or-legacy-controller-indexes';
  readonly sourceProjectBinding: 'downstream-source-project-is-owned-by-the-controller-scan-judgment-from-the-closed-inventory-and-cannot-be-supplied-independently';
  readonly pipelineEntryBoundary: 'source-ast-pipeline-and-manifest-builder-accept-only-the-authority-closed-inventory-receipt-and-derive-project-identity-from-that-receipt';
  readonly judgmentInputBoundary: 'scanner-receives-only-upstream-closed-invocation-judgments-and-never-constructs-judgments-from-raw-pipeline-evidence';
  readonly sourceCorrelatedJudgmentInventoryBoundary: 'scanner-accepts-only-the-authority-bound-closure-receipt-and-never-reconstructs-source-judgment-correspondence';
  readonly rawJudgmentArrayBoundary: 'never-accepts-an-unvalidated-judgment-array';
  readonly judgmentArtifactBoundary: 'each-controller-artifact-retains-one-canonical-judgment-containing-source-identity-and-the-exact-PHP-source-invocation-outcome;knowledge-bound-publication-composition-is-a-distinct-aggregate';
  readonly productionInterfaceGate: 'production-implementation-must-conform-to-this-contract-before-wiring-migration-and-subscanner-retirement';
  readonly completeInventoryGate: 'inventory-authority-requires-complete-source-discovery-exactly-one-judgment-per-controller-source-no-extra-judgments-and-explicit-not-connected-outcomes-before-scanning';
  readonly inventoryReceiptBoundary: 'scanner-receives-the-authority-produced-closure-receipt-not-a-self-asserted-valid-result-or-parallel-source-and-judgment-arrays';
  readonly semanticOwner: 'canonical-invocation-semantic-pipeline';
  readonly subjectForms: 'ordinary-and-static-invocation-preserve-distinct-source-identities';
  readonly forbiddenScannerResponsibilities: readonly [
    'invocation-target-resolution',
    'argument-binding',
    'effect-projection',
    'proof-synthesis',
    'judgment-closure',
    'semantic-fallback-or-reclassification',
  ];
  readonly migrationGate: 'full-static-invocation-coverage-requires-static-target-binding-effect-judgment-algebra-and-authority-to-be-implemented-and-validated';
  readonly integratedResponseCompositionMigrationGate: 'ordinary-invocation-integrated-response-composition-is-wired-through-the-upstream-interface-static-invocation-remains-uncovered-until-its-own-algebra-and-authorities-are-implemented';
  readonly proofBoundary: 'scanner-forwards-the-authority-validated-obligation-ledger-and-never-reconstructs-or-reconciles-proof-obligations';
  readonly validationBoundary: 'scanner-consumes-only-authority-validated-static-judgments-and-never-validates-or-repairs-proof-itself';
  readonly obligationOwnership: 'rule-obligation-contract-is-upstream-authority-owned-and-scanner-preserves-the-ledger-without-reclassification';
  readonly scannerRuntime: 'source-artifact-collection-only-no-semantic-judgment-construction';
  readonly staticTargetModelBoundary: 'controller-scanner-provides-source-facts-only-and-never-resolves-class-operation-candidates';
  readonly staticAlgebraBoundary: 'scanner-delegates-static-invocation-derivation-to-the-upstream-static-algebra-interface-and-never-implements-or-inlines-derivation';
  readonly staticRuleStageBoundary: 'scanner-does-not-implement-target-resolution-binding-effect-projection-or-proof-assembly-and-forwards-context-bound-stage-judgments-without-detaching-or-reconstructing-the-source-context';
  readonly staticStageOwnership: 'domain-specific-stage-judgments-are-owned-upstream-and-scanner-only-forwards-the-final-authority-validated-judgment';
  readonly coverageDisclosure: 'current-controller-dataflow-publishes-ordinary-invocation-judgments-only-and-must-not-imply-static-invocation-coverage';
  readonly coveragePublicationBoundary: 'scanner-forwards-only-a-validated-inventory-bound-publication-or-preserves-the-typed-rejection-ledger-without-repair';
  readonly publicationValidationReceipt: 'scanner-preserves-entry-by-entry-inventory-publication-correspondence-and-does-not-reconstruct-or-assert-validation';
  readonly publicationReceiptContractBinding: 'scanner-forwards-the-exact-coverage-contract-and-publication-authority-boundary-carried-by-the-validated-receipt-without-reconstruction';
  readonly publicationCorrespondenceFormAlignment: 'scanner-preserves-the-typed-ordinary-versus-static-correspondence-pairing-and-does-not-repair-cross-form-mismatches';
  readonly publicationAuthorityOwnership: 'scanner-consumes-only-publication-authority-validated-receipts-and-preserves-non-empty-typed-rejection-ledgers-without-semantic-repair';
  readonly integratedSemanticResponseOwnership: 'scanner-forwards-the-publication-result-directly-without-wrapping-or-reclassifying-its-discriminator';
  readonly integratedSemanticResponseRuntimeStatus: 'controller-dataflow-retains-the-publication-result-and-consumers-read-analysis-from-its-own-discriminated-variant';
  readonly integratedResponseCompositionBoundary: 'scanner-consumes-only-integrate-and-cannot-bypass-private-component-authorities-when-production-wiring-is-enabled';
  readonly integratedResponseCompositionSourceBinding: 'scanner-preserves-the-composition-result-source-knowledge-and-exact-publication-result-without-reconstruction';
  readonly integratedResponseCompositionDependencyBoundary: 'scanner-receives-only-the-composition-interface-and-never-injects-or-calls-component-authorities-directly';
  readonly canonicalCoverageEntryOwnership: 'subject-form-id-and-source-evidence-remain-canonical-on-the-subject-and-are-not-duplicated-as-entry-fields';
  readonly correspondenceIdentityOwnership: 'scanner-forwards-correspondence-receipts-without-synthesizing-identity-and-preserves-upstream-validation-outcome';
  readonly invocationJudgmentDelegation: 'scanner-forwards-source-derived-knowledge-to-the-canonical-pipeline-and-preserves-the-authority-validated-analysis-without-reconstruction';
  readonly invocationJudgmentSubjectBinding: 'each-returned-judgment-trace-witness-and-obligation-remains-bound-to-its-requested-source-invocation';
  readonly canonicalInvocationJudgmentModel: 'scanner-input-and-artifact-use-the-single-canonical-LaravelControllerInvocationSemanticJudgmentInterface-with-no-parallel-versioned-judgment-model';
  readonly integratedResponseProvenanceOwnership: 'scanner-preserves-the-exact-PHP-source-invocation-outcome-nested-in-the-canonical-judgment;knowledge-bound-publication-composition-retains-that-same-outcome-as-phpFunctionInvocations-without-claiming-response-type-identity';
  readonly sourceIdentityOwnership: 'judgment.sourceFile-remains-the-canonical-controller-source-identity-for-inventory-and-source-loading-while-nested-identity-judgments-remain-provenance-evidence-not-alternate-subject-fields';
  readonly canonicalSubjectProvenanceBoundary: 'judgment.sourceFile-is-the-single-inventory-subject-key;complete-and-blocked-responses-retain-the-proof-at-response.sourceBinding.identityJudgment;rejected-responses-retain-the-proof-at-response.judgment.identityJudgment;not-connected-retains-its-explicit-evidence-without-inventing-a-binding-proof;the-subject-key-does-not-replace-or-reconstruct-the-proof';
  readonly semanticAuthorityFailure: 'scanner-propagates-upstream-authority-rejection-without-semantic-fallback-reclassification-or-repair';
  readonly wholeFileInvocationInputBoundary: 'controller-scanner-composition-must-bind-each-controller-source-file-to-one-frontend-produced-whole-file-php-invocation-pipeline-result-before-method-body-projection';
  readonly sourceIdentityBinding: 'source-file-identity-must-be-validated-between-controller-document-frontend-extraction-and-pipeline-result-before-integrated-response-publication';
  readonly sourceBindingJudgmentAuthority: 'source-identity-binding-is-an-upstream-closed-judgment-and-a-mismatch-remains-a-distinct-integrated-response-rejection';
  readonly pipelineOutcomePreservation: 'complete-blocked-and-not-connected-pipeline-outcomes-remain-distinct-through-integrated-response-and-controller-dataflow';
  readonly runtimeReductionTarget: 'retire-controller-subscanner-after-upstream-interface-owns-source-artifacts-and-integrated-invocation-response';
  readonly pipelineInjectionBoundary: 'raw-whole-file-pipeline-results-stop-at-the-upstream-judgment-authority-and-only-a-validated-total-correlated-inventory-crosses-the-controller-scanner-boundary';
  readonly fallbackSemantics: 'not-connected-is-materialized-upstream-as-a-distinct-integrated-judgment-and-scanner-never-invents-a-fallback';
  readonly staticInvocationImplementationStatus: 'static-invocation-algebra-authority-and-coverage-publication-remain-unimplemented-ordinary-invocation-composition-is-wired';
  readonly retirementBoundary: 'ControllerScanner-subscanner-is-retired-after-canonical-LaravelControllerScannerInterface-owns-correlated-source-artifacts-and-no-production-consumer-imports-the-duplicate-entry';
  readonly integratedResponseProjectionBoundary: 'canonical-controller-parser-receives-the-whole-source-correlated-judgment-and-projects-its-integrated-response-only-after-source-identity-is-fixed';
  readonly parserIntegratedResponseBoundary: 'canonical-parser-entry-accepts-one-source-correlated-judgment-not-independent-source-path-and-integrated-response-arguments';
  readonly independentArgumentParserEntryBoundary: 'parseControllerDeclaration-accepts-one-discriminated-projection-context; syntax-only-has-no-semantic-dataflow-and-semantic-projection-accepts-the-canonical-judgment';
  readonly canonicalParserEntryOwnership: 'parseControllerDeclarationFromInvocationJudgment-is-the-only-production-parser-boundary-and-must-preserve-the-judgment-as-the-source-of-both-subject-identity-and-integrated-response;AST-projection-and-PHP-class-name-resolution-are-derived-from-the-same-injected-response-pipeline-dependencies';
  readonly parserMigrationGate: 'parser-projection-context-is-a-closed-discriminated-union; syntax-only-consumers-do-not-run-dataflow-analysis-and-semantic-consumers-must-supply-the-canonical-invocation-judgment';
  readonly parserEntryOwnership: 'production-controller-scan-uses-parseControllerDeclarationFromInvocationJudgment-with-one-canonical-judgment; structural-consumers-use-syntax-only-projection-without-inventing-not-connected-semantic-response';
  readonly structuralParserSemanticLeakBoundary: 'syntax-only-projection-produces-body-syntax-evidence-without-semantic-dataflow; invocation-semantic-projection-requires-the-canonical-judgment-and-derives-source-identity-and-integrated-response-from-that-same-value';
  readonly structuralProjectionRetirementGate: 'structural-consumers-use-the-explicit-syntax-only-context-and-the-AST-type-marks-dataflow-as-absent; semantic-consumers-use-the-canonical-judgment-context';
  readonly dataflowProjectionInputOwnership: 'controller-dataflow-executor-receives-the-canonical-invocation-judgment-as-one-value-and-derives-source-identity-and-integrated-response-from-that-same-judgment';
  readonly dataflowJudgmentRetention: 'controller-dataflow-ast-retains-the-exact-canonical-invocation-judgment-alongside-integrated-response-projection-so-source-and-response-provenance-remain-a-single-traceable-authority-value';
  readonly controllerDataflowSemanticOwnership: 'canonical-upstream-contracts-must-own-knowledge-production-binding-correlation-origin-normalization-and-variable-semantic-judgment-before-scanner-runtime-can-be-reduced-to-wiring;per-binding-output-must-retain-correspondence-and-identity-as-one-closed-judgment';
  readonly semanticKnowledgeEvidenceProducerOwnership: 'SemanticKnowledgeEvidenceAdapter-contract-is-upstream-owned;PHP-specific-provider-provenance-is-owned-by-the-PHP-evidence-projector-not-the-controller-analyzer';
  readonly controllerDataflowSemanticModelOwnership: 'the-existing-ControllerDataflowInvocationSemanticModelInterface-owns-knowledge-projection-provenance-canonical-invocation-judgment-integrated-response-and-correlated-per-binding-judgments';
  readonly controllerDataflowConsumerClosure: 'controllerAstCanonical-consumes-only-authority-closed-payloadJudgments;controllerDataflowContract-consumes-canonical-semanticVariables-for-resource-binding-through-controllerResourceBindingAuthority;no-production-consumer-selects-bindingJudgments-or-rebuilds-integrated-response';
  readonly controllerDataflowAstAdtProjection: 'AST-expression-projection-exhaustively-consumes-resolved-unresolved-and-ambiguous-payload-judgments;ambiguity-remains-a-distinct-unresolved-SemanticValue-variant;only-resolved-judgments-supply-the-canonical-sourceExpression';
  readonly controllerBodyProjectionAdt: 'ControllerBodyAst-is-a-closed-discriminated-union;controller_body_syntax_only-has-dataflow-undefined;controller_body_semantic-retains-the-canonical-ControllerDataflowAst-and-integrated-response;absence-of-semantic-analysis-is-not-reclassified-as-not-connected-or-unresolved';
  readonly controllerBodyInvocationOutcome: 'controller_body_semantic-signals-dataflow-judgment-presence-only-not-invocation-completion;complete-blocked-source-binding-rejected-and-not-connected-remain-the-exact-upstream-discriminated-outcomes-in-the-retained-judgment-and-integrated-response';
  readonly controllerDataflowRuntimeReductionGate: 'controllerDataflowAnalyzer-only-collects-source-correlated-knowledge-and-PHP-payload-evidence-then-calls-one-closed-upstream-ControllerDataflowSemanticJudgmentAuthority;binding-closure-and-variable-flow-composition-are-authority-owned;PHP-expression-definition-projection-remains-an-explicit-source-adapter';
  readonly controllerDataflowVariableIdentityBoundary: 'variable-name identity is resolved from canonical semantic variable facts by an upstream closed judgment; missing or ambiguous identity is retained and never replaced with an opaque knowledge slot';
  readonly controllerDataflowIntegratedResponseOwnership: 'canonical-judgment-owns-source-identity-and-exact-PHP-invocation-outcome;semanticKnowledgeProjection.knowledge-is-the-single-canonical-knowledge-field;upstream-composition-builds-the-publication-aggregate-and-preserves-judgment.response-as-phpFunctionInvocations-without-reclassification-or-republishing-knowledge';
  readonly controllerDataflowSemanticJudgmentPublication: 'the-closed-upstream-bindingJudgments-retain-the-exact-matched-PHP-AST-payload-reference-and-its-definition-semanticResolution;scanner-consumes-the-authority-closed-per-payload-semantic-judgment-by-payload-identity-and-reuses-its-canonical-sourceExpression;duplicate-resolved-bindings-are-published-as-ambiguity-not-first-match-selected;scanner-does-not-rematch-source-spans-or-reclassify-semantic-meaning';
  readonly controllerDataflowKnowledgeIdentityBoundary: 'semanticKnowledgeProjection-is-the-canonical-source-correlated-knowledge-owner;integrated-response-composition-consumes-the-complete-projection-and-returns-response-only-without-republishing-knowledge-or-provenance';
  readonly structuralParserCallSiteDisposition: 'attribute-and-provider-consumers-use-syntax-only-projection; middleware-and-response consumers need an explicit source-bound semantic judgment';
  readonly structuralParserCallSiteInventory: readonly LaravelControllerStructuralParserCallSiteDisposition[];
  readonly judgmentToAstProjectionBoundary: 'semantic-parser-context-carries-one-canonical-judgment-and-derives-sourceFile-and-exact-integrated-response-from-it; independent-semantic-input-arguments-are-not-accepted';
  readonly structuralParserProjectionGate: 'structural-consumers-are-explicitly-syntax-only-and-cannot-trigger-invocation-dataflow-analysis';
  readonly controllerProducerOwnershipBoundary: 'controller-producer-contract-is-upstream-owned-and-the-implementation-projects-declaration-evidence-while-preserving-the-source-correlated-invocation-judgment-without-reclassification';
  readonly producerInvocationJudgmentBinding: 'controller-producer-accepts-the-source-correlated-invocation-judgment-as-one-value-derives-ast-source-file-from-it-and-forwards-the-exact-judgment-to-the-controller-artifact';
  readonly subscannerDirectoryRealityBoundary: 'retiring-the-duplicate-ControllerScanner-entry-and-emptying-actionVariableTracker-and-controllerErrorDetector-does-not-imply-the-controller-subscanner-directory-is-empty-remaining-nonempty-modules-require-individual-consumer-trace-and-upstream-ownership-migration';
  readonly controllerDataflowSourcePayloadEvidenceBoundary: 'controllerDataflowAnalyzer-requests-source-payload-evidence-from-the-injected-parser-specific-adapter-using-the-canonical-judgment-source-file';
  readonly controllerDataflowSourcePayloadAdapterOwnership: 'source-adapter-only-traverses-PHP-AST-and-emits-typed-source-span-payloads;it-does-not-correlate-bindings-or-classify-semantic-origin';
  readonly controllerDataflowSemanticStageInventory: 'controllerDataflowAnalyzer-collects-source-correlated-knowledge-and-parser-payload-evidence-then-forwards-one-evidence-input-to-ControllerDataflowSemanticJudgmentAuthorityInterface;authority-owns-binding-correspondence-identity-closure-variable-flow-composition-and-integrated-response;injected-PHP-definition-projection-adapter-uses-the-existing-runtime-executor';
  readonly controllerDataflowSemanticResolutionInputAdapterBoundary: 'PHP-AST-expression-and-typed-parameter-semantics-are-adapted-to-the-canonical-ControllerVariableSemanticResolutionRequest-by-an-injected-source-adapter;semantic-rule-selection-and-judgment-remain-upstream-owned';
  readonly controllerDataflowSemanticResolutionJudgmentBoundary: 'each-ControllerVariableDefinition-retains-the-exact-closed-ControllerVariableSemanticJudgment-returned-by-the-existing-upstream-executor;the-judgment-also-retains-the-exact-canonical-Expression-projected-from-the-same-matched-payload-that-generated-its-syntax-neutral-evidence;duplicate-matching-parameter-bindings-remain-an-explicit-ambiguous-ADT-outcome;the-source-projected-Expression-and-judgment-expressionValue-remain-distinct-domain-representations-and-are-never-reconstructed-or-reclassified';
  readonly controllerDataflowKnowledgeEvidenceAdapterBoundary: 'controller-dataflow-analyzer-consumes-the-upstream-SemanticKnowledgeEvidenceAdapter-contract;PHP-AST-evidence-projector-is-injected-at-the-composition-root;analyzer-does-not-select-evidence-provider-provenance-or-import-a-concrete-knowledge-producer';
  readonly controllerDataflowKnowledgeEvidenceAdapterPropagationBoundary: 'the-injected-SemanticKnowledgeEvidenceAdapter-receives-one-typed-source-correlated-projection-input;it-is-not-forwarded-to-variable-definition-projection-which-does-not-consume-it';
  readonly controllerDataflowKnowledgeEvidenceProjectionBoundary: 'projection-input-binds-PHP-evidence-to-canonical-SourceFile;the-PHP-projector-owns-parser-provenance-and-returns-it-with-canonical-SemanticKnowledgeDataFlow';
  readonly controllerDataflowVariableFlowCompositionBoundary: 'canonical-variable-flow-grouping-is-owned-by-ControllerSemanticVariableFlowCompositionAuthorityInterface-using-typed-VariableName-identity-and-retaining-definition-order-and-evidence;definition-expression-is-owned-only-by-the-closed-semanticResolution-judgment';
  readonly controllerDataflowEvidenceContractGate: 'binding-to-statement-correspondence-and-origin-normalization-are-upstream-judged;source-payload-traversal-is-owned-by-the-injected-parser-specific-evidence-adapter;expression-projection-delegates-through-PhpAstExpressionSemanticAuthorityInterface';
  readonly controllerDataflowBindingPayloadJudgmentBoundary: 'a binding is semantically resolvable only when a typed correspondence judgment identifies its source payload; missing or ambiguous correspondence must remain an explicit typed outcome and must not be silently converted into an unsupported-expression payload';
  readonly controllerDataflowProjectionOwnership: 'the source adapter supplies PHP AST payload evidence; upstream correspondence authority judges canonical source identity, span, and canonical variable origin; PHP-to-upstream expression projection delegates through PhpAstExpressionSemanticAuthorityInterface';
  readonly controllerDataflowOriginJudgmentClosure: 'matched binding-payload correspondence carries canonical ControllerVariableOrigin; scanner does not reclassify semantic origin codes';
  readonly controllerDataflowCorrespondenceOutcomeShape: 'each binding retains exactly one matched-missing-or-ambiguous correspondence judgment; definitions are projected only from matched payload evidence';
  readonly controllerDataflowCorrespondenceAuthorityBoundary: 'analyzer delegates exact source-file-and-span matching and canonical origin judgment to ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface and forwards the returned closed judgment without reconstruction';
  readonly controllerDataflowExpressionProjectionAuthorityBoundary: 'matched PHP expression evidence is projected through the existing PhpAstExpressionSemanticAuthorityInterface; analyzer does not directly call the concrete PHP-to-upstream mapper';
  readonly controllerDataflowParameterEvidenceBoundary: 'controller dataflow receives typed parameter semantic bindings only; raw parameter identifier lists are not passed as a second unused authority input';
  readonly controllerDataflowJudgmentCompositionInvariant: 'canonical invocation judgment and integrated response composition remain distinct typed values; composition consumes the exact knowledge input and preserves the exact judgment response without publishing a duplicate knowledge value or asserting response-type identity';
  readonly controllerDataflowSourceCorrelation: 'one-source-correlation-value-crosses-the-authority-boundary-and-upstream-validates-canonical-sourceFile-against-invocation-judgment-knowledge-projection-and-every-payload-source-span-using-existing-typed-source-file-identity-semantics';
  readonly controllerDataflowDefinitionProjectionSourceBinding: 'definition-projection-no-longer-accepts-a-second-invocation-judgment-source-channel;it-uses-the-exact-matched-payload-source-file-after-upstream-correlation-validation;upstream-validates-the-projected-definition-source-file-before-variable-flow-publication;scanner-remains-evidence-collection-and-wiring-only';
}

export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT: LaravelControllerInvocationSemanticBoundaryContract = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_boundary_contract',
  version: 109,
  scannerOutput: 'controller-ast-action-contracts-resource-return-evidence-and-source-correlated-invocation-semantic-judgment-remain-one-artifact',
  downstreamConsumerBoundary: 'route-and-resource-scanners-consume-the-whole-correlated-controller-scan-judgment-not-detached-action-arrays-or-legacy-controller-indexes',
  sourceProjectBinding: 'downstream-source-project-is-owned-by-the-controller-scan-judgment-from-the-closed-inventory-and-cannot-be-supplied-independently',
  pipelineEntryBoundary: 'source-ast-pipeline-and-manifest-builder-accept-only-the-authority-closed-inventory-receipt-and-derive-project-identity-from-that-receipt',
  judgmentInputBoundary: 'scanner-receives-only-upstream-closed-invocation-judgments-and-never-constructs-judgments-from-raw-pipeline-evidence',
  sourceCorrelatedJudgmentInventoryBoundary: 'scanner-accepts-only-the-authority-bound-closure-receipt-and-never-reconstructs-source-judgment-correspondence',
  rawJudgmentArrayBoundary: 'never-accepts-an-unvalidated-judgment-array',
  judgmentArtifactBoundary: 'each-controller-artifact-retains-one-canonical-judgment-containing-source-identity-and-the-exact-PHP-source-invocation-outcome;knowledge-bound-publication-composition-is-a-distinct-aggregate',
  productionInterfaceGate: 'production-implementation-must-conform-to-this-contract-before-wiring-migration-and-subscanner-retirement',
  completeInventoryGate: 'inventory-authority-requires-complete-source-discovery-exactly-one-judgment-per-controller-source-no-extra-judgments-and-explicit-not-connected-outcomes-before-scanning',
  inventoryReceiptBoundary: 'scanner-receives-the-authority-produced-closure-receipt-not-a-self-asserted-valid-result-or-parallel-source-and-judgment-arrays',
  semanticOwner: 'canonical-invocation-semantic-pipeline',
  subjectForms: 'ordinary-and-static-invocation-preserve-distinct-source-identities',
  forbiddenScannerResponsibilities: Object.freeze([
    'invocation-target-resolution',
    'argument-binding',
    'effect-projection',
    'proof-synthesis',
    'judgment-closure',
    'semantic-fallback-or-reclassification',
  ] as const),
  migrationGate: 'full-static-invocation-coverage-requires-static-target-binding-effect-judgment-algebra-and-authority-to-be-implemented-and-validated',
  integratedResponseCompositionMigrationGate: 'ordinary-invocation-integrated-response-composition-is-wired-through-the-upstream-interface-static-invocation-remains-uncovered-until-its-own-algebra-and-authorities-are-implemented',
  proofBoundary: 'scanner-forwards-the-authority-validated-obligation-ledger-and-never-reconstructs-or-reconciles-proof-obligations',
  validationBoundary: 'scanner-consumes-only-authority-validated-static-judgments-and-never-validates-or-repairs-proof-itself',
  obligationOwnership: 'rule-obligation-contract-is-upstream-authority-owned-and-scanner-preserves-the-ledger-without-reclassification',
  scannerRuntime: 'source-artifact-collection-only-no-semantic-judgment-construction',
  staticTargetModelBoundary: 'controller-scanner-provides-source-facts-only-and-never-resolves-class-operation-candidates',
  staticAlgebraBoundary: 'scanner-delegates-static-invocation-derivation-to-the-upstream-static-algebra-interface-and-never-implements-or-inlines-derivation',
  staticRuleStageBoundary: 'scanner-does-not-implement-target-resolution-binding-effect-projection-or-proof-assembly-and-forwards-context-bound-stage-judgments-without-detaching-or-reconstructing-the-source-context',
  staticStageOwnership: 'domain-specific-stage-judgments-are-owned-upstream-and-scanner-only-forwards-the-final-authority-validated-judgment',
  coverageDisclosure: 'current-controller-dataflow-publishes-ordinary-invocation-judgments-only-and-must-not-imply-static-invocation-coverage',
  coveragePublicationBoundary: 'scanner-forwards-only-a-validated-inventory-bound-publication-or-preserves-the-typed-rejection-ledger-without-repair',
  publicationValidationReceipt: 'scanner-preserves-entry-by-entry-inventory-publication-correspondence-and-does-not-reconstruct-or-assert-validation',
  publicationReceiptContractBinding: 'scanner-forwards-the-exact-coverage-contract-and-publication-authority-boundary-carried-by-the-validated-receipt-without-reconstruction',
  publicationCorrespondenceFormAlignment: 'scanner-preserves-the-typed-ordinary-versus-static-correspondence-pairing-and-does-not-repair-cross-form-mismatches',
  publicationAuthorityOwnership: 'scanner-consumes-only-publication-authority-validated-receipts-and-preserves-non-empty-typed-rejection-ledgers-without-semantic-repair',
  integratedSemanticResponseOwnership: 'scanner-forwards-the-publication-result-directly-without-wrapping-or-reclassifying-its-discriminator',
  integratedSemanticResponseRuntimeStatus: 'controller-dataflow-retains-the-publication-result-and-consumers-read-analysis-from-its-own-discriminated-variant',
  integratedResponseCompositionBoundary: 'scanner-consumes-only-integrate-and-cannot-bypass-private-component-authorities-when-production-wiring-is-enabled',
  integratedResponseCompositionSourceBinding: 'scanner-preserves-the-composition-result-source-knowledge-and-exact-publication-result-without-reconstruction',
  integratedResponseCompositionDependencyBoundary: 'scanner-receives-only-the-composition-interface-and-never-injects-or-calls-component-authorities-directly',
  canonicalCoverageEntryOwnership: 'subject-form-id-and-source-evidence-remain-canonical-on-the-subject-and-are-not-duplicated-as-entry-fields',
  correspondenceIdentityOwnership: 'scanner-forwards-correspondence-receipts-without-synthesizing-identity-and-preserves-upstream-validation-outcome',
  invocationJudgmentDelegation: 'scanner-forwards-source-derived-knowledge-to-the-canonical-pipeline-and-preserves-the-authority-validated-analysis-without-reconstruction',
  invocationJudgmentSubjectBinding: 'each-returned-judgment-trace-witness-and-obligation-remains-bound-to-its-requested-source-invocation',
  canonicalInvocationJudgmentModel: 'scanner-input-and-artifact-use-the-single-canonical-LaravelControllerInvocationSemanticJudgmentInterface-with-no-parallel-versioned-judgment-model',
  integratedResponseProvenanceOwnership: 'scanner-preserves-the-exact-PHP-source-invocation-outcome-nested-in-the-canonical-judgment;knowledge-bound-publication-composition-retains-that-same-outcome-as-phpFunctionInvocations-without-claiming-response-type-identity',
  sourceIdentityOwnership: 'judgment.sourceFile-remains-the-canonical-controller-source-identity-for-inventory-and-source-loading-while-nested-identity-judgments-remain-provenance-evidence-not-alternate-subject-fields',
  canonicalSubjectProvenanceBoundary: 'judgment.sourceFile-is-the-single-inventory-subject-key;complete-and-blocked-responses-retain-the-proof-at-response.sourceBinding.identityJudgment;rejected-responses-retain-the-proof-at-response.judgment.identityJudgment;not-connected-retains-its-explicit-evidence-without-inventing-a-binding-proof;the-subject-key-does-not-replace-or-reconstruct-the-proof',
  semanticAuthorityFailure: 'scanner-propagates-upstream-authority-rejection-without-semantic-fallback-reclassification-or-repair',
  wholeFileInvocationInputBoundary: 'controller-scanner-composition-must-bind-each-controller-source-file-to-one-frontend-produced-whole-file-php-invocation-pipeline-result-before-method-body-projection',
  sourceIdentityBinding: 'source-file-identity-must-be-validated-between-controller-document-frontend-extraction-and-pipeline-result-before-integrated-response-publication',
  pipelineOutcomePreservation: 'complete-blocked-and-not-connected-pipeline-outcomes-remain-distinct-through-integrated-response-and-controller-dataflow',
  staticInvocationImplementationStatus: 'static-invocation-algebra-authority-and-coverage-publication-remain-unimplemented-ordinary-invocation-composition-is-wired',
  retirementBoundary: 'ControllerScanner-subscanner-is-retired-after-canonical-LaravelControllerScannerInterface-owns-correlated-source-artifacts-and-no-production-consumer-imports-the-duplicate-entry',
  integratedResponseProjectionBoundary: 'canonical-controller-parser-receives-the-whole-source-correlated-judgment-and-projects-its-integrated-response-only-after-source-identity-is-fixed',
  parserIntegratedResponseBoundary: 'canonical-parser-entry-accepts-one-source-correlated-judgment-not-independent-source-path-and-integrated-response-arguments',
  independentArgumentParserEntryBoundary: 'parseControllerDeclaration-accepts-one-discriminated-projection-context; syntax-only-has-no-semantic-dataflow-and-semantic-projection-accepts-the-canonical-judgment',
  canonicalParserEntryOwnership: 'parseControllerDeclarationFromInvocationJudgment-is-the-only-production-parser-boundary-and-must-preserve-the-judgment-as-the-source-of-both-subject-identity-and-integrated-response;AST-projection-and-PHP-class-name-resolution-are-derived-from-the-same-injected-response-pipeline-dependencies',
  parserMigrationGate: 'parser-projection-context-is-a-closed-discriminated-union; syntax-only-consumers-do-not-run-dataflow-analysis-and-semantic-consumers-must-supply-the-canonical-invocation-judgment',
  parserEntryOwnership: 'production-controller-scan-uses-parseControllerDeclarationFromInvocationJudgment-with-one-canonical-judgment; structural-consumers-use-syntax-only-projection-without-inventing-not-connected-semantic-response',
  structuralParserSemanticLeakBoundary: 'syntax-only-projection-produces-body-syntax-evidence-without-semantic-dataflow; invocation-semantic-projection-requires-the-canonical-judgment-and-derives-source-identity-and-integrated-response-from-that-same-value',
  structuralProjectionRetirementGate: 'structural-consumers-use-the-explicit-syntax-only-context-and-the-AST-type-marks-dataflow-as-absent; semantic-consumers-use-the-canonical-judgment-context',
  dataflowProjectionInputOwnership: 'controller-dataflow-executor-receives-the-canonical-invocation-judgment-as-one-value-and-derives-source-identity-and-integrated-response-from-that-same-judgment',
  dataflowJudgmentRetention: 'controller-dataflow-ast-retains-the-exact-canonical-invocation-judgment-alongside-integrated-response-projection-so-source-and-response-provenance-remain-a-single-traceable-authority-value',
  controllerDataflowSemanticOwnership: 'canonical-upstream-contracts-must-own-knowledge-production-binding-correlation-origin-normalization-and-variable-semantic-judgment-before-scanner-runtime-can-be-reduced-to-wiring;per-binding-output-must-retain-correspondence-and-identity-as-one-closed-judgment',
  semanticKnowledgeEvidenceProducerOwnership: 'SemanticKnowledgeEvidenceAdapter-contract-is-upstream-owned;PHP-specific-provider-provenance-is-owned-by-the-PHP-evidence-projector-not-the-controller-analyzer',
  controllerDataflowSemanticModelOwnership: 'the-existing-ControllerDataflowInvocationSemanticModelInterface-owns-knowledge-projection-provenance-canonical-invocation-judgment-integrated-response-and-correlated-per-binding-judgments',
  controllerDataflowConsumerClosure: 'controllerAstCanonical-consumes-only-authority-closed-payloadJudgments;controllerDataflowContract-consumes-canonical-semanticVariables-for-resource-binding-through-controllerResourceBindingAuthority;no-production-consumer-selects-bindingJudgments-or-rebuilds-integrated-response',
  controllerDataflowAstAdtProjection: 'AST-expression-projection-exhaustively-consumes-resolved-unresolved-and-ambiguous-payload-judgments;ambiguity-remains-a-distinct-unresolved-SemanticValue-variant;only-resolved-judgments-supply-the-canonical-sourceExpression',
  controllerBodyProjectionAdt: 'ControllerBodyAst-is-a-closed-discriminated-union;controller_body_syntax_only-has-dataflow-undefined;controller_body_semantic-retains-the-canonical-ControllerDataflowAst-and-integrated-response;absence-of-semantic-analysis-is-not-reclassified-as-not-connected-or-unresolved',
  controllerBodyInvocationOutcome: 'controller_body_semantic-signals-dataflow-judgment-presence-only-not-invocation-completion;complete-blocked-source-binding-rejected-and-not-connected-remain-the-exact-upstream-discriminated-outcomes-in-the-retained-judgment-and-integrated-response',
  controllerDataflowRuntimeReductionGate: 'controllerDataflowAnalyzer-only-collects-source-correlated-knowledge-and-PHP-payload-evidence-then-calls-one-closed-upstream-ControllerDataflowSemanticJudgmentAuthority;binding-closure-and-variable-flow-composition-are-authority-owned;PHP-expression-definition-projection-remains-an-explicit-source-adapter',
  controllerDataflowVariableIdentityBoundary: 'variable-name identity is resolved from canonical semantic variable facts by an upstream closed judgment; missing or ambiguous identity is retained and never replaced with an opaque knowledge slot',
  controllerDataflowIntegratedResponseOwnership: 'canonical-judgment-owns-source-identity-and-exact-PHP-invocation-outcome;semanticKnowledgeProjection.knowledge-is-the-single-canonical-knowledge-field;upstream-composition-builds-the-publication-aggregate-and-preserves-judgment.response-as-phpFunctionInvocations-without-reclassification-or-republishing-knowledge',
  controllerDataflowSemanticJudgmentPublication: 'the-closed-upstream-bindingJudgments-retain-the-exact-matched-PHP-AST-payload-reference-and-its-definition-semanticResolution;scanner-consumes-the-authority-closed-per-payload-semantic-judgment-by-payload-identity-and-reuses-its-canonical-sourceExpression;duplicate-resolved-bindings-are-published-as-ambiguity-not-first-match-selected;scanner-does-not-rematch-source-spans-or-reclassify-semantic-meaning',
  controllerDataflowKnowledgeIdentityBoundary: 'semanticKnowledgeProjection-is-the-canonical-source-correlated-knowledge-owner;integrated-response-composition-consumes-the-complete-projection-and-returns-response-only-without-republishing-knowledge-or-provenance',
  structuralParserCallSiteDisposition: 'attribute-and-provider-consumers-use-syntax-only-projection; middleware-and-response consumers need an explicit source-bound semantic judgment',
  structuralParserCallSiteInventory: Object.freeze([
    Object.freeze({ kind: 'structural_ast_consumer', path: 'packages/core/src/compiler/scanner/laravelAttributeScanner.ts', semanticAuthority: 'not_an_invocation_semantic_authority', migrationRequirement: 'use-the-explicit-syntax-only-projection-context-without-invocation-dataflow-analysis' }),
    Object.freeze({ kind: 'structural_ast_consumer', path: 'packages/core/src/compiler/scanner/operations/providerAstCanonical.ts', semanticAuthority: 'not_an_invocation_semantic_authority', migrationRequirement: 'use-the-explicit-syntax-only-projection-context-without-invocation-dataflow-analysis' }),
    Object.freeze({ kind: 'semantic_ast_consumer', path: 'packages/core/src/compiler/scanner/operations/middlewareAstCanonical.ts', semanticAuthority: 'canonical_invocation_judgment_required', migrationRequirement: 'must-use-a-source-bound-judgment-context-and-must-not-claim-whole-file-invocation-coverage-while-the-source-pipeline-is-not-connected' }),
    Object.freeze({ kind: 'semantic_ast_consumer', path: 'packages/core/src/compiler/scanner/operations/responseScanner.ts', semanticAuthority: 'canonical_invocation_judgment_required', migrationRequirement: 'must-use-a-source-bound-judgment-context-and-must-not-claim-whole-file-invocation-coverage-while-the-source-pipeline-is-not-connected' }),
        Object.freeze({ kind: 'test_fixture', path: 'packages/core/src/compiler/scanner/operations/controller/controllerMethodContract.phase894.test.ts', semanticAuthority: 'not_an_invocation_semantic_authority', migrationRequirement: 'test-only-syntax-fixtures-must-not-be-counted-as-production-semantic-pipeline-coverage' }),
    Object.freeze({ kind: 'test_fixture', path: 'packages/core/src/compiler/scanner/operations/controller/controllerInheritance.phase905.test.ts', semanticAuthority: 'not_an_invocation_semantic_authority', migrationRequirement: 'test-only-syntax-fixtures-must-not-be-counted-as-production-semantic-pipeline-coverage' }),
    Object.freeze({ kind: 'test_fixture', path: 'packages/core/src/compiler/scanner/operations/controller/controllerHasMiddleware.phase900.test.ts', semanticAuthority: 'not_an_invocation_semantic_authority', migrationRequirement: 'test-only-syntax-fixtures-must-not-be-counted-as-production-semantic-pipeline-coverage' }),
    Object.freeze({ kind: 'public_parser_facade', path: 'packages/core/src/compiler/scanner/LaravelSourceLexer.ts', semanticAuthority: 'not_an_invocation_semantic_authority', migrationRequirement: 'expose-the-discriminated-projection-context-and-never-accept-independent-filePath-and-integratedResponse' }),
  ] satisfies readonly LaravelControllerStructuralParserCallSiteDisposition[]),
  judgmentToAstProjectionBoundary: 'semantic-parser-context-carries-one-canonical-judgment-and-derives-sourceFile-and-exact-integrated-response-from-it; independent-semantic-input-arguments-are-not-accepted',
  structuralParserProjectionGate: 'structural-consumers-are-explicitly-syntax-only-and-cannot-trigger-invocation-dataflow-analysis',
  controllerProducerOwnershipBoundary: 'controller-producer-contract-is-upstream-owned-and-the-implementation-projects-declaration-evidence-while-preserving-the-source-correlated-invocation-judgment-without-reclassification',
  producerInvocationJudgmentBinding: 'controller-producer-accepts-the-source-correlated-invocation-judgment-as-one-value-derives-ast-source-file-from-it-and-forwards-the-exact-judgment-to-the-controller-artifact',
  subscannerDirectoryRealityBoundary: 'retiring-the-duplicate-ControllerScanner-entry-and-emptying-actionVariableTracker-and-controllerErrorDetector-does-not-imply-the-controller-subscanner-directory-is-empty-remaining-nonempty-modules-require-individual-consumer-trace-and-upstream-ownership-migration',
  controllerDataflowSourcePayloadEvidenceBoundary: 'controllerDataflowAnalyzer-requests-source-payload-evidence-from-the-injected-parser-specific-adapter-using-the-canonical-judgment-source-file',
  controllerDataflowSourcePayloadAdapterOwnership: 'source-adapter-only-traverses-PHP-AST-and-emits-typed-source-span-payloads;it-does-not-correlate-bindings-or-classify-semantic-origin',
  controllerDataflowSemanticStageInventory: 'controllerDataflowAnalyzer-collects-source-correlated-knowledge-and-parser-payload-evidence-then-forwards-one-evidence-input-to-ControllerDataflowSemanticJudgmentAuthorityInterface;authority-owns-binding-correspondence-identity-closure-variable-flow-composition-and-integrated-response;injected-PHP-definition-projection-adapter-uses-the-existing-runtime-executor',
  controllerDataflowSemanticResolutionInputAdapterBoundary: 'PHP-AST-expression-and-typed-parameter-semantics-are-adapted-to-the-canonical-ControllerVariableSemanticResolutionRequest-by-an-injected-source-adapter;semantic-rule-selection-and-judgment-remain-upstream-owned',
  controllerDataflowSemanticResolutionJudgmentBoundary: 'each-ControllerVariableDefinition-retains-the-exact-closed-ControllerVariableSemanticJudgment-returned-by-the-existing-upstream-executor;the-judgment-also-retains-the-exact-canonical-Expression-projected-from-the-same-matched-payload-that-generated-its-syntax-neutral-evidence;duplicate-matching-parameter-bindings-remain-an-explicit-ambiguous-ADT-outcome;the-source-projected-Expression-and-judgment-expressionValue-remain-distinct-domain-representations-and-are-never-reconstructed-or-reclassified',
  controllerDataflowKnowledgeEvidenceAdapterBoundary: 'controller-dataflow-analyzer-consumes-the-upstream-SemanticKnowledgeEvidenceAdapter-contract;PHP-AST-evidence-projector-is-injected-at-the-composition-root;analyzer-does-not-select-evidence-provider-provenance-or-import-a-concrete-knowledge-producer',
  controllerDataflowKnowledgeEvidenceAdapterPropagationBoundary: 'the-injected-SemanticKnowledgeEvidenceAdapter-receives-one-typed-source-correlated-projection-input;it-is-not-forwarded-to-variable-definition-projection-which-does-not-consume-it',
  controllerDataflowKnowledgeEvidenceProjectionBoundary: 'projection-input-binds-PHP-evidence-to-canonical-SourceFile;the-PHP-projector-owns-parser-provenance-and-returns-it-with-canonical-SemanticKnowledgeDataFlow',
  controllerDataflowVariableFlowCompositionBoundary: 'canonical-variable-flow-grouping-is-owned-by-ControllerSemanticVariableFlowCompositionAuthorityInterface-using-typed-VariableName-identity-and-retaining-definition-order-and-evidence;definition-expression-is-owned-only-by-the-closed-semanticResolution-judgment',
  controllerDataflowEvidenceContractGate: 'binding-to-statement-correspondence-and-origin-normalization-are-upstream-judged;source-payload-traversal-is-owned-by-the-injected-parser-specific-evidence-adapter;expression-projection-delegates-through-PhpAstExpressionSemanticAuthorityInterface',
  controllerDataflowBindingPayloadJudgmentBoundary: 'a binding is semantically resolvable only when a typed correspondence judgment identifies its source payload; missing or ambiguous correspondence must remain an explicit typed outcome and must not be silently converted into an unsupported-expression payload',
  controllerDataflowProjectionOwnership: 'the source adapter supplies PHP AST payload evidence; upstream correspondence authority judges canonical source identity, span, and canonical variable origin; PHP-to-upstream expression projection delegates through PhpAstExpressionSemanticAuthorityInterface',
  controllerDataflowOriginJudgmentClosure: 'matched binding-payload correspondence carries canonical ControllerVariableOrigin; scanner does not reclassify semantic origin codes',
  controllerDataflowCorrespondenceOutcomeShape: 'each binding retains exactly one matched-missing-or-ambiguous correspondence judgment; definitions are projected only from matched payload evidence',
  controllerDataflowCorrespondenceAuthorityBoundary: 'analyzer delegates exact source-file-and-span matching and canonical origin judgment to ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface and forwards the returned closed judgment without reconstruction',
  controllerDataflowExpressionProjectionAuthorityBoundary: 'matched PHP expression evidence is projected through the existing PhpAstExpressionSemanticAuthorityInterface; analyzer does not directly call the concrete PHP-to-upstream mapper',
  controllerDataflowParameterEvidenceBoundary: 'controller dataflow receives typed parameter semantic bindings only; raw parameter identifier lists are not passed as a second unused authority input',
  controllerDataflowJudgmentCompositionInvariant: 'canonical invocation judgment and integrated response composition remain distinct typed values; composition consumes the exact knowledge input and preserves the exact judgment response without publishing a duplicate knowledge value or asserting response-type identity',
  controllerDataflowSourceCorrelation: 'one-source-correlation-value-crosses-the-authority-boundary-and-upstream-validates-canonical-sourceFile-against-invocation-judgment-knowledge-projection-and-every-payload-source-span-using-existing-typed-source-file-identity-semantics',
  controllerDataflowDefinitionProjectionSourceBinding: 'definition-projection-no-longer-accepts-a-second-invocation-judgment-source-channel;it-uses-the-exact-matched-payload-source-file-after-upstream-correlation-validation;upstream-validates-the-projected-definition-source-file-before-variable-flow-publication;scanner-remains-evidence-collection-and-wiring-only',
  sourceBindingJudgmentAuthority: 'source-identity-binding-is-an-upstream-closed-judgment-and-a-mismatch-remains-a-distinct-integrated-response-rejection',
  runtimeReductionTarget: 'retire-controller-subscanner-after-upstream-interface-owns-source-artifacts-and-integrated-invocation-response',
  pipelineInjectionBoundary: 'raw-whole-file-pipeline-results-stop-at-the-upstream-judgment-authority-and-only-a-validated-total-correlated-inventory-crosses-the-controller-scanner-boundary',
  fallbackSemantics: 'not-connected-is-materialized-upstream-as-a-distinct-integrated-judgment-and-scanner-never-invents-a-fallback',
});
