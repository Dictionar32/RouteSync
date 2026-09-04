import { describe, it, expect } from 'vitest';
import {
  ScannedModelColumnDescriptor,
  ScannedModelAccessorDescriptor,
  ScannedResourceFieldDescriptor,
  ScannedRouteParameterDescriptor,
  ResourceResponseDescriptor,
  InlineResponseDescriptor,
  PrimitiveKind,
  ParsedColumn,
  ParsedAccessor,
  ResourceFieldDescriptor,
  RouteParameter,
  RouteParameterType
} from '@routesync/core';

describe('Domain Model Manifest SSOT Suite', () => {
  it('1. ScannedModelColumnDescriptor guarantees propertyName and semanticType at Origin Boundary', () => {
    const col: ParsedColumn = ScannedModelColumnDescriptor.create({
      name: 'created_at',
      type: 'timestamp',
      nullable: false
    });

    expect(col.name).toBe('created_at');
    expect(col.propertyName).toBe('createdAt');
    expect(col.type).toBe('timestamp');
    expect(col.nullable).toBe(false);
    expect(col.semanticType).toBe(PrimitiveKind.DATETIME);
  });

  it('2. ScannedModelColumnDescriptor resolves SQL bigint unsigned to PrimitiveKind.NUMBER', () => {
    const col: ParsedColumn = ScannedModelColumnDescriptor.create({
      name: 'order_id',
      type: 'bigint(20) unsigned',
      nullable: false
    });

    expect(col.name).toBe('order_id');
    expect(col.propertyName).toBe('orderId');
    expect(col.semanticType).toBe(PrimitiveKind.NUMBER);
  });

  it('3. ScannedModelAccessorDescriptor guarantees propertyName and semanticType', () => {
    const acc: ParsedAccessor = ScannedModelAccessorDescriptor.create({
      name: 'total_amount_cents',
      type: 'int',
      nullable: false
    });

    expect(acc.name).toBe('total_amount_cents');
    expect(acc.propertyName).toBe('totalAmountCents');
    expect(acc.type).toBe('int');
    expect(acc.nullable).toBe(false);
    expect(acc.semanticType).toBe(PrimitiveKind.NUMBER);
  });

  it('4. ScannedResourceFieldDescriptor guarantees propertyName and semanticType', () => {
    const field: ResourceFieldDescriptor = ScannedResourceFieldDescriptor.create({
      name: 'product_id',
      expression: { kind: 'primitive', type: 'number' },
      nullable: false
    });

    expect(field.name).toBe('product_id');
    expect(field.propertyName).toBe('productId');
    expect(field.semanticType).toBe(PrimitiveKind.NUMBER);
    expect(field.nullable).toBe(false);
  });

  it('5. ScannedModelColumnDescriptor preserves literal enumValues for enum columns', () => {
    const enumCol: ParsedColumn = ScannedModelColumnDescriptor.create({
      name: 'order_status',
      type: 'enum',
      nullable: false,
      enumValues: ['pending', 'processing', 'completed', 'cancelled']
    });

    expect(enumCol.name).toBe('order_status');
    expect(enumCol.propertyName).toBe('orderStatus');
    expect(enumCol.enumValues).toBeDefined();
    expect(enumCol.enumValues).toEqual(['pending', 'processing', 'completed', 'cancelled']);
  });

  it('6. ScannedRouteParameterDescriptor guarantees propertyName at Origin Boundary', () => {
    const param: RouteParameter = ScannedRouteParameterDescriptor.create({
      name: 'order_id',
      type: RouteParameterType.Number
    });

    expect(param.name).toBe('order_id');
    expect(param.propertyName).toBe('orderId');
    expect(param.type).toBe('number');
    expect(param.in).toBe('path');
  });

  it('7. ResponseDescriptors guarantee canonical readTypeName and mapperName contracts', () => {
    const resResponse = ResourceResponseDescriptor.create({ resourceName: 'UserResource' });
    expect(resResponse.readTypeName).toBe('UserResourceTransformed');
    expect(resResponse.mapperName).toBe('toUserResourceRead');

    const inlineResponse = InlineResponseDescriptor.create({
      domain: 'profile',
      fields: []
    });
    expect(inlineResponse.readTypeName).toBe('profileTransformed');
    expect(inlineResponse.mapperName).toBe('toprofileRead');
  });
});
