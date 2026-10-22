import type { ControllerAst } from './ast';
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { LaravelControllerScanInput, LaravelControllerScanJudgment, LaravelControllerScanArtifact, ControllerResourceBindingEvidence, LaravelControllerScannerInterface } from './laravelControllerScannerInterface';
import type { LaravelSourceAstPipelineInterface } from './laravelSourceAstPipelineInterface';
import type { LaravelControllerInvocationResponseWiringInterface } from './laravelControllerInvocationResponseWiringInterface';
import type { ControllerDataflowInvocationSemanticModelInterface } from './controllerDataflowInvocationSemanticModelInterface';
import type { ControllerVariableSemanticAuthorityInterface, ControllerVariableSemanticJudgment } from './controllerVariableSemanticInterface';
import type { ControllerProducer, ControllerProducerResult } from './controllerProducerInterface';
import type { RouteValidationRuleEntry } from '../domain/validationRules';
import type { ResponseDescriptor } from '../domain/responseDescriptors';
import type { ResponseContractField } from '../domain/responseContracts';
import type { LaravelControllerResponseEvidenceSourceBindingAuthorityInterface, LaravelControllerResponseEvidenceSourceBindingContract, LaravelControllerResponseEvidenceSourceBindingJudgment, LaravelControllerResponseSemanticJudgment, LaravelControllerResponseSemanticJudgmentAuthorityInterface, LaravelControllerResponseSemanticJudgmentContract, LaravelControllerResponseSemanticProduct, LaravelControllerResponseSemanticRuntimeExecutorInterface } from './laravelControllerResponseSemanticJudgmentInterface';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { LaravelSourceAstProjectionJudgment } from './laravelSourceAstPipelineInterface';
import type { LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt } from './laravelControllerInvocationSemanticJudgmentInventoryInterface';



/**
 * One typed path across the existing invocation, response, artifact, and AST
 * contracts. This is an interface-only correspondence: it creates no executor,
 * authority, registry, scanner, or implementation layer.
 */
export interface LaravelControllerInvocationResponseAstContractMap {
  readonly invocation: LaravelControllerInvocationSemanticJudgmentInterface;
  readonly responseEvidenceBinding: LaravelControllerResponseEvidenceSourceBindingAuthorityInterface;
  readonly response: LaravelControllerResponseSemanticJudgment;
  readonly controllerArtifact: LaravelControllerScanArtifact;
  readonly sourceAstProjection: LaravelSourceAstProjectionJudgment;
  readonly inventoryClosure: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt;
}

/**
 * These obligations make the existing interfaces composable without inventing
 * a replacement subscanner. They are deliberately declarative and type-only.
 */
export interface LaravelControllerSubscannerInterfaceFirstContract {
  readonly kind: 'laravel_controller_subscanner_interface_first_contract';
  readonly contractVersion: 1;
  readonly sourceEvidenceOwner: 'existing-Laravel-controller-source-and-inventory-contracts';
  readonly invocationJudgmentOwner: 'LaravelControllerInvocationSemanticJudgmentInterface';
  readonly responseEvidenceBindingOwner: 'LaravelControllerResponseEvidenceSourceBindingAuthorityInterface-delegating-identity-comparison-to-LaravelSourceIdentitySemanticsInterface';
  readonly responseJudgmentOwner: 'LaravelControllerResponseSemanticJudgmentFor-the-exact-invocation-outcome';
  readonly integratedResponseOwner: 'existing-InvocationSemanticIntegratedResponseCompositionInterface';
  /** PHP invocation composition and Laravel HTTP-response judgment are distinct authority domains. */
  readonly invocationSemanticAuthorityOwner: 'InvocationSemanticAuthorityInterface.analyze';
  readonly invocationRuntimeExecutorOwner: 'retired;InvocationSemanticAuthorityInterface.analyze';
  readonly invocationIntegratedResponseOwner: 'InvocationSemanticIntegratedResponseCompositionInterface.integrate';
  readonly laravelHttpResponseJudgmentOwner: 'LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse';
  readonly authorityNonInterchangeability: 'PHP-invocation-judgment-is-preserved-as-input-to-Laravel-HTTP-response-judgment;neither-authority-reconstructs-the-other';
  readonly controllerArtifactOwner: 'LaravelControllerScannerInterface';
  readonly astProjectionOwner: 'LaravelSourceAstProjectionJudgment';
  readonly evidenceBindingObligation: 'bind-each-source-evidence-item-before-response-authority-judgment-and-represent-empty-inventory-explicitly';
  readonly executorObligation: 'consume-the-complete-correlated-artifact-and-forward-closed-outcomes-without-classification-or-reconstruction';
  readonly prohibitedLayers: readonly ['semantic/relations', 'semantic/foundation', 'replacement-subscanner', 'parallel-invocation-authority'];
  readonly actionRequestBindingRule: 'forward-the-existing-controller-request-binding-adt-without-reclassification';
}

/**
 * Type-level migration map for retiring the legacy Laravel subscanner directory.
 * This module intentionally exports no runtime value, factory, resolver, or
 * scanner facade. Existing upstream interfaces are the replacement boundaries.
 */
export type LaravelSubscannerRetirementDomain =
  | Readonly<{
      readonly kind: 'route';
      readonly legacyEntry: 'RouteScanner';
      readonly upstreamBoundary: 'LaravelRouteScannerInterface';
      readonly semanticOwner: 'RouteControllerBindingJudgmentAuthority';
      readonly retirementCondition: 'all-route-consumers-use-upstream-route-evidence-and-binding-judgment';
    }>
  | Readonly<{
      readonly kind: 'controller';
      readonly legacyEntry: 'ControllerScanner';
      readonly upstreamBoundary: 'LaravelControllerScannerInterface';
      readonly semanticOwner: 'InvocationSemanticIntegratedResponseCompositionInterface';
      readonly retirementCondition: 'all-controller-consumers-use-source-artifacts-and-source-bound-integrated-response';
    }>
  | Readonly<{
      readonly kind: 'model';
      readonly legacyEntry: 'ModelScanner';
      readonly upstreamBoundary: 'LaravelModelScannerInterface';
      readonly semanticOwner: 'canonical-model-source-evidence-and-definition-contract';
      readonly retirementCondition: 'all-model-consumers-use-upstream-model-evidence-and-correlated-definition';
    }>
  | Readonly<{
      readonly kind: 'form_request';
      readonly legacyEntry: 'FormRequestScanner';
      readonly upstreamBoundary: 'LaravelFormRequestScannerInterface';
      readonly semanticOwner: 'canonical-validation-rule-and-request-field-contract';
      readonly retirementCondition: 'all-request-consumers-use-upstream-validation-evidence-and-correlated-definition';
    }>
  | Readonly<{
      readonly kind: 'resource';
      readonly legacyEntry: 'ResourceScanner';
      readonly upstreamBoundary: 'LaravelResourceScannerInterface';
      readonly semanticOwner: 'ResourceModelBindingJudgmentAuthority';
      readonly retirementCondition: 'all-resource-consumers-use-source-evidence-and-authority-owned-model-binding-judgment';
    }>
  | Readonly<{
      readonly kind: 'channel';
      readonly legacyEntry: 'ChannelScanner';
      readonly upstreamBoundary: 'LaravelChannelScannerInterface';
      readonly semanticOwner: 'BroadcastChannelKindJudgmentAuthority';
      readonly retirementCondition: 'all-channel-consumers-use-source-only-declarations-and-closed-kind-judgment';
    }>;


/**
 * Compile-time ownership map using the actual upstream/domain types, rather than
 * string labels pretending to be semantic contracts. This is a type map only:
 * it creates no runtime registry, factory, scanner, or parallel authority.
 */
export interface LaravelControllerSubscannerResponsibilityTypeMap {
  readonly 'inline-validation-evidence': Readonly<{
    readonly sourceEvidence: RouteValidationRuleEntry;
    readonly semanticProduct: RouteValidationRuleEntry;
    readonly owner: LaravelControllerScannerInterface;
  }>;
  readonly 'controller-ast-projection': Readonly<{
    readonly sourceEvidence: LaravelControllerScanInput;
    readonly semanticProduct: ControllerAst;
    readonly owner: LaravelSourceAstPipelineInterface;
  }>;
  readonly 'controller-body-projection': Readonly<{
    readonly sourceEvidence: ControllerDataflowInvocationSemanticModelInterface;
    readonly semanticProduct: ControllerDataflowInvocationSemanticModelInterface;
    readonly owner: ControllerDataflowInvocationSemanticModelInterface;
  }>;
  readonly 'controller-dataflow-judgment': Readonly<{
    readonly sourceEvidence: ControllerVariableSemanticJudgment;
    readonly semanticProduct: ControllerVariableSemanticJudgment;
    readonly owner: ControllerVariableSemanticAuthorityInterface;
  }>;
  readonly 'controller-artifact-publication': Readonly<{
    readonly sourceEvidence: ControllerProducerResult;
    readonly semanticProduct: ControllerActionFlowContract;
    readonly owner: ControllerProducer;
  }>;
  readonly 'resource-binding-aggregation': Readonly<{
    readonly sourceEvidence: ControllerResourceBindingEvidence;
    readonly semanticProduct: ControllerResourceBindingEvidence;
    readonly owner: LaravelControllerScannerInterface;
  }>;
  readonly 'resource-invocation-evidence': Readonly<{
    readonly sourceEvidence: ControllerResourceBindingEvidence;
    readonly semanticProduct: ControllerResourceBindingEvidence;
    readonly owner: LaravelControllerScannerInterface;
  }>;
  readonly 'response-attribute-evidence': Readonly<{
    readonly sourceEvidence: ResponseDescriptor;
    readonly semanticProduct: LaravelControllerResponseSemanticProduct;
    readonly judgment: LaravelControllerResponseSemanticJudgment;
    readonly judgmentContract: LaravelControllerResponseSemanticJudgmentContract;
    readonly owner: LaravelControllerResponseSemanticJudgmentAuthorityInterface;
    readonly artifactBoundary: LaravelControllerScanArtifact;
  }>;
  readonly 'response-shape-evidence': Readonly<{
    readonly sourceEvidence: ResponseDescriptor;
    readonly semanticProduct: LaravelControllerResponseSemanticProduct;
    readonly judgment: LaravelControllerResponseSemanticJudgment;
    readonly judgmentContract: LaravelControllerResponseSemanticJudgmentContract;
    readonly owner: LaravelControllerResponseSemanticJudgmentAuthorityInterface;
    readonly artifactBoundary: LaravelControllerScanArtifact;
  }>;
  readonly 'response-dto-evidence': Readonly<{
    readonly sourceEvidence: ResponseContractField;
    readonly semanticProduct: LaravelControllerResponseSemanticProduct;
    readonly judgment: LaravelControllerResponseSemanticJudgment;
    readonly judgmentContract: LaravelControllerResponseSemanticJudgmentContract;
    readonly owner: LaravelControllerResponseSemanticJudgmentAuthorityInterface;
    readonly artifactBoundary: LaravelControllerScanArtifact;
  }>;
  readonly 'controller-subscanner-barrel': Readonly<{
    readonly sourceEvidence: LaravelControllerScanJudgment;
    readonly semanticProduct: LaravelControllerScanJudgment;
    readonly owner: LaravelControllerScannerInterface;
  }>;
}

export type LaravelControllerSubscannerResponsibilityKind = keyof LaravelControllerSubscannerResponsibilityTypeMap;
export type LaravelControllerSubscannerSemanticProduct<Kind extends LaravelControllerSubscannerResponsibilityKind> =
  LaravelControllerSubscannerResponsibilityTypeMap[Kind]['semanticProduct'];
export type LaravelControllerSubscannerSemanticOwner<Kind extends LaravelControllerSubscannerResponsibilityKind> =
  LaravelControllerSubscannerResponsibilityTypeMap[Kind] extends Readonly<{ readonly owner: infer Owner }>
    ? Owner
    : LaravelControllerSubscannerResponsibilityTypeMap[Kind] extends Readonly<{ readonly judgment: infer Judgment }>
      ? Judgment
      : never;

/** Responsibility-level trace for the existing controller subscanner modules.
 * These are ownership declarations, not replacement scanner implementations.
 * Every owner names an existing upstream/domain contract; no relation/foundation
 * layer or second semantic authority is introduced.
 */
export type LaravelControllerSubscannerResponsibility =
  | Readonly<{ readonly kind: 'inline-validation-evidence'; readonly legacyModule: 'actionValidationExtractor.ts'; readonly targetContract: 'canonical-validation-rule-and-request-field-contract'; readonly semanticProduct: 'RouteValidationRuleEntry'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'controller-ast-projection'; readonly legacyModule: 'controllerAstCanonical.ts'; readonly targetContract: 'LaravelSourceAstProjectionJudgment'; readonly semanticProduct: 'ControllerAst'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'controller-body-projection'; readonly legacyModule: 'controllerBodyResolver.ts'; readonly targetContract: 'ControllerBodyAst'; readonly semanticProduct: 'ControllerBodyAst-discriminated-union'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'controller-dataflow-judgment'; readonly legacyModule: 'controllerDataflowContract.ts'; readonly targetContract: 'ControllerDataflowInvocationSemanticModelInterface'; readonly semanticProduct: 'ControllerVariableSemanticJudgment'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'controller-artifact-publication'; readonly legacyModule: 'controllerProducer.ts'; readonly targetContract: 'ControllerProducer'; readonly semanticProduct: 'ControllerActionFlowContract'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'resource-binding-aggregation'; readonly legacyModule: 'resourceDataflowAggregator.ts'; readonly targetContract: 'ResourceModelBindingJudgmentAuthority'; readonly semanticProduct: 'ControllerResourceBindingEvidence'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'resource-invocation-evidence'; readonly legacyModule: 'resourceInvocationDetector.ts'; readonly targetContract: 'ResourceModelBindingJudgmentAuthority'; readonly semanticProduct: 'source-bound-resource-invocation-evidence'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'response-attribute-evidence'; readonly legacyModule: 'responseAttributeScanner.ts'; readonly targetContract: 'LaravelControllerResponseSemanticJudgmentAuthorityInterface'; readonly semanticProduct: 'LaravelControllerResponseSemanticProduct'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'response-shape-evidence'; readonly legacyModule: 'responseDetector.ts'; readonly targetContract: 'LaravelControllerResponseSemanticJudgmentAuthorityInterface'; readonly semanticProduct: 'LaravelControllerResponseSemanticProduct'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'response-dto-evidence'; readonly legacyModule: 'responseDtoReader.ts'; readonly targetContract: 'LaravelControllerResponseSemanticJudgmentAuthorityInterface'; readonly semanticProduct: 'LaravelControllerResponseSemanticProduct'; readonly semanticDecisionInScanner: false }>
  | Readonly<{ readonly kind: 'controller-subscanner-barrel'; readonly legacyModule: 'index.ts'; readonly targetContract: 'LaravelControllerScannerInterface'; readonly semanticProduct: 'public-controller-scan-judgment'; readonly semanticDecisionInScanner: false }>;

/**
 * Pure type contract describing ownership transfer from legacy scanner entries
 * to the already-existing upstream semantic interfaces. It is deliberately not
 * instantiated as a runtime constant: consumers must depend on the real domain
 * interfaces, not a second retirement registry.
 */
export interface LaravelSubscannerRetirementInterface {
  readonly kind: 'laravel_subscanner_retirement_contract';
  readonly closed: true;
  readonly version: 17;
  readonly legacyDirectory: 'packages/core/src/compiler/scanner/subscanners';
  readonly controllerDirectoryState: 'partially-retired-four-empty-modules-and-ten-nonempty-source-modules';
  readonly emptiedControllerModules: readonly ['actionScanner.ts', 'actionVariableTracker.ts', 'controllerErrorDetector.ts', 'responseAttributeScanner.ts'];
  readonly nonEmptyControllerModules: readonly [
    'actionValidationExtractor.ts',
    'controllerAstCanonical.ts',
    'controllerBodyResolver.ts',
    'controllerDataflowContract.ts',
    'controllerProducer.ts',
    'index.ts',
    'resourceDataflowAggregator.ts',
    'resourceInvocationDetector.ts',
    'responseDetector.ts',
    'responseDtoReader.ts'
  ];
  readonly targetArchitecture: 'source-evidence-to-upstream-semantic-judgment-to-integrated-response-without-permanent-subscanner-layer';
  /** Canonical invocation/response/artifact/AST correspondence; compile-time only. */
  readonly invocationResponseAstContractMap: LaravelControllerInvocationResponseAstContractMap;
  /** Explicit callable forwarding contract for wiring; runtime implementation must conform without reclassifying semantics. */
  readonly invocationResponseWiring: LaravelControllerInvocationResponseWiringInterface;
  /** Response meaning is closed by its own typed authority, not by the scanner or invocation authority. */
  readonly responseSemanticAuthority: LaravelControllerResponseSemanticJudgmentAuthorityInterface;
  /** Runtime response execution is a typed delegation boundary, not a semantic classifier. */
  readonly responseSemanticRuntimeExecutor: LaravelControllerResponseSemanticRuntimeExecutorInterface;
  /** Explicit per-evidence source correlation; this is a type contract, not runtime wiring. */
  readonly responseEvidenceSourceBindingContract: LaravelControllerResponseEvidenceSourceBindingContract;
  readonly responseEvidenceSourceBindingJudgment: LaravelControllerResponseEvidenceSourceBindingJudgment;
  /** Runtime executor obligations stated before any runtime migration; no executor implementation is added here. */
  readonly interfaceFirstContract: LaravelControllerSubscannerInterfaceFirstContract;
  /** Controller-specific migration map; each responsibility is bound to an existing contract, not a new authority. */
  readonly controllerResponsibilities: readonly LaravelControllerSubscannerResponsibility[];
  /** Actual compile-time type correspondence for every responsibility; no string-only product labels are authoritative. */
  readonly controllerResponsibilityTypeMap: LaravelControllerSubscannerResponsibilityTypeMap;
  readonly controllerSemanticFlow: 'source-evidence-to-canonical-invocation-semantic-judgment-to-response-authority-closed-outcome-indexed-response-judgment-to-correlated-controller-artifact-to-discriminated-AST-projection';
  readonly runtimeExecutorBoundary: 'runtime-executes-the-complete-source-correlated-controller-artifact-and-does-not-reason-classify-or-reconstruct-invocation-or-response-outcomes';
  readonly authorityBoundary: 'InvocationSemanticAuthorityInterface-owns-PHP-invocation-judgment;InvocationSemanticAuthorityInterface-is-called-directly-without-runtime-forwarder;InvocationSemanticIntegratedResponseCompositionInterface-integrates-PHP-invocation-knowledge;LaravelControllerResponseSemanticPipelineInterface-owns-Laravel-HTTP-response-judgment';
  readonly forbiddenReplacementLayers: readonly ['semantic/relations', 'semantic/foundation', 'replacement-subscanner', 'parallel-invocation-authority'];
  readonly deletionGate: 'delete-legacy-subscanner-directory-only-after-zero-production-consumers-and-audit-passes';
  readonly domains: readonly LaravelSubscannerRetirementDomain[];
}
