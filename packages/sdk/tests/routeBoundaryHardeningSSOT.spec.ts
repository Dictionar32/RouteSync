import { describe, it, expect } from 'vitest';
import {
  RouteBoundaryContractFactory,
  SemanticValueFactory,
  VoidResponseDescriptor,
  type RouteBoundaryContract,
  type RouteBoundaryOptions
} from '@routesync/core';
import { numberValue } from '../../core/src/types/upstream/valueObjects';
import { emptyRouteSchemaPayload } from '../../core/src/types/domain/validationRules';

const minimalBoundary = (method: RouteBoundaryOptions['method'], path: string): RouteBoundaryOptions => ({
  origin: 'controller_reference',
  method,
  path: SemanticValueFactory.routePath(path),
  name: SemanticValueFactory.routeName('boundary.test'),
  resourceName: SemanticValueFactory.resourceName('users'),
  domain: SemanticValueFactory.domainName('users'),
  auth: false,
  middleware: [],
  parameters: [],
  pathParameters: [],
  queryParameters: [],
  response: VoidResponseDescriptor.create(),
  errorResponses: [],
  schema: emptyRouteSchemaPayload(),
  binding: {
    operation: {
      controllerName: SemanticValueFactory.controllerName('UserController'),
      name: SemanticValueFactory.actionName('index'),
      handler: Object.freeze({
        kind: 'controller_action',
        controllerName: SemanticValueFactory.controllerName('UserController'),
        actionName: SemanticValueFactory.actionName('index'),
        target: SemanticValueFactory.className('UserController@index')
      })
    },
    request: { kind: 'no_request' }
  },
  runtimeReturn: { kind: 'none' },
  semanticReturn: { kind: 'absent' },
  controllerName: SemanticValueFactory.controllerName('UserController'),
  actionName: SemanticValueFactory.actionName('index'),
  action: SemanticValueFactory.actionName('index'),
  sourceFile: SemanticValueFactory.sourceFilePath('routes/api.php'),
  sourceLine: numberValue(1)
});

describe('Route Boundary Hardening & Level 7 Contract SSOT', () => {
  it('RouteBoundaryContractFactory produces a frozen closed contract from complete boundary semantics', () => {
    const contract: RouteBoundaryContract = RouteBoundaryContractFactory.create(
      minimalBoundary('GET', '/api/v1/users')
    );

    expect(Object.isFrozen(contract)).toBe(true);
    expect(contract.identity.coordinates.method).toBe('GET');
    expect(contract.identity.coordinates.path).toEqual(SemanticValueFactory.routePath('/api/v1/users'));
    expect(contract.identity.domain.resource).toEqual(SemanticValueFactory.resourceName('users'));
    expect(contract.identity.domain.group).toEqual(SemanticValueFactory.domainName('users'));
    expect(contract.capability.actionKind).toBe('read');
    expect(contract.capability.isMutating).toBe(false);
    expect(contract.capability.hookKind).toBe('query');
    expect(contract.capability.crudRole).toBe('index');
    expect(contract.capability.auth.value).toBe(false);
    expect(contract.capability.middleware).toBeDefined();
    expect(contract.identity.parameters.all).toEqual([]);
    expect(contract.identity.parameters.path).toEqual([]);
    expect(contract.identity.parameters.query).toEqual([]);
    expect(contract.binding.schema).toBeDefined();
    expect(contract.binding.operation.handler).toBeDefined();
  });

  it('RouteBoundaryContractFactory resolves mutation semantics without a legacy route facade', () => {
    const contract = RouteBoundaryContractFactory.create({
      ...minimalBoundary('POST', '/api/v1/orders'),
      auth: true,
      middleware: [SemanticValueFactory.propertyName('auth:sanctum')]
    });

    expect(Object.isFrozen(contract)).toBe(true);
    expect(contract.identity.coordinates.method).toBe('POST');
    expect(contract.capability.actionKind).toBe('create');
    expect(contract.capability.isMutating).toBe(true);
    expect(contract.capability.hookKind).toBe('mutation');
    expect(contract.capability.crudRole).toBe('create');
    expect(contract.capability.auth.value).toBe(true);
    expect(contract.capability.middleware).toBeDefined();
  });
});
