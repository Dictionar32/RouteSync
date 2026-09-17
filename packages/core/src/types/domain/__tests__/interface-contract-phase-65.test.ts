import { describe, expectTypeOf, it } from 'vitest';
import type {
  BoundBinaryNode,
  BoundConditionalNode,
  BoundLiteralValue,
  BoundModelColumnNode,
  BoundMethodCallNode,
  BoundPropertyChainNode,
  BoundRelationNode,
  BoundPrimitiveNode,
} from '../boundAst';
import type {
  CastTypeName,
  ColumnName,
  ConditionExpression,
  DatabaseTypeName,
  MethodName,
  ModelName,
  PropertyName,
  RelationName,
  SemanticOperator,
} from '../semanticValues';

describe('Phase 65 semantic value contracts', () => {
  it('does not expose free primitive identity fields in bound model data', () => {
    expectTypeOf<BoundModelColumnNode['model']>().toEqualTypeOf<ModelName>();
    expectTypeOf<BoundModelColumnNode['column']>().toEqualTypeOf<ColumnName>();
    expectTypeOf<BoundModelColumnNode['dbType']>().toEqualTypeOf<DatabaseTypeName>();
    expectTypeOf<BoundModelColumnNode['castType']>().toEqualTypeOf<CastTypeName | null>();
  });

  it('does not expose free model, relation, property, or method names', () => {
    expectTypeOf<BoundRelationNode['sourceModel']>().toEqualTypeOf<ModelName>();
    expectTypeOf<BoundRelationNode['relationName']>().toEqualTypeOf<RelationName>();
    expectTypeOf<BoundRelationNode['targetModel']>().toEqualTypeOf<ModelName>();
    expectTypeOf<BoundPropertyChainNode['rootModel']>().toEqualTypeOf<ModelName>();
    expectTypeOf<BoundMethodCallNode['methodName']>().toEqualTypeOf<MethodName>();
  });

  it('does not expose free expressions or operators', () => {
    expectTypeOf<BoundConditionalNode['conditionExpression']>().toEqualTypeOf<ConditionExpression>();
    expectTypeOf<BoundBinaryNode['operator']>().toEqualTypeOf<SemanticOperator>();
  });

  it('represents literal values as a closed semantic ADT', () => {
    expectTypeOf<BoundPrimitiveNode['value']>().toEqualTypeOf<BoundLiteralValue>();
  });

  it('keeps the semantic value object closed', () => {
    expectTypeOf<ModelName>().toHaveProperty('kind');
    expectTypeOf<ColumnName>().toHaveProperty('kind');
    expectTypeOf<PropertyName>().toHaveProperty('kind');
    expectTypeOf<RelationName>().toHaveProperty('kind');
    expectTypeOf<MethodName>().toHaveProperty('kind');
    expectTypeOf<ConditionExpression>().toHaveProperty('kind');
  });
});
