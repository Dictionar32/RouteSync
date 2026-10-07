/** Production orchestration boundary for RouteSync manifest dataflow. */
import type { RouteSyncManifestDataflowSurface } from './routeSyncManifestDataflowProjectionInterface';
import type { SemanticDataflowAnalysisResult } from './semanticDataflowPipeline';
import { analyzeSemanticDataflowInput } from './semanticDataflowPipeline';
import type { SemanticDataflowRuntimeBoundary } from './semanticDataflowRuntimeBoundary';
import { semanticDataflowIdentityEqual } from '../../types/upstream/semanticDataflow';
import type { Sequence } from '../../types/upstream/collections';
import type { SemanticDataflowFactPolicyContext, SemanticDataflowAnalysisPolicy } from './dataflow/semanticDataflowFactAnalysisPolicy';
import { createSemanticDataflowAnalysisPolicy } from './dataflow/semanticDataflowFactAnalysisPolicy';

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, [...output, items.head]);

export interface RouteSyncControllerDataflowAnalysis {
  readonly controller: string;
  readonly action: string;
  readonly analysis: SemanticDataflowAnalysisResult;
}

export interface RouteSyncControllerDataflowPolicyAnalysis extends RouteSyncControllerDataflowAnalysis {
  readonly policy: SemanticDataflowAnalysisPolicy;
}

/**
 * Production compiler orchestration: consumes the scanner's canonical manifest
 * without making the scanner depend on analysis. The resulting interface is
 * intentionally returned to the caller as the downstream semantic contract.
 */
export const analyzeRouteSyncManifestDataflow = (
  manifest: RouteSyncManifestDataflowSurface,
  runtime: SemanticDataflowRuntimeBoundary,
): readonly RouteSyncControllerDataflowAnalysis[] => Object.freeze(
  manifest.controllers.map(controller => Object.freeze({
    controller: controller.controller,
    action: controller.action,
    analysis: analyzeSemanticDataflowInput(
      (() => {
        const input = sequenceToArray(manifest.dataflowInputs).find(
          candidate => semanticDataflowIdentityEqual(candidate.node, controller.dataflowNode),
        );
        if (!input) {
          throw new Error(`Missing canonical manifest dataflow input for controller action: ${controller.controller}.${controller.action}`);
        }
        return input;
      })(),
      runtime,
    ),
  })),
);

/**
 * Production query-policy boundary. The caller supplies the analysis meaning
 * of source and sink; this function only applies that policy to each already
 * closed semantic-dataflow result. It never changes semantic closure.
 */
export const analyzeRouteSyncManifestDataflowWithPolicy = (
  manifest: RouteSyncManifestDataflowSurface,
  runtime: SemanticDataflowRuntimeBoundary,
  context: SemanticDataflowFactPolicyContext,
): readonly RouteSyncControllerDataflowPolicyAnalysis[] => Object.freeze(
  analyzeRouteSyncManifestDataflow(manifest, runtime).map(result => Object.freeze({
    ...result,
    policy: createSemanticDataflowAnalysisPolicy(result.analysis.interface, context),
  })),
);
