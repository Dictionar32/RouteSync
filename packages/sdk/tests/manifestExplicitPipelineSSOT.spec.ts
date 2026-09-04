import { describe, it, expect } from 'vitest';
import {
  ScannedRouteDescriptor,
  ScannedModelDescriptor,
  ScannedRouteParameterDescriptor,
  ValidationTreeBuilder,
  RequestContentType,
  ModelKeyType,
  PrimitiveKind,
  RouteActionKind,
  RouteParameterType,
  ParsedRoute,
  ParsedModel,
  ValidationRuleKind
} from '@routesync/core';

describe('Manifest Explicit Pipeline SSOT Suite', () => {
  it('1. Resolves RequestContentType: None for GET, Multipart for File uploads, Json for normal POST', () => {
    const getRoute: ParsedRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/users',
      resourceName: 'users',
      actionName: 'index',
      actionKind: RouteActionKind.Read,
      isMutating: false
    });
    expect(getRoute.requestContentType).toBe(RequestContentType.None);

    const uploadRoute: ParsedRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/avatar',
      resourceName: 'avatar',
      actionName: 'upload',
      actionKind: RouteActionKind.Create,
      isMutating: true,
      schema: {
        formRequestName: 'AvatarRequest',
        rules: [
          {
            fieldName: 'avatar',
            rules: [{ kind: 'file' }]
          }
        ]
      }
    });
    expect(uploadRoute.requestContentType).toBe(RequestContentType.Multipart);

    const postJsonRoute: ParsedRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/orders',
      resourceName: 'orders',
      actionName: 'store',
      actionKind: RouteActionKind.Create,
      isMutating: true
    });
    expect(postJsonRoute.requestContentType).toBe(RequestContentType.Json);
  });

  it('2. Segregates pathParameters and queryParameters with guaranteed propertyName', () => {
    const route: ParsedRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/users/{user_id}/posts',
      resourceName: 'posts',
      actionName: 'index',
      actionKind: RouteActionKind.Read,
      isMutating: false,
      parameters: [
        ScannedRouteParameterDescriptor.create({ name: 'user_id', in: 'path', type: RouteParameterType.Number })
      ],
      queryParameters: [
        {
          name: 'per_page',
          propertyName: 'perPage',
          required: false,
          type: RouteParameterType.Number
        }
      ]
    });

    expect(route.pathParameters.length).toBe(1);
    expect(route.pathParameters[0].name).toBe('user_id');
    expect(route.pathParameters[0].propertyName).toBe('userId');

    expect(route.queryParameters.length).toBe(1);
    expect(route.queryParameters[0].name).toBe('per_page');
    expect(route.queryParameters[0].propertyName).toBe('perPage');
  });

  it('3. Guarantees primaryKey, keyType, and incrementing identity on ParsedModel', () => {
    const intModel: ParsedModel = ScannedModelDescriptor.create({
      name: 'App\\Models\\User',
      columns: []
    });
    expect(intModel.primaryKey).toBe('id');
    expect(intModel.keyType).toBe(ModelKeyType.Int);
    expect(intModel.keySemanticType).toBe(PrimitiveKind.NUMBER);
    expect(intModel.incrementing).toBe(true);

    const uuidModel: ParsedModel = ScannedModelDescriptor.create({
      name: 'App\\Models\\Transaction',
      keyType: 'uuid',
      incrementing: false,
      columns: []
    });
    expect(uuidModel.keyType).toBe(ModelKeyType.Uuid);
    expect(uuidModel.keySemanticType).toBe(PrimitiveKind.STRING);
    expect(uuidModel.incrementing).toBe(false);
  });

  it('4. Provides First-Class HttpErrorResponseDescriptors (422 and 401)', () => {
    const mutatingAuthRoute: ParsedRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/orders',
      resourceName: 'orders',
      actionName: 'store',
      actionKind: RouteActionKind.Create,
      isMutating: true,
      auth: true
    });

    expect(mutatingAuthRoute.errorResponses.length).toBe(2);
    const err422 = mutatingAuthRoute.errorResponses.find(e => e.statusCode === 422);
    const err401 = mutatingAuthRoute.errorResponses.find(e => e.statusCode === 401);

    expect(err422).toBeDefined();
    expect(err422?.typeName).toBe('LaravelValidationError');

    expect(err401).toBeDefined();
    expect(err401?.typeName).toBe('LaravelUnauthorizedError');
  });

  it('5. ValidationTreeBuilder constructs Hierarchical Validation Tree AST for nested array rules', () => {
    const tree = ValidationTreeBuilder.buildTree([
      {
        fieldName: 'items.*.product_id',
        rules: [{ kind: ValidationRuleKind.Required }, { kind: ValidationRuleKind.Number }]
      },
      {
        fieldName: 'items.*.quantity',
        rules: [{ kind: ValidationRuleKind.Required }, { kind: ValidationRuleKind.Number }]
      },
      {
        fieldName: 'note',
        rules: [{ kind: ValidationRuleKind.String }]
      }
    ]);

    expect(tree.length).toBe(2);
    const itemsNode = tree.find(n => n.fieldName === 'items');
    const noteNode = tree.find(n => n.fieldName === 'note');

    expect(itemsNode?.kind).toBe('array');
    if (itemsNode?.kind === 'array' && itemsNode.element.kind === 'object') {
      expect(itemsNode.element.fields.length).toBe(2);
      expect(itemsNode.element.fields[0].propertyName).toBe('productId');
      expect(itemsNode.element.fields[1].propertyName).toBe('quantity');
    }

    expect(noteNode?.kind).toBe('scalar');
    expect(noteNode?.propertyName).toBe('note');
  });
});
