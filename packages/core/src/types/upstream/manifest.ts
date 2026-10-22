import type { CompleteSourceAst } from './ast';
import type { SourceFile } from './names';
import type { NumberValue } from './valueObjects';
import type { SourceSpan } from './provenance';
import type { CompleteLaravelSourceModel } from './highLevelSourceModel';
import type { LaravelSemanticContractCatalog } from './highLevelContracts';
import type { SemanticRelationGraph } from './semanticReferences';
import type { ManifestDataflowSeedSurface } from './semanticDataflowManifestSurface';
import type { ResourceGroupCapabilityContract } from './resourceGroupCapability';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';

export interface ManifestVersion {
  readonly kind: 'manifest_version';
  readonly major: NumberValue;
  readonly minor: NumberValue;
  readonly patch: NumberValue;
}

export interface ManifestSource {
  readonly kind: 'laravel_application';
  readonly root: SourceFile;
  readonly source: SourceSpan;
}

/**
 * Dumb manifest flow exposed downstream.
 *
 * The flow transports already-resolved upstream meaning, including the source-correlated
 * invocation judgment ADT and its integrated-response outcome. Consumers must not
 * inspect AST syntax or re-classify Laravel semantics from this boundary.
 * AST remains an upstream construction artifact carried only by the concrete
 * manifest implementation.
 */
export interface RouteSyncManifestFlow extends ManifestDataflowSeedSurface {
  readonly kind: 'route_sync_manifest_flow';
  readonly version: ManifestVersion;
  readonly source: ManifestSource;
  readonly contracts: LaravelSemanticContractCatalog;
  readonly relations: SemanticRelationGraph;
  /** Closed resource-group semantics produced upstream; wiring only transports it. */
  readonly resourceGroupCapabilities: readonly ResourceGroupCapabilityContract[];
  /** Source-correlated invocation judgments, including their exact integrated-response ADT outcomes. */
  readonly invocationSemanticJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];
}


/** Canonical validated manifest contract produced upstream. */
export interface RouteSyncManifest {
  readonly kind: 'route_sync_manifest';
  readonly version: ManifestVersion;
  readonly source: ManifestSource;
  readonly sourceModel: CompleteLaravelSourceModel;
  readonly dataflowInputs: RouteSyncManifestFlow['dataflowInputs'];
  readonly dataflowJudgments: RouteSyncManifestFlow['dataflowJudgments'];
  readonly dataflowQueryPolicyContracts: RouteSyncManifestFlow['dataflowQueryPolicyContracts'];
  /** Closed resource-group capability set composed before the downstream wiring boundary. */
  readonly resourceGroupCapabilities: readonly ResourceGroupCapabilityContract[];
  /** Exact authority-closed invocation judgments carried forward from the validated inventory receipt. */
  readonly invocationSemanticJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];
  readonly ast: CompleteSourceAst;
}

export interface ManifestAst {
  readonly kind: 'manifest_ast';
  readonly definition: RouteSyncManifest;
  readonly source: SourceSpan;
}

/**
 * Downstream-facing upstream boundary.
 *
 * The concrete RouteSyncManifest is intentionally not exposed here: it owns
 * CompleteSourceAst and therefore belongs to the construction side only.
 * Consumers receive only the semantic flow contract.
 */
export interface UpstreamBoundary {
  readonly kind: 'validated_manifest_flow';
  readonly flow: RouteSyncManifestFlow;
}

/**
 * Internal construction boundary retained for code that must explicitly own
 * the validated concrete manifest and its AST. It is not the downstream flow.
 */
export interface UpstreamManifestConstructionBoundary {
  readonly kind: 'validated_manifest';
  readonly manifest: RouteSyncManifest;
}
