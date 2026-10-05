import { describe, expect, test } from 'vitest';
import { projectStructuralSemanticRelationToGraphEdge } from './structuralSemanticRelationProjection';
import type { StructuralSemanticRelation } from '../../types/upstream/semanticReferences';

const controller = {
  kind: 'controller_reference' as const,
  name: { kind: 'controller_name' as const, value: { kind: 'string_value' as const, value: 'OrderController' } },
  action: { kind: 'action_name' as const, value: { kind: 'string_value' as const, value: 'store' } },
};
const model = (name: string) => ({
  kind: 'model_reference' as const,
  name: { kind: 'model_name' as const, value: { kind: 'string_value' as const, value: name } },
});
const resource = {
  kind: 'resource_reference' as const,
  name: { kind: 'resource_name' as const, value: { kind: 'string_value' as const, value: 'OrderResource' } },
};

describe('phase 925 structural semantic relation graph projection', () => {
  test('projects structural dependency relations through one graph-edge authority', () => {
    const relations: StructuralSemanticRelation[] = [
      { kind: 'controller_dependency', controller, dependency: model('Order') },
      { kind: 'controller_resource', controller, resource },
      { kind: 'controller_model', controller, model: { kind: 'model_class', name: model('Order').name } },
      { kind: 'resource_model', resource, model: model('Order') },
      { kind: 'model_relation', model: model('Order'), target: model('OrderItem') },
    ];

    const projections = relations.map(projectStructuralSemanticRelationToGraphEdge);
    expect(projections.every(value => value.kind === 'projected')).toBe(true);
    expect(projections.map(value => value.kind === 'projected' ? value.relation.origin : undefined)).toEqual([
      'controller_dependency',
      'controller_resource_dependency',
      'controller_model_dependency',
      'resource_model_dependency',
      'model_relation',
    ]);
  });

  test('does not turn non-graph structural semantics into fake edges', () => {
    const relation: StructuralSemanticRelation = {
      kind: 'route_controller',
      route: { kind: 'route_reference', name: { kind: 'route_name', value: { kind: 'string_value', value: 'orders.store' } } },
      controller,
    };
    expect(projectStructuralSemanticRelationToGraphEdge(relation)).toEqual({
      kind: 'not_projectable',
      sourceKind: 'route_controller',
    });
  });

  test('rejects table-origin controller model relations without fabricating a model node', () => {
    const relation: StructuralSemanticRelation = {
      kind: 'controller_model',
      controller,
      model: { kind: 'table', name: { kind: 'table_name', value: { kind: 'string_value', value: 'orders' } } },
    };
    expect(projectStructuralSemanticRelationToGraphEdge(relation)).toEqual({
      kind: 'not_projectable',
      sourceKind: 'controller_model',
    });
  });
});
