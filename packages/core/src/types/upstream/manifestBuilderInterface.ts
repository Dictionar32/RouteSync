import type { LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt } from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import type { RouteSyncManifest } from './manifest';
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

/** A successful manifest construction retains the complete canonical manifest. */
export interface ManifestBuilderCompleteJudgment {
  readonly kind: 'manifest_builder_complete';
  readonly manifest: RouteSyncManifest;
}

/** A blocked source-AST projection is preserved as its exact upstream judgment. */
export interface ManifestBuilderSourceAstBlockedJudgment {
  readonly kind: 'manifest_builder_blocked';
  readonly stage: 'source_ast';
  readonly sourceProject: SourceProjectIdentity;
  readonly projection: Exclude<LaravelSourceAstProjectionJudgment, { readonly kind: 'laravel_source_ast_projection_complete' }>;
}

/** A blocked source-model semantic judgment must prevent a complete manifest from being published. */
export interface ManifestBuilderSourceModelBlockedJudgment {
  readonly kind: 'manifest_builder_blocked';
  readonly stage: 'source_model';
  readonly sourceProject: SourceProjectIdentity;
  readonly sourceModel: CompleteSourceModelBuildBlockedResult;
}

export type ManifestBuilderBlockedJudgment =
  | ManifestBuilderSourceAstBlockedJudgment
  | ManifestBuilderSourceModelBlockedJudgment;

/** Closed outcome of manifest construction; blocked upstream evidence is data, not an exception. */
export type ManifestBuilderJudgment = ManifestBuilderCompleteJudgment | ManifestBuilderBlockedJudgment;

/** Canonical construction contract for the concrete upstream manifest. */
export interface ManifestBuilderInterface {
  readonly kind: 'manifest_builder';
  readonly closed: true;
  readonly contractVersion: 8;
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

