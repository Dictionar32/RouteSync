import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { manifestBuilder } from '../wiring/upstreamManifestBuilder';
import { createLaravelSourceProjectIdentity } from '../../../types/upstream/sourceProjectIdentity';
import { createServiceGraphBuilder } from '../../graph/ServiceGraphBuilder';
import { isPolicySemanticRelation } from '../../../types/upstream/semanticReferences';
import type { SemanticRelation } from '../../../types/upstream/semanticReferences';
import type { Sequence } from '../../../types/upstream/collections';

const fixtureRoot = path.resolve(__dirname, '../../../../../../examples/ecommerce-shop-source');

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, [...output, items.head]);

describe('Phase 959 ecommerce production fixture end-to-end provenance', () => {
  test('consumes the canonical physical Laravel example through scanner, upstream semantic relations, and structural graph', async () => {
    const manifest = await manifestBuilder.build(createLaravelSourceProjectIdentity(fixtureRoot));
    const manifestFlow = Object.freeze({
      kind: 'route_sync_manifest_flow' as const,
      version: manifest.version,
      source: manifest.source,
      sourceModel: manifest.sourceModel,
      dataflowInputs: manifest.dataflowInputs,
    });
    const relations = sequenceToArray(manifest.sourceModel.relations.relations) as readonly SemanticRelation[];
    const policyRelations = relations.filter(isPolicySemanticRelation);
    const structuralRelations = relations.filter(relation => !isPolicySemanticRelation(relation));

    expect(manifest.sourceModel.kind).toBe('complete_laravel_source_model');
    expect(manifest.sourceModel.identity.root.value.value).toBe(fixtureRoot);
    expect(relations.length).toBeGreaterThan(0);
    expect(policyRelations.some(relation => relation.kind === 'controller_action_middleware_policy')).toBe(true);
    expect(policyRelations.some(relation => relation.kind === 'controller_action_authorization_policy')).toBe(true);
    expect(structuralRelations.some(relation => relation.kind === 'route_controller')).toBe(true);

    const graph = createServiceGraphBuilder().project(manifestFlow);
    expect(graph).toBeDefined();
    expect(graph.controllers.size).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
  });
});
