import type { RouteResourceDeclarationAst } from '../../lexer/routeAst/routeResourceDeclarationAst';
import type { RouteResourceFact, RouteResourceMiddlewareScopeFact } from '../../../../types/upstream/routeResourceFacts';
import { createControllerName, createResourceName, createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import { fromBooleanFlag, mapOptional } from '../../../../types/upstream/presence';
export type { RouteResourceFact } from '../../../../types/upstream/routeResourceFacts';

/** AAT -> typed syntax fact only. No Laravel action/default semantics are decided here. */
export function extractRouteResourceFactFromAst(ast: RouteResourceDeclarationAst): RouteResourceFact {
  const method = RESOURCE_METHOD_FACT_CATALOG[ast.method];
  return Object.freeze({
    method,
    resource: createResourceName(ast.resource),
    controller: createControllerName(ast.controller),
    withTrashed: mapOptional(ast.withTrashed, values => Object.freeze(values.map(action => stringValue(action)))),
    actionFilter: mapOptional(ast.actionFilter, value => Object.freeze({
      kind: value.kind,
      actions: Object.freeze(value.actions.map(action => stringValue(action))),
    })),
    names: mapOptional(ast.names, value => Object.freeze({
      overrides: Object.freeze(value.names.map(entry => Object.freeze({ action: stringValue(entry.action), name: stringValue(entry.name) }))),
    })),
    parameters: mapOptional(ast.parameters, value => Object.freeze({
      overrides: Object.freeze(value.parameters.map(entry => Object.freeze({ resource: createResourceName(entry.resource), parameter: stringValue(entry.parameter) }))),
    })),
    shallow: fromBooleanFlag(ast.shallow),
    scoped: mapOptional(ast.scoped, value => Object.freeze(value.parameters.map(entry => Object.freeze({ parameter: createRouteParameterName(entry.parameter), key: stringValue(entry.key) })))),
    creatable: fromBooleanFlag(ast.creatable),
    destroyable: fromBooleanFlag(ast.destroyable),
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

const RESOURCE_METHOD_FACT_CATALOG: Readonly<Record<RouteResourceDeclarationAst['method'], RouteResourceFact['method']>> = Object.freeze({
  resource: { kind: 'resource' },
  apiResource: { kind: 'api_resource' },
  singleton: { kind: 'singleton' },
  apiSingleton: { kind: 'api_singleton' },
});

const RESOURCE_MIDDLEWARE_SCOPE_CATALOG = Object.freeze({
  all: () => ({ kind: 'all' as const }),
  only: (scope: RouteResourceDeclarationAst['middleware'][number]['scope']) => ({
    kind: 'only' as const,
    actions: Object.freeze(scope.actions.map(stringValue)),
  }),
  except: (scope: RouteResourceDeclarationAst['middleware'][number]['scope']) => ({
    kind: 'except' as const,
    actions: Object.freeze(scope.actions.map(stringValue)),
  }),
});

function resolveScope(scope: RouteResourceDeclarationAst['middleware'][number]['scope']): RouteResourceMiddlewareScopeFact {
  return RESOURCE_MIDDLEWARE_SCOPE_CATALOG[scope.kind](scope);
}

/** Compatibility bridge: retained for callers compiled against the previous adapter shape. */
export const routeResourceFactFromAst = extractRouteResourceFactFromAst;
