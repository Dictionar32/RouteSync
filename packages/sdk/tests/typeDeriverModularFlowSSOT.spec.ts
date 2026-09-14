import { describe, it, expect } from 'vitest';
import {
  TypeDeriver,
  resolvePrimitiveKind,
  resolveRouteDomain,
  ValidationRuleFieldLowerer,
  PrimitiveKind,
  ReadonlyCollectionType,
  ScannedRouteDescriptor,
  ScannedRouteSchemaPayload,
  ScannedRouteValidationRuleEntry,
  ScannedResourceDescriptor,
  ScannedResourceFieldDescriptor
} from '@routesync/core';

describe('TypeDeriver Modular Flow & SSOT Architecture', () => {
  it('1. resolvePrimitiveKind authoritatively resolves SQL and schema types without loose string heuristic leaks', () => {
    expect(resolvePrimitiveKind('int')).toBe(PrimitiveKind.NUMBER);
    expect(resolvePrimitiveKind('integer')).toBe(PrimitiveKind.NUMBER);
    expect(resolvePrimitiveKind('float')).toBe(PrimitiveKind.NUMBER);
    expect(resolvePrimitiveKind('double')).toBe(PrimitiveKind.NUMBER);
    expect(resolvePrimitiveKind('decimal')).toBe(PrimitiveKind.NUMBER);
    expect(resolvePrimitiveKind('numeric')).toBe(PrimitiveKind.NUMBER);

    expect(resolvePrimitiveKind('boolean')).toBe(PrimitiveKind.BOOLEAN);
    expect(resolvePrimitiveKind('bool')).toBe(PrimitiveKind.BOOLEAN);

    expect(resolvePrimitiveKind('datetime')).toBe(PrimitiveKind.DATETIME);
    expect(resolvePrimitiveKind('date')).toBe(PrimitiveKind.DATETIME);
    expect(resolvePrimitiveKind('timestamp')).toBe(PrimitiveKind.DATETIME);

    expect(resolvePrimitiveKind('file')).toBe(PrimitiveKind.FILE);
    expect(resolvePrimitiveKind('image')).toBe(PrimitiveKind.FILE);

    expect(resolvePrimitiveKind('unknown')).toBe(PrimitiveKind.UNKNOWN);
    expect(resolvePrimitiveKind('varchar')).toBe(PrimitiveKind.STRING);
    expect(resolvePrimitiveKind(undefined)).toBe(PrimitiveKind.STRING);
  });

  it('2. resolveRouteDomain resolves domain names through deterministic hierarchy', () => {
    // 1. Explicit resourceName
    expect(resolveRouteDomain({ path: '/api/items', resourceName: 'ItemResource' })).toBe('Item');

    // 2. /register path convention
    expect(resolveRouteDomain({ path: '/register' })).toBe('Register');

    // 3. Dot-separated route name (camelCase first segment)
    expect(resolveRouteDomain({ path: '/api/v1/user/profile', name: 'user.profile.show' })).toBe('userProfile');

    // 4. Multi-segment path
    expect(resolveRouteDomain({ path: '/api/order-details' })).toBe('orderDetails');

    // 5. Controller action pattern
    expect(resolveRouteDomain({ path: '', actionName: 'App\\Http\\Controllers\\ProductCategoryController@index' })).toBe('ProductCategory');

    // 6. Fallback
    expect(resolveRouteDomain({ path: '' })).toBe('App');
  });

  it('3. ValidationRuleFieldLowerer processes nested wildcards (.*.) and primitive arrays (.*) cleanly', () => {
    const rulesList = [
      ScannedRouteValidationRuleEntry.create('items', ['required', 'array']),
      ScannedRouteValidationRuleEntry.create('items.*.product_id', ['required', 'integer']),
      ScannedRouteValidationRuleEntry.create('items.*.quantity', ['required', 'numeric']),
      ScannedRouteValidationRuleEntry.create('tags.*', ['string']),
      ScannedRouteValidationRuleEntry.create('notes', ['nullable', 'string'])
    ];

    const route = ScannedRouteDescriptor.fromSparse({
      method: 'POST',
      path: '/api/orders',
      schema: ScannedRouteSchemaPayload.fromRules(rulesList)
    });

    const fields = ValidationRuleFieldLowerer.lower(route);
    expect(fields.length).toBeGreaterThanOrEqual(3);

    const itemsField = fields.find(f => f.originalName === 'items');
    expect(itemsField).toBeDefined();
    expect(itemsField?.type).toBeInstanceOf(ReadonlyCollectionType);

    const tagsField = fields.find(f => f.originalName === 'tags');
    expect(tagsField).toBeDefined();
    expect(tagsField?.type).toBeInstanceOf(ReadonlyCollectionType);

    const notesField = fields.find(f => f.originalName === 'notes');
    expect(notesField).toBeDefined();
    expect(notesField?.nullable).toBe(true);
  });

  it('4. TypeDeriver facade transparently delegates to RequestTypeDeriver and SemanticTypeDeriver', () => {
    const mockRoute = ScannedRouteDescriptor.fromSparse({
      path: '/api/users',
      resourceName: 'UserResource',
      method: 'POST',
      actionName: 'store',
      schema: ScannedRouteSchemaPayload.fromRules([
        ScannedRouteValidationRuleEntry.create('name', ['required', 'string']),
        ScannedRouteValidationRuleEntry.create('email', ['required', 'string'])
      ])
    });

    const requestTypes = TypeDeriver.deriveRequestTypes([mockRoute], []);
    expect(requestTypes.length).toBe(1);
    expect(requestTypes[0].resourceName).toBe('user');
    expect(requestTypes[0].formTypeName).toBe('UserForm');
    expect(requestTypes[0].actions.length).toBe(1);
    expect(requestTypes[0].actions[0].name).toBe('create');

    const mockResource = ScannedResourceDescriptor.create({
      name: 'UserResource',
      fields: [
        ScannedResourceFieldDescriptor.create({
          name: 'id',
          expression: { kind: 'primitive', type: 'integer' }
        }),
        ScannedResourceFieldDescriptor.create({
          name: 'name',
          expression: { kind: 'primitive', type: 'string' }
        })
      ]
    });

    const semanticTypes = TypeDeriver.deriveSemanticTypes([mockResource], []);
    expect(semanticTypes.length).toBe(1);
    expect(semanticTypes[0].name).toBe('UserResourceTransformed');
    expect(semanticTypes[0].properties.length).toBe(2);
  });
});
