import { describe, expect, it } from 'vitest';
import { resolveControllerActionContract } from './controllerActionContract';
import type { ControllerMethodAst } from '../../lexer/controllerAstTypes';
import { createControllerName, createSourceFile } from '../../../../types/upstream/names';

describe('phase 10 controller request semantic resolution', () => {
  it('does not confuse the first dependency with the request', () => {
    const method = {
      name: 'store',
      parameters: [
        { attributes: [], name: 'service', type: { kind: 'named', name: 'PaymentService' } },
        { attributes: [], name: 'request', type: { kind: 'named', name: 'Request' } },
      ],
      body: { statements: [] },
      returns: [],
      responseAttribute: { kind: 'absent' },
      source: { file: '<test>', line: 1, column: 1 },
    } as unknown as ControllerMethodAst;

    const contract = resolveControllerActionContract(method, createControllerName('PaymentController'), createSourceFile('<test>'), {
      formRequestMap: new Map(),
      sourceProject: {} as never,
    });

    expect(contract.request.kind).toBe('framework_request');
  });
});


describe('controller constructor dependency elevation', () => {
  it('elevates constructor class parameters into semantic constructor dependencies', () => {
    const method = {
      name: 'show',
      parameters: [],
      body: { statements: [] },
      returns: [],
      responseAttribute: { kind: 'absent' },
      source: { file: '<test>', line: 1, column: 1 },
    } as unknown as ControllerMethodAst;

    const constructorParameters = [
      { attributes: [], name: 'users', type: { kind: 'named', name: 'App\\Repositories\\UserRepository' } },
    ] as unknown as ControllerMethodAst['parameters'];

    const contract = resolveControllerActionContract(method, createControllerName('UserController'), createSourceFile('<test>'), {
      formRequestMap: new Map(),
      sourceProject: {} as never,
      constructorParameters,
    });

    expect(contract.dependencies).toEqual([
      {
        kind: 'controller_dependency',
        injection: { kind: 'constructor' },
        resolution: { kind: 'container' },
        parameter: { kind: 'variable_name', value: { kind: 'string_value', value: 'users' } },
        type: { kind: 'class_name', value: { kind: 'string_value', value: 'App\\Repositories\\UserRepository' } },
      },
    ]);
  });
});


describe('controller contextual attribute precedence', () => {
  it('keeps contextual model parameters as dependencies instead of treating them as route binding', () => {
    const method = {
      name: 'show',
      parameters: [
        {
          attributes: [{ name: 'RouteParameter', arguments: [], source: { file: '<test>', line: 1, column: 1 } }],
          name: 'photo',
          type: { kind: 'named', name: 'App\\Models\\Photo' },
        },
      ],
      body: { statements: [] },
      returns: [],
      responseAttribute: { kind: 'absent' },
      source: { file: '<test>', line: 1, column: 1 },
    } as unknown as ControllerMethodAst;

    const contract = resolveControllerActionContract(method, createControllerName('PhotoController'), createSourceFile('<test>'), {
      formRequestMap: new Map(),
      modelNames: new Set(['App\\Models\\Photo']),
      sourceProject: {} as never,
    });

    expect(contract.dependencies).toHaveLength(1);
    expect(contract.dependencies[0]?.resolution).toMatchObject({
      kind: 'contextual_attribute',
      attribute: { kind: 'laravel_contextual_attribute', name: 'route_parameter' },
    });
  });

  it('recognizes Laravel Storage as a contextual attribute', () => {
    const method = {
      name: 'store',
      parameters: [
        {
          attributes: [{ name: 'Illuminate\\Container\\Attributes\\Storage', arguments: [], source: { file: '<test>', line: 1, column: 1 } }],
          name: 'filesystem',
          type: { kind: 'named', name: 'Illuminate\\Contracts\\Filesystem\\Filesystem' },
        },
      ],
      body: { statements: [] },
      returns: [],
      responseAttribute: { kind: 'absent' },
      source: { file: '<test>', line: 1, column: 1 },
    } as unknown as ControllerMethodAst;

    const contract = resolveControllerActionContract(method, createControllerName('PhotoController'), createSourceFile('<test>'), {
      formRequestMap: new Map(),
      sourceProject: {} as never,
    });

    expect(contract.dependencies[0]?.resolution).toMatchObject({
      kind: 'contextual_attribute',
      attribute: { kind: 'laravel_contextual_attribute', name: 'storage' },
    });
  });
});
