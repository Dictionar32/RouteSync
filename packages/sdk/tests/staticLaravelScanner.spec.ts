import { describe, it, expect } from 'vitest';
import { StaticLaravelScanner, ScannedModelDescriptor, ScannedRouteDescriptor, ScannedRouteManifestDescriptor, inferLaravelTableName, extractClassBasename } from '@routesync/core';

describe('StaticLaravelScanner Unit Test Suite', () => {
  it('1. Correctly constructs ScannedModelDescriptor with explicit model data and Laravel table inference', () => {
    const userModel = ScannedModelDescriptor.create({
      name: 'App\\Models\\User',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'email', type: 'string', nullable: false },
        { name: 'is_active', type: 'boolean', nullable: false }
      ],
      fillable: ['name', 'email'],
      casts: [{ column: 'is_active', targetType: 'boolean' }]
    });

    expect(userModel.name).toBe('App\\Models\\User');
    expect(userModel.shortName).toBe('User');
    expect(userModel.table).toBe('users');
    expect(userModel.primaryKey).toBe('id');
    expect(userModel.keyType).toBe('int');
    expect(userModel.incrementing).toBe(true);
    expect(userModel.fillable).toEqual(['name', 'email']);
    expect(userModel.casts).toHaveLength(1);
    expect(userModel.casts?.[0]).toEqual({ column: 'is_active', targetType: 'boolean' });
  });

  it('2. Correctly handles custom model table and non-incrementing UUID keyType', () => {
    const orderModel = ScannedModelDescriptor.create({
      name: 'App\\Models\\OrderItem',
      table: 'order_items',
      primaryKey: 'uuid',
      keyType: 'string',
      incrementing: false,
      columns: [
        { name: 'uuid', type: 'string', nullable: false },
        { name: 'price', type: 'integer', nullable: false }
      ]
    });

    expect(orderModel.table).toBe('order_items');
    expect(orderModel.primaryKey).toBe('uuid');
    expect(orderModel.keyType).toBe('string');
    expect(orderModel.incrementing).toBe(false);
  });

  it('3. Replicates Laravel table name pluralization via inferLaravelTableName', () => {
    expect(inferLaravelTableName('App\\Models\\User')).toBe('users');
    expect(inferLaravelTableName('App\\Models\\Category')).toBe('categories');
    expect(inferLaravelTableName('App\\Models\\OrderItem')).toBe('order_items');
    expect(inferLaravelTableName('App\\Models\\Address')).toBe('addresses');
    expect(inferLaravelTableName('App\\Models\\Tax')).toBe('taxes');
  });

  it('4. Correctly extracts class basename without allocation failure', () => {
    expect(extractClassBasename('App\\Models\\User')).toBe('User');
    expect(extractClassBasename('App\\Http\\Resources\\OrderResource')).toBe('OrderResource');
    expect(extractClassBasename('SimpleClass')).toBe('SimpleClass');
  });

  it('5. Constructs ScannedRouteDescriptor and manifest descriptors cleanly', () => {
    const route = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/users',
      resourceName: 'User',
      actionName: 'index',
      actionKind: 'read',
      isMutating: false
    });

    expect(route.method).toBe('GET');
    expect(route.path).toBe('/api/users');
    expect(route.actionKind).toBe('read');
    expect(route.isMutating).toBe(false);

    const manifest = ScannedRouteManifestDescriptor.create({
      version: '6.0.0',
      baseURL: 'http://localhost/api',
      routes: [route],
      resources: [],
      models: [],
      requestTypes: [],
      semanticTypes: []
    });

    expect(manifest.version).toBe('6.0.0');
    expect(manifest.routes).toHaveLength(1);
  });
});
