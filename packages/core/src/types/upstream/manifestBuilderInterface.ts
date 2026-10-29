import type { LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt } from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import type { RouteSyncManifest, RouteSyncManifestFlow } from './manifest';
import type { LaravelSourceAstPipelineInterface, LaravelSourceAstProjectionJudgment } from './laravelSourceAstPipelineInterface';
import type { SemanticDataflowManifestSurfaceInterface } from './semanticDataflowManifestSurface';
import type { ResourceGroupCapabilityAlgebraInterface } from './resourceGroupCapability';
import type { SourceProjectIdentity, CompleteLaravelSourceModelBuilderInterface, CompleteSourceModelBuildBlockedResult } from './highLevelSourceModel';
import type { LaravelRouteSourceSelectionIntent } from './laravelRouteSourceSelection';

/** Complete input for manifest construction; scan intent is explicit rather than inferred from omission. */
export interface ManifestBuilderInput {
  readonly kind: 'manifest_builder_input';
  readonly invocationInventoryReceipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
}

/** Projection contract for the concrete downstream manifest-flow domain. */
export interface ManifestBuilderFlowProjectionInterface {
  readonly project: (manifest: RouteSyncManifest) => RouteSyncManifestFlow;
}

/** Terminal result of projecting a complete manifest judgment into the CLI flow domain. */
export interface ManifestBuilderFlowCompleteJudgment {
  readonly kind: 'route_sync_manifest_flow_complete';
  readonly flow: RouteSyncManifestFlow;
}

/** Domain-specific follow-up; blocked judgments remain blocked and retain their exact stage/evidence. */
export type ManifestBuilderFlowScanJudgment = ManifestBuilderBlockedJudgment | ManifestBuilderFlowCompleteJudgment;

/** A successful manifest construction retains its canonical manifest and exposes a typed continuation. */
export interface ManifestBuilderCompleteJudgment {
  readonly kind: 'manifest_builder_complete';
  readonly manifest: RouteSyncManifest;
  /** Domain-owned terminal operation: a complete judgment yields its canonical manifest. */
  readonly requireCompleteManifest: () => RouteSyncManifest;
  readonly continueToFlow: (projection: ManifestBuilderFlowProjectionInterface) => ManifestBuilderFlowScanJudgment;
}

/** Closed reasons for a blocked manifest build. Each reason has its own discriminator. */
export interface ManifestBuilderSourceAstBlocker {
  readonly kind: 'manifest_builder_source_ast_blocked';
  readonly sourceProject: SourceProjectIdentity;
  /** Exact non-complete upstream projection; no AST failure is normalized to an empty AST. */
  readonly projection: Exclude<LaravelSourceAstProjectionJudgment, { readonly kind: 'laravel_source_ast_projection_complete' }>;
}

/** A blocked source-model semantic judgment must prevent a complete manifest from being published. */
export interface ManifestBuilderSourceModelBlocker {
  readonly kind: 'manifest_builder_source_model_blocked';
  readonly sourceProject: SourceProjectIdentity;
  readonly sourceModel: CompleteSourceModelBuildBlockedResult;
}

export type ManifestBuilderBlocker =
  | ManifestBuilderSourceAstBlocker
  | ManifestBuilderSourceModelBlocker;

/** Source-AST blocker arm. The nested blocker discriminant preserves the exact failure domain. */
export interface ManifestBuilderSourceAstBlockedJudgment {
  readonly kind: 'manifest_builder_blocked';
  readonly stage: 'source_ast';
  readonly blocker: ManifestBuilderSourceAstBlocker;
  /** A blocked judgment owns rejection; consumers do not redispatch on its discriminator. */
  readonly requireCompleteManifest: () => never;
  readonly continueToFlow: (projection: ManifestBuilderFlowProjectionInterface) => ManifestBuilderFlowScanJudgment;
}

/** Source-model blocker arm. It cannot be mistaken for an AST projection failure. */
export interface ManifestBuilderSourceModelBlockedJudgment {
  readonly kind: 'manifest_builder_blocked';
  readonly stage: 'source_model';
  readonly blocker: ManifestBuilderSourceModelBlocker;
  /** A blocked judgment owns rejection; consumers do not redispatch on its discriminator. */
  readonly requireCompleteManifest: () => never;
  readonly continueToFlow: (projection: ManifestBuilderFlowProjectionInterface) => ManifestBuilderFlowScanJudgment;
}

/** Closed blocker union; stage and nested blocker kind both narrow the payload safely. */
export type ManifestBuilderBlockedJudgment =
  | ManifestBuilderSourceAstBlockedJudgment
  | ManifestBuilderSourceModelBlockedJudgment;

/** Closed outcome of manifest construction; each terminal owns a typed operation for follow-up. */
export type ManifestBuilderJudgment = ManifestBuilderCompleteJudgment | ManifestBuilderBlockedJudgment;

/** Runtime rejection owned by the upstream manifest domain; the exact blocked judgment remains attached. */
export class ManifestBuilderBlockedError extends Error {
  readonly kind = 'manifest_builder_blocked_error' as const;

  constructor(readonly judgment: ManifestBuilderBlockedJudgment) {
    super(`Manifest build blocked at ${judgment.stage}: ${JSON.stringify(judgment.blocker)}`);
    this.name = 'ManifestBuilderBlockedError';
  }
}


/** Canonical construction contract for the concrete upstream manifest. */
export interface ManifestBuilderInterface {
  readonly kind: 'manifest_builder';
  readonly closed: true;
  readonly contractVersion: 10;
  /** The exact request is data on this prepared operation, never a runtime method argument. */
  readonly input: ManifestBuilderInput;
  /** Exact upstream operations used to derive manifest products are explicit dependencies. */
  readonly sourceAstPipeline: LaravelSourceAstPipelineInterface;
  readonly dataflowManifestSurface: SemanticDataflowManifestSurfaceInterface;
  readonly resourceGroupCapabilityAlgebra: ResourceGroupCapabilityAlgebraInterface;
  readonly sourceModelBuilder: CompleteLaravelSourceModelBuilderInterface;
  readonly build: () => Promise<ManifestBuilderJudgment>;
}
/** Explicit upstream operation-preparation contract; composition injects this instead of importing a hidden builder directly. */
export interface ManifestBuilderOperationPreparationInterface {
  readonly kind: 'manifest_builder_operation_preparation';
  readonly contractVersion: 1;
  readonly prepare: (input: ManifestBuilderInput) => ManifestBuilderInterface;
}

