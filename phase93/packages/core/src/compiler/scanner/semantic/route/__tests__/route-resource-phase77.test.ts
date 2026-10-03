import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { extractRouteResourceFactFromAst } from '../routeResourceAstAdapter';
import { resolveRouteResourceFact } from '../routeResourceSemanticResolver';
import { createControllerName, createResourceName, stringValue } from '../../../../../types/upstream/names';
import { createRouteResourceControllerAst, createRouteResourceNameAst, type RouteResourceDeclarationAst } from '../../../lexer/routeAst/routeResourceDeclarationAst';

describe('phase 77 Laravel resource semantic elevation', () => {
  it('keeps withTrashed() syntax as a fact, then resolves Laravel default actions upstream', () => {
    const ast = {
      method: 'resource',
      resource: createRouteResourceNameAst('photos'),
      controller: createRouteResourceControllerAst('PhotoController'),
      withTrashed: [],
      actionFilter: undefined,
      names: undefined,
      parameters: undefined,
      source: { value: 'Route' },
    } as unknown as RouteResourceDeclarationAst;
    const fact = extractRouteResourceFactFromAst(ast);
    assert.deepEqual(fact.withTrashed, []);
    const contract = resolveRouteResourceFact(fact);
    assert.deepEqual(contract.withTrashed.actions.map(action => action.value.value), ['show', 'edit', 'update']);
  });

  it('resolves selected withTrashed resource actions without exposing syntax to consumers', () => {
    const fact = {
      method: 'resource',
      resource: 'photos',
      controller: 'PhotoController',
      withTrashed: ['show'], names: undefined, parameters: undefined,
    };
    const contract = resolveRouteResourceFact(fact);
    assert.equal(contract.withTrashed.kind, 'selected_actions');
    assert.deepEqual(contract.withTrashed.actions.map(action => action.value.value), ['show']);
  });

  it('does not invent create/edit actions for apiResource', () => {
    const contract = resolveRouteResourceFact({
      method: 'apiResource', resource: createResourceName('photos'), controller: createControllerName('PhotoController'), withTrashed: [],
    });
    assert.deepEqual(contract.actions.map(action => action.value.value), ['index', 'store', 'show', 'update', 'destroy']);
    assert.deepEqual(contract.withTrashed.actions.map(action => action.value.value), ['show', 'update']);
  });
});

it('resolves Laravel only(...) upstream and keeps the flow free of selection logic', () => {
  const contract = resolveRouteResourceFact({
    method: 'resource', resource: createResourceName('photos'), controller: createControllerName('PhotoController'), withTrashed: undefined, names: undefined, parameters: undefined,
    actionFilter: { kind: 'only', actions: [stringValue('index'), stringValue('show')] },
  });
  assert.deepEqual(contract.actions.map(action => action.value.value), ['index', 'show']);
  assert.equal(contract.selection.kind, 'only');
});

it('resolves Laravel except(...) upstream', () => {
  const contract = resolveRouteResourceFact({
    method: 'resource', resource: createResourceName('photos'), controller: createControllerName('PhotoController'), withTrashed: undefined, names: undefined, parameters: undefined,
    actionFilter: { kind: 'except', actions: [stringValue('create'), stringValue('destroy')] },
  });
  assert.deepEqual(contract.actions.map(action => action.value.value), ['index', 'store', 'show', 'edit', 'update']);
  assert.equal(contract.selection.kind, 'except');
});

it('elevates Laravel names(...) into route-name ADT upstream', () => {
  const contract = resolveRouteResourceFact({
    method: 'resource', resource: createResourceName('photos'), controller: createControllerName('PhotoController'),
    withTrashed: undefined, actionFilter: { kind: 'only', actions: [stringValue('create'), stringValue('show')] },
    names: { overrides: [
      { action: stringValue('create'), name: stringValue('photos.build') },
      { action: stringValue('show'), name: stringValue('photos.view') },
      { action: stringValue('destroy'), name: stringValue('photos.remove') },
    ] },
    parameters: undefined,
  });
  assert.deepEqual(contract.routeNames.map(item => [item.action.value.value, item.name.value.value]), [
    ['create', 'photos.build'],
    ['show', 'photos.view'],
  ]);
});

it('elevates Laravel parameters(...) only for the declared resource', () => {
  const contract = resolveRouteResourceFact({
    method: 'resource', resource: createResourceName('users'), controller: createControllerName('AdminUserController'),
    withTrashed: undefined, actionFilter: undefined, names: undefined,
    parameters: { overrides: [
      { resource: createResourceName('users'), parameter: stringValue('admin_user') },
      { resource: createResourceName('photos'), parameter: stringValue('photo_record') },
    ] },
  });
  assert.deepEqual(contract.parameters.map(item => [item.resource.value.value, item.parameter.value.value]), [
    ['users', 'admin_user'],
  ]);
});

it('keeps fluent resource configuration in the AAT boundary for names/parameters', () => {
  const { parseRouteResourceDeclarations } = require('../../../lexer/routeAst/routeResourceDeclarationParser') as typeof import('../../../lexer/routeAst/routeResourceDeclarationParser');
  const token = (value: string, type = 'SYMBOL') => ({ value, type } as any);
  const tokens = [
    token('Route'), token('::'), token('resource'), token('('), token('photos', 'STRING'), token(','),
    token('PhotoController'), token('::'), token('class'), token(')'), token('->'), token('names'), token('('),
    token('create', 'STRING'), token('=>'), token('photos.build', 'STRING'), token(','), token('show', 'STRING'),
    token('=>'), token('photos.view', 'STRING'), token(')'), token('->'), token('parameters'), token('('),
    token('photos', 'STRING'), token('=>'), token('photo_record', 'STRING'), token(')'), token(';'),
  ];
  const ast = parseRouteResourceDeclarations(tokens as any)[0];
  assert.deepEqual(ast.names?.names.map(entry => [entry.action, entry.name]), [
    ['create', 'photos.build'], ['show', 'photos.view'],
  ]);
  assert.deepEqual(ast.parameters?.parameters.map(entry => [entry.resource, entry.parameter]), [
    ['photos', 'photo_record'],
  ]);
});
