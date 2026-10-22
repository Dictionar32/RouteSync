import { describe, expect, it } from 'vitest';
import { modelRelationInterfaceFrom } from '../modelRelation';
import type { EloquentRelationAst } from '../eloquent';
import { modelSemanticRelationIdentityOf, type ModelSemanticRelation, type RelationKey } from '../model';
import type { SchemaRelationIndexInterface } from '../schemaRelation';
import type { SemanticRelationReconciliationInterface } from '../semanticReconciliation';

const relation = (name: string, targetModel: string): EloquentRelationAst => ({
  kind: 'eloquent_relation_ast',
  name: { kind: 'relation_name', value: { kind: 'string_value', value: name } },
  sourceModel: { kind: 'model_name', value: { kind: 'string_value', value: 'OrderDetail' } },
  relation: { kind: 'belongs_to' },
  eloquentType: { kind: 'belongs_to' },
  descriptor: { kind: 'eloquent_relation_descriptor', relation: { kind: 'belongs_to' }, type: { kind: 'belongs_to' } } as never,
  targetModel: { kind: 'model_name', value: { kind: 'string_value', value: targetModel } },
  targetClass: { kind: 'class_name', value: { kind: 'string_value', value: targetModel } },
  invocation: {} as never,
  source: {} as never,
  semanticType: {} as never,
  targetShape: { kind: 'model' } as never,
  traversalTarget: { kind: 'model', model: { kind: 'model_name', value: { kind: 'string_value', value: targetModel } } } as never,
  key: { kind: 'convention' },
});

const semantic = (
  name: string,
  targetModel: string,
  foreignKey: RelationKey = { kind: 'convention' },
): ModelSemanticRelation => {
  const value = {
    kind: 'relation' as const,
    property: { kind: 'property_name' as const, value: { kind: 'string_value' as const, value: name } },
    relation: { kind: 'relation_name' as const, value: { kind: 'string_value' as const, value: name } },
    sourceModel: { kind: 'model_name' as const, value: { kind: 'string_value' as const, value: 'OrderDetail' } },
    eloquentType: { kind: 'belongs_to' as const },
    targetModel: { kind: 'model_name' as const, value: { kind: 'string_value' as const, value: targetModel } },
    cardinality: { kind: 'one' as const },
    multiplicity: { kind: 'single' as const },
    targetShape: { kind: 'model' as const } as never,
    traversalTarget: { kind: 'model' as const, model: { kind: 'model_name' as const, value: { kind: 'string_value' as const, value: targetModel } } } as never,
    boundCardinality: { kind: 'single' as const },
    resourceCardinality: { kind: 'single' as const },
    foreignKey,
    semanticType: {} as never,
    source: {} as never,
    traversal: {} as never,
  };
  return { ...value, identity: modelSemanticRelationIdentityOf(value) } as ModelSemanticRelation;
};


describe('phase1009 model relation identity alignment', () => {
  it('aligns semantic relations by identity instead of array position', () => {
    const order = relation('order', 'Order');
    const payment = relation('payment', 'Payment');
    const orderSemantic = semantic('order', 'Order');
    const paymentSemantic = semantic('payment', 'Payment');
    const schema = {} as SchemaRelationIndexInterface;

    const result = modelRelationInterfaceFrom(
      [order, payment],
      [paymentSemantic, orderSemantic],
      schema,
      (evidence, _schema, aligned): SemanticRelationReconciliationInterface => ({
        kind: 'semantic_relation_reconciliation',
        relation: evidence,
        status: 'eloquent_only',
        key: aligned.foreignKey,
        semantic: aligned,
        schemaEvidence: [],
        closed: true,
      }),
    );

    expect(result.reconciliations[0].semantic).toBe(orderSemantic);
    expect(result.reconciliations[1].semantic).toBe(paymentSemantic);
  });

  it('rejects a semantic candidate whose canonical relation identity has a different foreign key', () => {
    const order = relation('order', 'Order');
    const mismatched = semantic('order', 'Order', {
      kind: 'explicit_foreign',
      foreign: { kind: 'column_name', value: { kind: 'string_value', value: 'order_id' } },
    });

    expect(() => modelRelationInterfaceFrom(
      [order],
      [mismatched],
      {} as SchemaRelationIndexInterface,
      (evidence, _schema, aligned): SemanticRelationReconciliationInterface => ({
        kind: 'semantic_relation_reconciliation',
        relation: evidence,
        status: 'eloquent_only',
        key: aligned.foreignKey,
        semantic: aligned,
        schemaEvidence: [],
        closed: true,
      }),
    )).toThrow(/expected exactly one semantic relation, found 0/);
  });
});
