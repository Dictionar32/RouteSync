import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { manifestBuilder } from '../wiring/upstreamManifestBuilder';
import { routeSyncManifestFlowFromManifest } from '../orchestrator/upstreamManifestScanner';
import { createLaravelSourceProjectIdentity } from '../../../types/upstream/sourceProjectIdentity';
import type { SemanticRelation } from '../../../types/upstream/semanticReferences';
import type { Sequence } from '../../../types/upstream/collections';

const fixtureRoot = path.resolve(__dirname, '../../../../../../examples/ecommerce-shop-source');

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, [...output, items.head]);

const modelName = (reference: { readonly name: { readonly value: { readonly value: string } } }): string =>
  reference.name.value.value;

type ModelRelation = Extract<SemanticRelation, { readonly kind: 'model_relation' }>;

const findRelation = (
  relations: readonly SemanticRelation[],
  source: string,
  target: string,
  property: string,
): ModelRelation | undefined => relations.find(
  (relation): relation is ModelRelation =>
    relation.kind === 'model_relation'
    && modelName(relation.model) === source
    && modelName(relation.target) === target
    && relation.relation.property.value.value === property,
);

describe('Phase 1007 ecommerce direct relation-family closure', () => {
  test('keeps belongsTo, hasMany, and hasOne on the canonical reconciled relation lane', async () => {
    const manifest = await manifestBuilder.build(createLaravelSourceProjectIdentity(fixtureRoot));
    const manifestFlow = routeSyncManifestFlowFromManifest(manifest);
    const relations = sequenceToArray(manifestFlow.relations.relations) as readonly SemanticRelation[];

    const belongsTo = findRelation(relations, 'OrderDetail', 'Order', 'order');
    const hasMany = findRelation(relations, 'Order', 'OrderDetail', 'details');
    const hasOne = findRelation(relations, 'Order', 'Payment', 'payment');

    expect(belongsTo?.relation.eloquentType.kind).toBe('belongs_to');
    expect(hasMany?.relation.eloquentType.kind).toBe('has_many');
    expect(hasOne?.relation.eloquentType.kind).toBe('has_one');

    for (const relation of [belongsTo, hasMany, hasOne]) {
      expect(relation).toBeDefined();
      expect(relation?.relation.foreignKey.kind).toBe('explicit');
      expect(relation?.relation.provenance?.kind).toBe('model_relation_provenance');
    }
  });
});
