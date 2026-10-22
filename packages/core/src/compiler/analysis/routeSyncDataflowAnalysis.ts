/** Production orchestration boundary for RouteSync manifest dataflow. */
import type { RouteSyncManifestDataflowSurface } from './routeSyncManifestDataflowProjectionInterface';
import type { SemanticDataflowAnalysisResult } from './semanticDataflowPipeline';
import { projectClosedSemanticDataflowJudgment } from './semanticDataflowPipeline';
import type { SemanticDataflowRuntimeBoundary } from './semanticDataflowRuntimeBoundary';
import { semanticDataflowIdentityEqual } from '../../types/upstream/semanticDataflow';
import type { Sequence } from '../../types/upstream/collections';
import type { SemanticDataflowAnalysisPolicy } from './dataflow/semanticDataflowFactAnalysisPolicy';
import { semanticDataflowQueryPolicyMatches } from '../../types/upstream/semanticDataflowQueryPolicy';
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
 * Production orchestration consumes upstream-closed judgments. Runtime wiring
 * only projects them; it never receives raw inputs or invokes semantic closure.
 */
export const analyzeRouteSyncManifestDataflow = (
  manifest: RouteSyncManifestDataflowSurface,
  runtime: SemanticDataflowRuntimeBoundary,
): readonly RouteSyncControllerDataflowAnalysis[] => Object.freeze(
  manifest.controllers.map(controller => Object.freeze({
    controller: controller.controller,
    action: controller.action,
    analysis: projectClosedSemanticDataflowJudgment(
      (() => {
        const judgment = sequenceToArray(manifest.dataflowJudgments).find(
          candidate => semanticDataflowIdentityEqual(candidate.node, controller.dataflowNode),
        );
        if (!judgment) {
          throw new Error(`Missing upstream-closed dataflow judgment for controller action: ${controller.controller}.${controller.action}`);
        }
        return judgment;
      })(),
      runtime,
    ),
  })),
);

/**
 * Runtime query boundary. Upstream must materialize source/sink policy contracts
 * before calling this function. Missing or mismatched contracts fail closed;
 * Runtime never classifies producer domains or reconstructs the policy.
 */
export const analyzeRouteSyncManifestDataflowWithPolicy = (
  manifest: RouteSyncManifestDataflowSurface,
  runtime: SemanticDataflowRuntimeBoundary,
  contracts: readonly unknown[] = manifest.dataflowQueryPolicyContracts,
): readonly RouteSyncControllerDataflowPolicyAnalysis[] => Object.freeze(
  analyzeRouteSyncManifestDataflow(manifest, runtime).map(result => {
    const matchingContracts = contracts.filter(candidate => semanticDataflowQueryPolicyMatches(candidate, result.analysis.input));
    if (matchingContracts.length > 1) {
      throw new Error(`Ambiguous upstream query-policy contracts for controller action: ${result.controller}.${result.action}`);
    }
    const contract = matchingContracts[0];
    if (!contract) {
      throw new Error(`Missing upstream query-policy contract for controller action: ${result.controller}.${result.action}`);
    }
    return Object.freeze({
      ...result,
      policy: createSemanticDataflowAnalysisPolicy(result.analysis.interface, contract),
    });
  }),
);
