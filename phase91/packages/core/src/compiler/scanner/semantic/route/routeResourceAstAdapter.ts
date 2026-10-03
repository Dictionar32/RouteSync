import type { RouteResourceDeclarationAst } from '../../lexer/routeAst/routeResourceDeclarationAst';
import type { RouteResourceFact, RouteResourceMiddlewareScopeFact } from '../../../../types/upstream/routeResourceFacts';
import { createControllerName, createResourceName, createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import { mapOptional } from '../../../../types/upstream/presence';
export type { RouteResourceFact } from '../../../../types/upstream/routeResourceFacts';

/** AAT -> typed syntax fact only. No Laravel action/default semantics are decided here. */
export function extractRouteResourceFactFromAst(ast: RouteResourceDeclarationAst): RouteResourceFact {
  let method: RouteResourceFact['method'];
  switch (ast.method) {
    case 'resource': method = { kind: 'resource' }; break;
    case 'apiResource': method = { kind: 'api_resource' }; break;
    case 'singleton': method = { kind: 'singleton' }; break;
    case 'apiSingleton': method = { kind: 'api_singleton' }; break;
  }
  return Object.freeze({
    method,
    resource: createResourceName(ast.resource),
    controller: createControllerName(ast.controller),
    withTrashed: mapPresence(ast.withTrashed, values => Object.freeze(values.map(action => stringValue(action)))),
    actionFilter: mapPresence(ast.actionFilter, value => Object.freeze({
      kind: value.kind,
      actions: Object.freeze(value.actions.map(action => stringValue(action))),
    })),
    names: mapPresence(ast.names, value => Object.freeze({
      overrides: Object.freeze(value.names.map(entry => Object.freeze({ action: stringValue(entry.action), name: stringValue(entry.name) }))),
    })),
    parameters: mapPresence(ast.parameters, value => Object.freeze({
      overrides: Object.freeze(value.parameters.map(entry => Object.freeze({ resource: createResourceName(entry.resource), parameter: stringValue(entry.parameter) }))),
    })),
    shallow: presenceFromBoolean(ast.shallow),
    scoped: mapPresence(ast.scoped, value => Object.freeze(value.parameters.map(entry => Object.freeze({ parameter: createRouteParameterName(entry.parameter), key: stringValue(entry.key) })))),
    creatable: presenceFromBoolean(ast.creatable),
    destroyable: presenceFromBoolean(ast.destroyable),
    middleware: Object.freeze(ast.middleware.map(entry => Object.freeze({
      middleware: Object.freeze(entry.middleware.map(value => stringValue(value))),
      scope: resolveScope(entry.scope),
    }))),
    middlewareExclusions: Object.freeze(ast.middlewareExclusions.map(entry => Object.freeze({
      middleware: Object.freeze(entry.middleware.map(value => stringValue(value))),
      scope: resolveScope(entry.scope),
    }))),
  });
}


function mapPresence<T, U>(value: T | undefined, map: (value: T) => U) {
  return mapOptional(value, map);
}

function resolveScope(scope: RouteResourceDeclarationAst['middleware'][number]['scope']): RouteResourceMiddlewareScopeFact {
  switch (scope.kind) {
    case 'all': return { kind: 'all' };
    case 'only': return { kind: 'only', actions: Object.freeze(scope.actions.map(stringValue)) };
    case 'except': return { kind: 'except', actions: Object.freeze(scope.actions.map(stringValue)) };
  }
}


function presenceFromBoolean(value: boolean): { readonly kind: 'present' } | { readonly kind: 'absent' } {
  if (value) return { kind: 'present' };
  return { kind: 'absent' };
}
