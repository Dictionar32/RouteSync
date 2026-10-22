import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { manifestBuilderOperationPreparation } from '../../scanner/wiring/upstreamManifestBuilder';
import { routeSyncManifestFlowProjection } from '../../scanner/orchestrator/upstreamManifestScanner';
import { routeSyncManifestDataflowSurfaceFromFlow } from '../routeSyncManifestDataflowProjection';
import { createLaravelSourceProjectIdentity } from '../../../types/upstream/sourceProjectIdentity';
import {
  analyzeRouteSyncManifestDataflowWithPolicy,
} from '../routeSyncDataflowAnalysis';
import { semanticDataflowFlowsUnderPolicy } from '../dataflow/semanticDataflowFactAnalysisPolicy';
import { semanticDataflowRuntimeBoundary } from '../semanticDataflowRuntimeComposition';
import type { SemanticDataflowFact } from '../../../types/upstream/semanticDataflow';
import { createNotConnectedControllerInventoryReceipt } from '../../scanner/__test__/createNotConnectedControllerInventoryReceipt';

const fixtureRoot = path.resolve(__dirname, '../../../../../../examples/ecommerce-shop-source');

describe('Phase 1029 ecommerce fact-scoped analysis policy', () => {
  test('consumes the production policy boundary with route source and resource sink lineage', async () => {
    const sourceProject = createLaravelSourceProjectIdentity(fixtureRoot, {
      kind: 'semantic_dataflow_query_policy_intent',
      sourceProducers: ['route'],
      sinkProducers: ['resource'],
      closed: true,
    });
    const receipt = await createNotConnectedControllerInventoryReceipt(sourceProject);
    const manifestJudgment = await manifestBuilderOperationPreparation.prepare({ kind: 'manifest_builder_input', invocationInventoryReceipt: receipt, routeSelection: { kind: 'laravel_route_source_selection_default' } }).build();
    if (manifestJudgment.kind !== 'manifest_builder_complete') throw new Error(`Fixture manifest blocked: ${manifestJudgment.projection.kind}`);
    const manifest = manifestJudgment.manifest;
    const dataflowSurface = routeSyncManifestDataflowSurfaceFromFlow(routeSyncManifestFlowProjection.project(manifest));
    const results = analyzeRouteSyncManifestDataflowWithPolicy(dataflowSurface, semanticDataflowRuntimeBoundary);

    const nonEmpty = results.filter(result => result.analysis.input.facts.length > 0);
    const sourceFacts = nonEmpty.flatMap(result => result.policy.sourceFacts);
    const sinkFacts = nonEmpty.flatMap(result => result.policy.sinkFacts);
    const sourceIdentities = sourceFacts.flatMap(fact => fact.kind === 'reaches' || fact.lineage === undefined ? [] : [fact.lineage.identity]);
    const sinkIdentities = sinkFacts.flatMap(fact => fact.kind === 'reaches' || fact.lineage === undefined ? [] : [fact.lineage.identity]);

    expect(nonEmpty.length).toBeGreaterThan(0);
    expect(sourceFacts.length).toBeGreaterThan(0);
    expect(sinkFacts.length).toBeGreaterThan(0);
    expect(sourceFacts.every(fact => (fact as SemanticDataflowFact).kind !== 'reaches' && fact.lineage?.producer === 'route')).toBe(true);
    expect(sinkFacts.every(fact => (fact as SemanticDataflowFact).kind !== 'reaches' && fact.lineage?.producer === 'resource')).toBe(true);

    const provenFlow = nonEmpty.some(result =>
      sourceIdentities.some(source => sinkIdentities.some(target =>
        semanticDataflowFlowsUnderPolicy(result.analysis.interface, result.policy, source, target),
      )),
    );

    expect(provenFlow).toBe(true);
  });

  test('does not change the canonical fixed-point judgment when policy is applied', async () => {
    const sourceProject = createLaravelSourceProjectIdentity(fixtureRoot, {
      kind: 'semantic_dataflow_query_policy_intent',
      sourceProducers: ['route'],
      sinkProducers: ['resource'],
      closed: true,
    });
    const receipt = await createNotConnectedControllerInventoryReceipt(sourceProject);
    const manifestJudgment = await manifestBuilderOperationPreparation.prepare({ kind: 'manifest_builder_input', invocationInventoryReceipt: receipt, routeSelection: { kind: 'laravel_route_source_selection_default' } }).build();
    if (manifestJudgment.kind !== 'manifest_builder_complete') throw new Error(`Fixture manifest blocked: ${manifestJudgment.projection.kind}`);
    const manifest = manifestJudgment.manifest;
    const dataflowSurface = routeSyncManifestDataflowSurfaceFromFlow(routeSyncManifestFlowProjection.project(manifest));
    const results = analyzeRouteSyncManifestDataflowWithPolicy(dataflowSurface, semanticDataflowRuntimeBoundary);

    expect(results.every(result => result.analysis.interface.closed)).toBe(true);
    expect(results.every(result => result.analysis.interface.state.fixedPoint === 'least_fixed_point')).toBe(true);
    expect(results.every(result => result.policy.config.isAdditionalFlowStep({} as never, {} as never) === false)).toBe(true);
    expect(results.every(result => result.policy.config.isBarrier({} as never) === false)).toBe(true);
  });
});
