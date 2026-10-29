import type { RouteAst } from './ast';
import type { LaravelRouteSourceSelectionIntent, LaravelRouteScanBlockedJudgment, LaravelRouteSourceFileObservation, LaravelRouteSourceObservationJudgment, LaravelRouteSourcePresenceInterface } from './laravelRouteSourceSelection';
export type { LaravelRouteScanBlockedJudgment, LaravelRouteSourceFileObservation, LaravelRouteSourceObservationJudgment } from './laravelRouteSourceSelection';
import type { RouteSemanticFlow } from '../domain/routes';
import type { ControllerActionJudgmentPublication, LaravelControllerScanJudgment } from './laravelControllerScannerInterface';
import type { SourceFile, SourceFileInventory } from './names';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { RouteControllerBindingJudgment, RouteControllerBindingJudgmentAuthority } from './laravelScannerSemanticJudgment';
import type { MiddlewareName } from './names';
import type { Presence } from './presence';
import type { LaravelRouteAuthorizationSemanticJudgment, LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface } from './routeAuthorizationSemanticJudgmentInterface';
import type { BlockedEffectiveControllerActionPolicy, EffectiveControllerActionPolicy, EffectiveControllerActionPolicyCatalogJudgment, EffectiveControllerActionPolicySemanticAuthorityInterface } from './effectiveControllerActionPolicy';
import type { RouteBoundaryContract, RouteProducer, RouteProducerInputComposition } from './route';
import type { ControllerActionRouteCorrelationAuthorityInterface } from './laravelControllerActionRouteCorrelationAuthority';
import type { LaravelRouteDeclarationMethodJudgment, LaravelRouteDeclarationMethodJudgmentAuthority } from './laravelRouteDeclarationMethodJudgment';
import type { RouteDeclarationEvidence } from './routeDeclarationEvidence';
import type { RouteResourceFlowAuthority } from './routeResourceFlow';
import type { LaravelRoutePathResolutionAuthority } from './routePathResolution';
import type { PhpSourceDocumentReadBatchBlockedEvidence, PhpSourceDocumentReaderInterface } from './phpSourceFrontendInterface';
import type { LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt } from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import type { LaravelSourceAstProjectionJudgment } from './laravelSourceAstPipelineInterface';
export type { LaravelRouteMethod, LaravelResourceRouteMethod, LaravelStandardRouteMethod, LaravelRouteTargetMethod, LaravelRouteDeclarationMethodJudgmentInput, LaravelRouteDeclarationMethodJudgment, LaravelRouteDeclarationMethodJudgmentAuthority } from './laravelRouteDeclarationMethodJudgment';

/** Authorities and producers owned by the upstream route-scanner composition boundary. */
export interface LaravelRouteScannerAuthorityInterface {
  /** Stable dependency: route binding is owned by the scanner composition, not supplied as per-scan data. */
  readonly bindingAuthority: RouteControllerBindingJudgmentAuthority;
  readonly declarationMethodAuthority: LaravelRouteDeclarationMethodJudgmentAuthority;
  readonly effectiveControllerActionPolicyAuthority: EffectiveControllerActionPolicySemanticAuthorityInterface;
  readonly authorizationAuthority: LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface;
  readonly routeResourceFlowAuthority: RouteResourceFlowAuthority;
  readonly routePathResolutionAuthority: LaravelRoutePathResolutionAuthority;
  readonly controllerActionRouteCorrelationAuthority: ControllerActionRouteCorrelationAuthorityInterface;
  readonly routeProducerInputComposition: RouteProducerInputComposition;
  readonly routeProducer: RouteProducer;
  readonly declarationCompositionAuthority: LaravelRouteDeclarationCompositionAuthorityInterface;
  readonly sourceDocumentReader: PhpSourceDocumentReaderInterface;
}

/** A prepared route scan carries its complete input and executes without runtime arguments. */
/** Closed input to upstream route-declaration composition; all semantic dependencies are explicit. */
export interface LaravelRouteDeclarationCompositionInput {
  readonly declarationEvidence: RouteDeclarationEvidence;
  readonly methodJudgment: LaravelRouteDeclarationMethodJudgment;
  readonly authorizationAuthority: LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface;
  readonly routeResourceFlowAuthority: RouteResourceFlowAuthority;
  readonly routePathResolutionAuthority: LaravelRoutePathResolutionAuthority;
  readonly sourceFile: SourceFile;
  readonly controllerScan: LaravelControllerScanJudgment;
  readonly publications: readonly ControllerActionJudgmentPublication[];
  readonly controllerActionRouteCorrelationAuthority: ControllerActionRouteCorrelationAuthorityInterface;
}

/** The route scanner consumes this authority instead of classifying or projecting declarations locally. */
export interface LaravelRouteDeclarationCompositionAuthorityInterface {
  readonly kind: 'laravel_route_declaration_composition_authority';
  readonly closed: true;
  readonly compose: (input: LaravelRouteDeclarationCompositionInput) => readonly RouteBoundaryContract[];
  readonly catalogFromControllerScan: (controllerScan: LaravelControllerScanJudgment) => EffectiveControllerActionPolicyCatalogJudgment;
  readonly policyForBinding: (input: LaravelRoutePolicyProjectionInput) => Presence<EffectiveControllerActionPolicy>;
  readonly resolveSourceFiles: (sourceProject: SourceProjectIdentity, intent: LaravelRouteSourceSelectionIntent) => SourceFileInventory;
  readonly observeSourceFiles: (input: LaravelRouteSourceObservationInput) => LaravelRouteSourceObservationJudgment;
  readonly outcomeFromScan: (scan: LaravelRouteScanJudgment) => LaravelRouteScanOutcome;
}

/** Closed input for policy projection; route syntax and controller binding remain explicit evidence. */
export interface LaravelRoutePolicyProjectionInput {
  readonly routeMiddleware: readonly MiddlewareName[];
  readonly declarationEvidence: RouteDeclarationEvidence;
  readonly binding: RouteControllerBindingJudgment;
  readonly controllerPolicyCatalog: EffectiveControllerActionPolicyCatalogJudgment;
  readonly effectiveControllerActionPolicyAuthority: EffectiveControllerActionPolicySemanticAuthorityInterface;
}

export interface LaravelRouteSourceObservationInput {
  readonly intent: LaravelRouteSourceSelectionIntent;
  readonly selectedFiles: SourceFileInventory;
  readonly presence: LaravelRouteSourcePresenceInterface;
}


export interface LaravelRouteScanOperationInterface extends LaravelRouteScannerAuthorityInterface {
  readonly kind: 'prepared_laravel_route_scan_operation';
  readonly closed: true;
  readonly contractVersion: 4;
  readonly input: LaravelRouteScanInput;
  readonly execute: () => Promise<LaravelRouteScanOutcome>;
}

/** Closed upstream contract for preparing canonical Laravel route-scan operations. */
export interface LaravelRouteScannerInterface extends LaravelRouteScannerAuthorityInterface {
  readonly kind: 'laravel_route_scanner';
  readonly closed: true;
  readonly contractVersion: 39;
  /** Preparation closes source evidence and semantic judgments; execution only publishes the prepared outcome. */
  readonly prepare: (input: LaravelRouteScanInput) => Promise<LaravelRouteScanOperationInterface>;
}

export interface LaravelRouteScanInput {
  /** Canonical source project and correlated controller artifacts come from the same closed scan judgment. */
  readonly controllerScan: LaravelControllerScanJudgment;
  /** Closed selection intent is always explicit; the executor never infers a default from absence. */
  readonly sourceSelectionIntent: LaravelRouteSourceSelectionIntent;
}

/** One route's AST, semantic flow, and binding judgment cannot drift across parallel arrays. */
export interface LaravelRouteScanArtifact {
  readonly kind: 'laravel_route_scan_artifact';
  readonly ast: RouteAst;
  readonly flow: RouteSemanticFlow;
  readonly binding: RouteControllerBindingJudgment;
  /** Original upstream authorization judgment is preserved; downstream must not reconstruct it from AST auth booleans. */
  readonly authorization: LaravelRouteAuthorizationSemanticJudgment;
}

export interface LaravelRouteScanJudgment {
  readonly kind: 'laravel_route_scan_judgment';
  readonly contractVersion: 27;
  /** Every selected source path has an explicit scanned/absent observation; absence is never silently represented as an empty file. */
  readonly sourceFiles: readonly LaravelRouteSourceFileObservation[];
  readonly artifacts: readonly LaravelRouteScanArtifact[];
}

/** A route scan may be syntactically complete while a required controller policy judgment is blocked. */
export interface LaravelRouteScanPolicyBlockedJudgment {
  readonly kind: 'laravel_route_scan_policy_blocked';
  readonly contractVersion: 27;
  /** Preserve the complete route evidence; policy blockage does not erase source observations or route artifacts. */
  readonly scan: LaravelRouteScanJudgment;
  /** Exact blocked upstream policies correlated to their route AST; no downstream reconstruction. */
  readonly policies: readonly Readonly<{
    readonly route: RouteAst;
    readonly policy: BlockedEffectiveControllerActionPolicy;
  }>[];
}

/** A blocked response projection is a compilation blocker, not an empty/void response. */
export interface LaravelRouteScanResponseBlockedJudgment {
  readonly kind: 'laravel_route_scan_response_blocked';
  readonly contractVersion: 27;
  /** Preserve the complete route scan and all response blockers so callers can report exact source routes. */
  readonly scan: LaravelRouteScanJudgment;
  readonly responses: readonly Readonly<{
    readonly route: RouteAst;
    readonly response: Extract<import('./endpointBindings').EndpointResponseBinding, { readonly kind: 'controller_response_projection_blocked' }>;
  }>[];
  /** Preserve any policy blockers found in the same scan instead of discarding one failure class. */
  readonly policies: LaravelRouteScanPolicyBlockedJudgment['policies'];
}

/** Source-read blockage evidence remains distinct from pre-scan explicit-file absence. */
export interface LaravelRouteScanSourceReadBlockedEvidence {
  readonly kind: 'laravel_route_scan_source_read_blocked';
  readonly contractVersion: 28;
  readonly sourceFiles: readonly LaravelRouteSourceFileObservation[];
  readonly readBatch: PhpSourceDocumentReadBatchBlockedEvidence;
}

/** Every route-scan terminal owns its next AST-projection action. */
export interface LaravelRouteScanProjectionContinuationInterface<Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt> {
  readonly onComplete: (judgment: LaravelRouteScanJudgment) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>;
  readonly onSourceSelectionBlocked: (judgment: LaravelRouteScanBlockedJudgment) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>;
  readonly onSourceReadBlocked: (judgment: LaravelRouteScanSourceReadBlockedEvidence) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>;
  readonly onResponseBlocked: (judgment: LaravelRouteScanResponseBlockedJudgment) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>;
  readonly onPolicyBlocked: (judgment: LaravelRouteScanPolicyBlockedJudgment) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>;
}

export type LaravelRouteScanSourceReadBlockedJudgment = LaravelRouteScanSourceReadBlockedEvidence;

/** Common operation shape implemented independently by each route-scan terminal. */
export interface LaravelRouteScanOutcomeContinuationInterface {
  readonly continueToSourceAstProjection: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(
    continuation: LaravelRouteScanProjectionContinuationInterface<Receipt>,
  ) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>;
}

export type LaravelRouteScanOutcome =
  | (LaravelRouteScanJudgment & LaravelRouteScanOutcomeContinuationInterface)
  | (LaravelRouteScanBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface)
  | (LaravelRouteScanPolicyBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface)
  | (LaravelRouteScanResponseBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface)
  | (LaravelRouteScanSourceReadBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface);

/** Constructors attach the operation at the terminal's origin; no consumer or central dispatcher reclassifies outcomes. */
export interface LaravelRouteScanOutcomeOperationsInterface {
  readonly complete: (judgment: LaravelRouteScanJudgment) => LaravelRouteScanJudgment & LaravelRouteScanOutcomeContinuationInterface;
  readonly sourceSelectionBlocked: (judgment: LaravelRouteScanBlockedJudgment) => LaravelRouteScanBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface;
  readonly sourceReadBlocked: (judgment: LaravelRouteScanSourceReadBlockedJudgment) => LaravelRouteScanSourceReadBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface;
  readonly responseBlocked: (judgment: LaravelRouteScanResponseBlockedJudgment) => LaravelRouteScanResponseBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface;
  readonly policyBlocked: (judgment: LaravelRouteScanPolicyBlockedJudgment) => LaravelRouteScanPolicyBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface;
}

export const laravelRouteScanOutcomeOperations: LaravelRouteScanOutcomeOperationsInterface = Object.freeze({
  complete: (judgment: LaravelRouteScanJudgment): LaravelRouteScanJudgment & LaravelRouteScanOutcomeContinuationInterface => Object.freeze({
    ...judgment,
    continueToSourceAstProjection: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(continuation: LaravelRouteScanProjectionContinuationInterface<Receipt>): Promise<LaravelSourceAstProjectionJudgment<Receipt>> => continuation.onComplete(judgment),
  }),
  sourceSelectionBlocked: (judgment: LaravelRouteScanBlockedJudgment): LaravelRouteScanBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface => Object.freeze({
    ...judgment,
    continueToSourceAstProjection: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(continuation: LaravelRouteScanProjectionContinuationInterface<Receipt>): Promise<LaravelSourceAstProjectionJudgment<Receipt>> => continuation.onSourceSelectionBlocked(judgment),
  }),
  sourceReadBlocked: (judgment: LaravelRouteScanSourceReadBlockedJudgment): LaravelRouteScanSourceReadBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface => Object.freeze({
    ...judgment,
    continueToSourceAstProjection: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(continuation: LaravelRouteScanProjectionContinuationInterface<Receipt>): Promise<LaravelSourceAstProjectionJudgment<Receipt>> => continuation.onSourceReadBlocked(judgment),
  }),
  responseBlocked: (judgment: LaravelRouteScanResponseBlockedJudgment): LaravelRouteScanResponseBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface => Object.freeze({
    ...judgment,
    continueToSourceAstProjection: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(continuation: LaravelRouteScanProjectionContinuationInterface<Receipt>): Promise<LaravelSourceAstProjectionJudgment<Receipt>> => continuation.onResponseBlocked(judgment),
  }),
  policyBlocked: (judgment: LaravelRouteScanPolicyBlockedJudgment): LaravelRouteScanPolicyBlockedJudgment & LaravelRouteScanOutcomeContinuationInterface => Object.freeze({
    ...judgment,
    continueToSourceAstProjection: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(continuation: LaravelRouteScanProjectionContinuationInterface<Receipt>): Promise<LaravelSourceAstProjectionJudgment<Receipt>> => continuation.onPolicyBlocked(judgment),
  }),
});
