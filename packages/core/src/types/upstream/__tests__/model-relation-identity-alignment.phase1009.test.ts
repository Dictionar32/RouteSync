import { describe, expect, it } from 'vitest';
import { modelRelationInterfaceFrom } from '../modelRelation';
import type { EloquentRelationAst } from '../eloquent';
import type { ModelSemanticRelation } from '../model';
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

const semantic = (name: string, targetModel: string): ModelSemanticRelation => ({
  kind: 'relation',
  identity: {} as never,
  property: { kind: 'property_name', value: { kind: 'string_value', value: name } },
  relation: { kind: 'relation_name', value: { kind: 'string_value', value: name } },
  sourceModel: { kind: 'model_name', value: { kind: 'string_value', value: 'OrderDetail' } },
  eloquentType: { kind: 'belongs_to' },
  targetModel: { kind: 'model_name', value: { kind: 'string_value', value: targetModel } },
  cardinality: { kind: 'one' },
  multiplicity: { kind: 'single' },
  targetShape: { kind: 'model' } as never,
  traversalTarget: { kind: 'model', model: { kind: 'model_name', value: { kind: 'string_value', value: targetModel } } } as never,
  boundCardinality: { kind: 'single' },
  resourceCardinality: { kind: 'single' },
  foreignKey: { kind: 'convention' },
  semanticType: {} as never,
  source: {} as never,
  traversal: {} as never,
});

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
});
