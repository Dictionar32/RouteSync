import type { RouteAst } from './ast';
import type { LaravelRouteSourceSelectionIntent } from './laravelRouteSourceSelection';
import type { RouteSemanticFlow } from '../domain/routes';
import type { ControllerActionJudgmentPublication, LaravelControllerScanJudgment } from './laravelControllerScannerInterface';
import type { SourceFile } from './names';
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
  readonly resolveSourceFiles: (sourceProject: SourceProjectIdentity, intent: LaravelRouteSourceSelectionIntent) => readonly SourceFile[];
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
  readonly selectedFiles: readonly SourceFile[];
  readonly missingFiles: readonly SourceFile[];
}

export type LaravelRouteSourceObservationJudgment =
  | Readonly<{ readonly kind: 'laravel_route_source_observation_ready'; readonly sourceFiles: readonly LaravelRouteSourceFileObservation[] }>
  | LaravelRouteScanBlockedJudgment;

export interface LaravelRouteScanOperationInterface extends LaravelRouteScannerAuthorityInterface {
  readonly kind: 'prepared_laravel_route_scan_operation';
  readonly closed: true;
  readonly contractVersion: 2;
  readonly input: LaravelRouteScanInput;
  readonly execute: () => Promise<LaravelRouteScanOutcome>;
}

/** Closed upstream contract for preparing canonical Laravel route-scan operations. */
export interface LaravelRouteScannerInterface extends LaravelRouteScannerAuthorityInterface {
  readonly kind: 'laravel_route_scanner';
  readonly closed: true;
  readonly contractVersion: 36;
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

export type LaravelRouteSourceFileObservation =
  | Readonly<{ readonly kind: 'laravel_route_source_file_scanned'; readonly file: SourceFile }>
  | Readonly<{ readonly kind: 'laravel_route_source_file_absent_optional_default'; readonly file: SourceFile }>;

export interface LaravelRouteScanBlockedJudgment {
  readonly kind: 'laravel_route_scan_blocked';
  readonly contractVersion: 27;
  readonly reason: 'explicitly_selected_route_source_file_absent';
  readonly missingFiles: readonly SourceFile[];
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

export type LaravelRouteScanOutcome = LaravelRouteScanJudgment | LaravelRouteScanBlockedJudgment | LaravelRouteScanPolicyBlockedJudgment | LaravelRouteScanResponseBlockedJudgment;
