import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { manifestBuilderOperationPreparation } from '../wiring/upstreamManifestBuilder';
import { routeSyncManifestFlowProjection } from '../orchestrator/upstreamManifestScanner';
import { createLaravelSourceProjectIdentity } from '../../../types/upstream/sourceProjectIdentity';
import { createNotConnectedControllerInventoryReceipt } from './createNotConnectedControllerInventoryReceipt';
import { createServiceGraphBuilder } from '../../graph/ServiceGraphBuilder';
import type { SemanticRelation } from '../../../types/upstream/semanticReferences';
import { modelSemanticRelationIdentityKey } from '../../../types/upstream/model';
import type { Sequence } from '../../../types/upstream/collections';

const fixtureRoot = path.resolve(__dirname, '../../../../../../examples/ecommerce-shop-source');
const migrationFile = '2026_02_09_084356_create_order_details_table.php';

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, [...output, items.head]);

const modelName = (reference: { readonly kind: string; readonly name: { readonly value: { readonly value: string } } }): string =>
  reference.name.value.value;

describe('Phase 992 ecommerce final graph provenance', () => {
  test('build operation remains valid when its method is detached from the operation receiver', async () => {
    const sourceProject = createLaravelSourceProjectIdentity(fixtureRoot);
    const receipt = await createNotConnectedControllerInventoryReceipt(sourceProject);
    const operation = manifestBuilderOperationPreparation.prepare({
      kind: 'manifest_builder_input',
      invocationInventoryReceipt: receipt,
      routeSelection: { kind: 'laravel_route_source_selection_default' },
    });
    const build = operation.build;
    const judgment = await build();

    expect(judgment.kind).toBe('manifest_builder_complete');
  });

  test('retains OrderDetail -> Order model relation and migration lineage in ServiceGraph.edgeRelations', async () => {
    const sourceProject = createLaravelSourceProjectIdentity(fixtureRoot);
    const receipt = await createNotConnectedControllerInventoryReceipt(sourceProject);
    const manifestJudgment = await manifestBuilderOperationPreparation.prepare({ kind: 'manifest_builder_input', invocationInventoryReceipt: receipt, routeSelection: { kind: 'laravel_route_source_selection_default' } }).build();
    if (manifestJudgment.kind !== 'manifest_builder_complete') throw new Error(`Fixture manifest blocked: ${manifestJudgment.projection.kind}`);
    const manifest = manifestJudgment.manifest;
    const manifestFlow = routeSyncManifestFlowProjection.project(manifest);
    // The interface-backed projection object is the canonical implementation used by runtime scanner operations.
    expect(routeSyncManifestFlowProjection.project(manifest)).toEqual(manifestFlow);
    const sourceRelations = sequenceToArray(manifestFlow.relations.relations) as readonly SemanticRelation[];
    const modelRelation = sourceRelations.find(
      (relation): relation is Extract<SemanticRelation, { readonly kind: 'model_relation' }> =>
        relation.kind === 'model_relation'
        && modelName(relation.model) === 'OrderDetail'
        && modelName(relation.target) === 'Order',
    );

    expect(modelRelation).toBeDefined();
    expect(modelRelation?.relation.identity.kind).toBe('model_semantic_relation_identity');
    expect(modelRelation ? modelSemanticRelationIdentityKey(modelRelation.relation.identity) : '').toContain('OrderDetail');
    expect(modelRelation?.relation.provenance).toBeDefined();

    const graph = createServiceGraphBuilder().project(manifestFlow);
    const edge = graph.edgeRelations.find(
      relation =>
        modelName(relation.from) === 'OrderDetail'
        && modelName(relation.to) === 'Order'
        && relation.origin === 'model_relation',
    );

    expect(edge).toBeDefined();
    expect(edge?.kind).toBe('graph_edge_relation');
    expect(edge?.provenance?.kind).toBe('model_relation');
    expect(edge?.provenance?.relation).toBe(modelRelation?.relation);
    expect(edge?.provenance?.lineage?.schema.migrationProvenance.some(
      provenance => provenance.source.file.value.value.endsWith(migrationFile),
    )).toBe(true);
    expect(graph.edges.some(
      relation => modelName(relation.from) === 'OrderDetail' && modelName(relation.to) === 'Order',
    )).toBe(true);
  });
});
