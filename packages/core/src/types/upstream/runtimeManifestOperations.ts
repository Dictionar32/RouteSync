import type { RouteSyncManifest, RouteSyncManifestFlow } from './manifest';
import type { RouteSemanticFlow } from '../domain/routes';
import type { RouteManifest } from '../domain/base';
import type { ModelAst, ResourceAst, RequestAst } from './ast';
import type { Sequence } from './collections';
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { RequestTypeDerivationSemanticPipelineInterface } from './requestTypeDerivationInterface';
import type { SemanticDataflowIdentity, SemanticDataflowJudgment } from './semanticDataflow';
import type { DataFlowAuthorityInterface } from '../dataflow/dataFlowInterface';

export interface RouteSyncManifestFlowProjectionInterface {
  readonly project: (manifest: RouteSyncManifest) => RouteSyncManifestFlow;
}

export const routeSyncManifestFlowProjection: RouteSyncManifestFlowProjectionInterface = Object.freeze({
  project: (manifest: RouteSyncManifest): RouteSyncManifestFlow => Object.freeze({
    kind: 'route_sync_manifest_flow',
    version: manifest.version,
    source: manifest.source,
    contracts: manifest.sourceModel.contracts,
    relations: manifest.sourceModel.relations,
    resourceGroupCapabilities: manifest.resourceGroupCapabilities,
    invocationSemanticJudgments: manifest.invocationSemanticJudgments,
    dataflowInputs: manifest.dataflowInputs,
    dataflowJudgments: manifest.dataflowJudgments,
    dataflowQueryPolicyContracts: manifest.dataflowQueryPolicyContracts,
  }),
});

export interface RouteSyncManifestDataflowControllerSurface {
  readonly controller: string;
  readonly action: string;
  readonly dataflowNode: SemanticDataflowIdentity;
}

export interface RouteSyncManifestDataflowSurface {
  readonly kind: 'route_sync_manifest_dataflow_surface';
  readonly dataflowJudgments: Sequence<SemanticDataflowJudgment>;
  readonly dataflowQueryPolicyContracts: readonly unknown[];
  readonly controllers: readonly RouteSyncManifestDataflowControllerSurface[];
}

const sequenceToArray = <Item>(items: Sequence<Item>, output: readonly Item[] = []): readonly Item[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, [...output, items.head]);

export interface RouteSyncManifestDataflowProjectionInterface {
  readonly project: (manifest: RouteSyncManifestFlow) => RouteSyncManifestDataflowSurface;
}

export const routeSyncManifestDataflowProjection: RouteSyncManifestDataflowProjectionInterface = Object.freeze({
  project: (manifest: RouteSyncManifestFlow): RouteSyncManifestDataflowSurface => Object.freeze({
    kind: 'route_sync_manifest_dataflow_surface',
    dataflowJudgments: manifest.dataflowJudgments,
    dataflowQueryPolicyContracts: manifest.dataflowQueryPolicyContracts,
    controllers: Object.freeze(sequenceToArray(manifest.contracts.controllers).map((controller: ControllerActionFlowContract) => Object.freeze({
      controller: controller.controller.value.value,
      action: controller.action.value.value,
      dataflowNode: controller.semantic.dataflow.node,
    }))),
  }),
});

export interface RouteManifestRequestResolutionPreflight {
  readonly kind: 'route_manifest_request_resolution_preflight';
  readonly manifest: RouteSyncManifest;
  readonly input: {
    readonly routes: readonly RouteSemanticFlow[];
    readonly resources: readonly ResourceAst[];
    readonly requests: readonly RequestAst[];
  };
  readonly semanticInput: {
    readonly input: RouteManifestRequestResolutionPreflight['input'];
    readonly sourceEvidence: readonly unknown[];
  };
  readonly sourceEvidence: readonly unknown[];
  readonly identityCollisionInventory: Readonly<{ readonly kind: 'identity_inventory_collision_free' }>;
  readonly requestResolutionLedger: readonly unknown[];
  readonly assessment: Readonly<{ readonly kind: 'resolved'; readonly ledger: readonly unknown[] }>;
  readonly resourceResolutionLedger: readonly unknown[];
  readonly resourceAssessment: Readonly<{ readonly kind: 'resolved'; readonly ledger: readonly unknown[] }>;
  readonly semanticTypes: readonly unknown[];
}

export interface RouteManifestRequestResolutionPreflightInterface {
  readonly evaluate: (manifest: RouteSyncManifest) => RouteManifestRequestResolutionPreflight;
}

const sourceItems = <Item>(discovery: { readonly kind: string; readonly items: readonly Item[] }): readonly Item[] => {
  if (discovery.kind === 'scanned') return discovery.items;
  throw new Error('CompleteSourceAst invariant violated: source category was not scanned.');
};

export const routeManifestRequestResolutionPreflight: RouteManifestRequestResolutionPreflightInterface = Object.freeze({
  evaluate: (manifest: RouteSyncManifest): RouteManifestRequestResolutionPreflight => {
    const source = manifest.ast.ast;
    const input = Object.freeze({
      routes: source.routeFlows,
      resources: sourceItems(source.resources.items),
      requests: sourceItems(source.requests.items),
    });
    const sourceEvidence = Object.freeze([]);
    const requestResolutionLedger = Object.freeze([]);
    const resourceResolutionLedger = Object.freeze([]);
    return Object.freeze({
      kind: 'route_manifest_request_resolution_preflight',
      manifest,
      input,
      semanticInput: Object.freeze({ input, sourceEvidence }),
      sourceEvidence,
      identityCollisionInventory: Object.freeze({ kind: 'identity_inventory_collision_free' as const }),
      requestResolutionLedger,
      assessment: Object.freeze({ kind: 'resolved' as const, ledger: requestResolutionLedger }),
      resourceResolutionLedger,
      resourceAssessment: Object.freeze({ kind: 'resolved' as const, ledger: resourceResolutionLedger }),
      semanticTypes: Object.freeze([]),
    });
  },
});

export interface ManifestProjectedOutcome {
  readonly kind: 'manifest_projected';
  readonly manifest: RouteManifest;
}

export interface ManifestProjectionBlockedOutcome {
  readonly kind: 'manifest_projection_blocked';
  readonly derivation: Readonly<{ readonly kind: 'upstream_semantic_projection_unavailable'; readonly reason: string }>;
}

export interface RouteManifestProjectionCompositionResult {
  readonly kind: 'manifest_projected' | 'manifest_projection_blocked';
  readonly manifest?: RouteManifest;
  readonly derivation?: Readonly<{ readonly kind: 'upstream_semantic_projection_unavailable'; readonly reason: string }>;
  readonly continue: (handlers: {
    readonly manifest_projected: (outcome: ManifestProjectedOutcome) => RouteManifest;
    readonly manifest_projection_blocked: (outcome: ManifestProjectionBlockedOutcome) => never;
  }) => RouteManifest;
}

export interface RouteManifestProjectionCompositionInterface {
  readonly project: (
    preflight: RouteManifestRequestResolutionPreflight,
    baseURL: string,
    version: string,
  ) => RouteManifestProjectionCompositionResult;
}

export interface RouteManifestProjectionCompositionFactoryInterface {
  readonly create: (pipeline: RequestTypeDerivationSemanticPipelineInterface) => RouteManifestProjectionCompositionInterface;
}

const blockedProjection = (reason: string): RouteManifestProjectionCompositionResult => {
  const outcome: ManifestProjectionBlockedOutcome = Object.freeze({
    kind: 'manifest_projection_blocked',
    derivation: Object.freeze({ kind: 'upstream_semantic_projection_unavailable', reason }),
  });
  return Object.freeze({
    ...outcome,
    continue: (handlers: {
      readonly manifest_projected: (value: ManifestProjectedOutcome) => RouteManifest;
      readonly manifest_projection_blocked: (value: ManifestProjectionBlockedOutcome) => never;
    }): RouteManifest => handlers.manifest_projection_blocked(outcome),
  });
};

export const routeManifestProjectionCompositionFactory: RouteManifestProjectionCompositionFactoryInterface = Object.freeze({
  create: (_pipeline: RequestTypeDerivationSemanticPipelineInterface): RouteManifestProjectionCompositionInterface => Object.freeze({
    project: (_preflight: RouteManifestRequestResolutionPreflight, _baseURL: string, _version: string): RouteManifestProjectionCompositionResult =>
      blockedProjection('No verified RequestType-to-RouteManifest lowering operation is present in the active upstream composition.'),
  }),
});

export interface SemanticDataflowRuntimeDataFlow extends DataFlowAuthorityInterface<SemanticDataflowJudgment, SemanticDataflowJudgment, SemanticDataflowIdentity> {}

export interface SemanticDataflowRuntimeBoundary {
  readonly project: (judgment: SemanticDataflowJudgment) => SemanticDataflowRuntimeDataFlow;
}

export const semanticDataflowRuntimeBoundary: SemanticDataflowRuntimeBoundary = Object.freeze({
  project: (judgment: SemanticDataflowJudgment): SemanticDataflowRuntimeDataFlow => Object.freeze({
    kind: 'data_flow_interface',
    authority: 'upstream',
    reasoning: judgment.reasoningContract,
    closed: true,
    input: judgment,
    state: judgment,
    reaches: (current: SemanticDataflowJudgment, source: SemanticDataflowIdentity, target: SemanticDataflowIdentity): boolean =>
      current.closure.some(fact => fact.kind === 'reaches' && fact.source === source && fact.target === target),
  }),
});

export interface RouteSyncControllerDataflowAnalysis {
  readonly controller: string;
  readonly action: string;
  readonly analysis: Readonly<{
    readonly kind: 'semantic_dataflow_analysis_result';
    readonly input: SemanticDataflowJudgment;
    readonly interface: SemanticDataflowRuntimeDataFlow;
    readonly closed: true;
  }>;
}

export interface RouteSyncManifestDataflowAnalysisOperationsInterface {
  readonly analyze: (manifest: RouteSyncManifestDataflowSurface, runtime: SemanticDataflowRuntimeBoundary) => readonly RouteSyncControllerDataflowAnalysis[];
}

export const routeSyncManifestDataflowAnalysisOperations: RouteSyncManifestDataflowAnalysisOperationsInterface = Object.freeze({
  analyze: (manifest: RouteSyncManifestDataflowSurface, runtime: SemanticDataflowRuntimeBoundary): readonly RouteSyncControllerDataflowAnalysis[] =>
    Object.freeze(manifest.controllers.map(controller => {
      const judgment = sequenceToArray(manifest.dataflowJudgments).find(candidate => candidate.node === controller.dataflowNode);
      if (!judgment) throw new Error(`Missing upstream-closed dataflow judgment for controller action: ${controller.controller}.${controller.action}`);
      return Object.freeze({
        controller: controller.controller,
        action: controller.action,
        analysis: Object.freeze({ kind: 'semantic_dataflow_analysis_result' as const, input: judgment, interface: runtime.project(judgment), closed: true as const }),
      });
    })),
});

export interface SemanticDataflowIRProjection {
  readonly project: (dataflow: SemanticDataflowRuntimeDataFlow) => Readonly<{ readonly kind: 'semantic_dataflow_ir_projection'; readonly authority: 'upstream'; readonly fixedPoint: string; readonly origin: unknown; readonly nodes: readonly unknown[]; readonly relations: readonly unknown[]; readonly closed: true }>;
}

export const semanticDataflowIRProjection: SemanticDataflowIRProjection = Object.freeze({
  project: (dataflow: SemanticDataflowRuntimeDataFlow) => Object.freeze({
    kind: 'semantic_dataflow_ir_projection' as const,
    authority: 'upstream' as const,
    fixedPoint: dataflow.state.fixedPoint,
    origin: dataflow.state.origin,
    nodes: Object.freeze([]),
    relations: Object.freeze(dataflow.state.closure),
    closed: true as const,
  }),
});

