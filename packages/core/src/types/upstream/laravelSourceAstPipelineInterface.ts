import type { CompleteSourceAst, SourceAsts } from './ast';
import type { IncompleteUpstream } from './completeness';
import type { LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt } from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import type { LaravelRouteSourceSelectionIntent } from './laravelRouteSourceSelection';
import type { LaravelResponseScannerInterface } from './laravelResponseScannerInterface';
import type { LaravelControllerScannerInterface } from './laravelControllerScannerInterface';
import type { LaravelResourceScannerInterface, LaravelResourceSourceEvidence, ResourceSourceEvidenceScannerInterface } from './laravelResourceScannerInterface';
import type { LaravelRouteScannerInterface, LaravelRouteScanSourceReadBlockedJudgment } from './laravelRouteScannerInterface';
import type { LaravelModelScannerInterface } from './laravelModelScannerInterface';
import type { LaravelFormRequestScannerInterface } from './laravelFormRequestScannerInterface';
import type { SchemaProducer } from './schema';
import type { SourceAstSemanticProducerInterface } from './sourceAstSemanticProducerInterface';
import type { LaravelMigrationScannerInterface } from './laravelMigrationScannerInterface';
import type { LaravelAttributeScanBlockedJudgment } from './laravelAttributeScannerInterface';
import type { LaravelAttributeScannerInterface } from './laravelAttributeScannerInterface';
import type { LaravelDtoDeclarationInventoryScannerInterface } from './laravelDtoDeclarationInventoryScannerInterface';
import type { LaravelQueryProducerInterface } from './laravelQueryProducerInterface';
import type { LaravelServiceScannerInterface } from './laravelServiceScannerInterface';
import type { LaravelMiddlewareScannerInterface } from './laravelMiddlewareScannerInterface';
import type { LaravelProviderScannerInterface } from './laravelProviderScannerInterface';
import type { ManifestBuilderJudgment } from './manifestBuilderInterface';

/**
 * Outcome-indexed response of the existing Laravel source-AST pipeline.
 *
 * A plain SourceAsts value is not proof that every required source category was
 * scanned. The complete arm therefore requires the existing CompleteSourceAst
 * proof; the completeness-blocked arm retains partial AST products and the typed
 * completeness judgment, while an attribute-resolution blocker is preserved as
 * its own upstream judgment before later AST stages execute. The canonical invocation inventory stays bound
 * to either outcome and is never reconstructed from projected controller ASTs.
 * The authority-closed controller invocation inventory also retains each exact
 * invocation judgment and its integrated response after AST projection; AST
 * projection is not permitted to reconstruct or normalize those outcomes. The
 * source-AST aggregate also retains the exact per-method response projection
 * judgments, including the enriched method product and its DTO provenance, so
 * CLI consumers do not have to reconstruct those links from ResponseAst values.
 */
export type LaravelSourceAstProjectionJudgmentData<
  Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt = LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
> =
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_complete';
      /** The AST must retain the exact receipt subtype admitted at the interface boundary. */
      readonly completion: CompleteSourceAst & {
        readonly ast: SourceAsts & { readonly controllerInvocationSemanticInventory: Receipt };
      };
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_blocked';
      /** Partial AST products preserve the same source-correlated invocation inventory. */
      readonly partial: SourceAsts & { readonly controllerInvocationSemanticInventory: Receipt };
      readonly completeness: IncompleteUpstream;
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_attribute_scan_blocked';
      readonly sourceProject: import('./highLevelSourceModel').SourceProjectIdentity;
      readonly invocationInventoryReceipt: Receipt;
      /** Preserve the exact upstream scan blocker; no partial AST or empty inventory is published. */
      readonly scan: LaravelAttributeScanBlockedJudgment;
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_dto_declaration_inventory_blocked';
      readonly sourceProject: import('./highLevelSourceModel').SourceProjectIdentity;
      readonly invocationInventoryReceipt: Receipt;
      /** Preserve the exact DTO discovery blocker; downstream scanners must not execute on an incomplete inventory. */
      readonly scan: Extract<import('./laravelControllerResponseDtoDeclarationInterface').LaravelProjectDtoDeclarationInventoryInterface, { readonly kind: 'laravel_project_dto_declaration_inventory_incomplete' }>;
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_resource_scan_blocked';
      readonly sourceProject: import('./highLevelSourceModel').SourceProjectIdentity;
      readonly invocationInventoryReceipt: Receipt;
      /** Preserve unresolved/ambiguous resource bindings; do not project a falsely complete AST. */
      readonly scan: Extract<import('./laravelResourceScannerInterface').LaravelResourceScanJudgment, { readonly kind: 'laravel_resource_scan_blocked' }>;
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_route_scan_blocked';
      readonly sourceProject: import('./highLevelSourceModel').SourceProjectIdentity;
      readonly invocationInventoryReceipt: Receipt;
      /** Explicitly selected missing files stop route projection; preserve the exact scan judgment. */
      readonly scan: import('./laravelRouteScannerInterface').LaravelRouteScanBlockedJudgment;
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_route_source_read_blocked';
      readonly sourceProject: import('./highLevelSourceModel').SourceProjectIdentity;
      readonly invocationInventoryReceipt: Receipt;
      /** Preserve read blockers and partial source-read evidence; no empty route AST is emitted. */
      readonly scan: LaravelRouteScanSourceReadBlockedJudgment;
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_route_policy_blocked';
      readonly sourceProject: import('./highLevelSourceModel').SourceProjectIdentity;
      readonly invocationInventoryReceipt: Receipt;
      /** Preserve the exact blocked policies and complete route evidence. */
      readonly scan: import('./laravelRouteScannerInterface').LaravelRouteScanPolicyBlockedJudgment;
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_route_response_blocked';
      readonly sourceProject: import('./highLevelSourceModel').SourceProjectIdentity;
      readonly invocationInventoryReceipt: Receipt;
      /** An unresolved response is not normalized to void and cannot produce a complete manifest. */
      readonly scan: import('./laravelRouteScannerInterface').LaravelRouteScanResponseBlockedJudgment;
    }>
  | Readonly<{
      readonly kind: 'laravel_source_ast_projection_controller_scan_blocked';
      readonly sourceProject: import('./highLevelSourceModel').SourceProjectIdentity;
      readonly invocationInventoryReceipt: Receipt;
      /** Controller declaration/constructor blockers stop all downstream AST projections. */
      readonly scan: Exclude<import('./laravelControllerScannerInterface').LaravelControllerScanJudgment, { readonly kind: 'laravel_controller_scan_complete' }>;
    }>;

export type LaravelSourceAstProjectionCompleteJudgment<
  Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt = LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
> = Extract<LaravelSourceAstProjectionJudgmentData<Receipt>, { readonly kind: 'laravel_source_ast_projection_complete' }>;

export type LaravelSourceAstProjectionBlockedJudgment<
  Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt = LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
> = Exclude<LaravelSourceAstProjectionJudgmentData<Receipt>, { readonly kind: 'laravel_source_ast_projection_complete' }>;

/** The terminal result itself owns the next domain action. */
/**
 * The AST projection has one domain-owned consumer in this pipeline: manifest
 * construction. Both terminal arms therefore return the existing manifest
 * judgment instead of allowing callers to invent an arbitrary generic result.
 */
export interface LaravelSourceAstProjectionManifestBuildContinuationInterface<
  Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
> {
  readonly onComplete: (judgment: LaravelSourceAstProjectionCompleteJudgment<Receipt>) => Promise<ManifestBuilderJudgment>;
  readonly onBlocked: (judgment: LaravelSourceAstProjectionBlockedJudgment<Receipt>) => Promise<ManifestBuilderJudgment>;
}

export type LaravelSourceAstProjectionJudgment<
  Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt = LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
> = LaravelSourceAstProjectionJudgmentData<Receipt> & Readonly<{
  readonly continueToManifestBuild: (
    continuation: LaravelSourceAstProjectionManifestBuildContinuationInterface<Receipt>,
  ) => Promise<ManifestBuilderJudgment>;
}>;

/** Producer-side constructors bind the operation to the exact source-AST terminal. */
export interface LaravelSourceAstProjectionOperationsInterface {
  readonly complete: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(
    judgment: LaravelSourceAstProjectionCompleteJudgment<Receipt>,
  ) => LaravelSourceAstProjectionJudgment<Receipt>;
  readonly blocked: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(
    judgment: LaravelSourceAstProjectionBlockedJudgment<Receipt>,
  ) => LaravelSourceAstProjectionJudgment<Receipt>;
}

export const laravelSourceAstProjectionOperations: LaravelSourceAstProjectionOperationsInterface = Object.freeze({
  complete: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(
    judgment: LaravelSourceAstProjectionCompleteJudgment<Receipt>,
  ): LaravelSourceAstProjectionJudgment<Receipt> => Object.freeze({
    ...judgment,
    continueToManifestBuild: (
      continuation: LaravelSourceAstProjectionManifestBuildContinuationInterface<Receipt>,
    ): Promise<ManifestBuilderJudgment> => continuation.onComplete(judgment),
  }),
  blocked: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(
    judgment: LaravelSourceAstProjectionBlockedJudgment<Receipt>,
  ): LaravelSourceAstProjectionJudgment<Receipt> => Object.freeze({
    ...judgment,
    continueToManifestBuild: (
      continuation: LaravelSourceAstProjectionManifestBuildContinuationInterface<Receipt>,
    ): Promise<ManifestBuilderJudgment> => continuation.onBlocked(judgment),
  }),
});


/** Complete runtime-executor input: receipt and route-selection intent are never split across optional arguments. */
export interface LaravelSourceAstPipelineExecutionInput<Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt = LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt> {
  readonly kind: 'laravel_source_ast_pipeline_execution_input';
  readonly invocationInventoryReceipt: Receipt;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
}

/** Dependency closure selected by the source-AST pipeline composition root. */
export interface LaravelSourceAstPipelineDependenciesInterface<Evidence extends LaravelResourceSourceEvidence<object, object> = LaravelResourceSourceEvidence<object, object>> {
  readonly migrationScanner: LaravelMigrationScannerInterface;
  readonly attributeScanner: LaravelAttributeScannerInterface;
  readonly dtoDeclarationInventoryScanner: LaravelDtoDeclarationInventoryScannerInterface;
  readonly queryProducer: LaravelQueryProducerInterface;
  readonly serviceScanner: LaravelServiceScannerInterface;
  readonly middlewareScanner: LaravelMiddlewareScannerInterface;
  readonly providerScanner: LaravelProviderScannerInterface;
  readonly modelScanner: LaravelModelScannerInterface;
  readonly formRequestScanner: LaravelFormRequestScannerInterface;
  readonly schemaProducer: SchemaProducer;
  readonly sourceAstSemanticProducer: SourceAstSemanticProducerInterface;
  readonly controllerScanner: LaravelControllerScannerInterface;
  readonly resourceEvidenceScanner: ResourceSourceEvidenceScannerInterface<Evidence>;
  readonly resourceScanner: LaravelResourceScannerInterface<Evidence>;
  readonly responseScanner: LaravelResponseScannerInterface;
  readonly routeScanner: LaravelRouteScannerInterface;
}

/** Closed wiring contract for acquiring Laravel source AST products. */
export interface LaravelSourceAstPipelineInterface<
  Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt = LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt,
  Evidence extends LaravelResourceSourceEvidence<object, object> = LaravelResourceSourceEvidence<object, object>,
> {
  readonly kind: 'laravel_source_ast_pipeline';
  readonly closed: true;
  readonly contractVersion: 20;
  /** Exact source receipt and selection intent are explicit operation data. */
  readonly input: LaravelSourceAstPipelineExecutionInput<Receipt>;
  /** Exact producer/scanner authorities used by the operation are visible in the contract. */
  readonly dependencies: LaravelSourceAstPipelineDependenciesInterface<Evidence>;
  /** Executes the already-prepared source-AST operation; no runtime arguments are accepted. */
  readonly execute: () => Promise<LaravelSourceAstProjectionJudgment<Receipt>>;
}
