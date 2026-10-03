import type { TokenDescriptor } from '../phpAstTypes';
import {
  createMiddlewareNameAst,
  createRoutePathLiteral,
  createRoutePrefixAst,
  createRouteNamePrefixAst,
  createRouteControllerAst,
  createRouteDomainAst,
  createRouteConstraintParameterAst,
  createRouteConstraintValueAst,
  type RouteDeclarationAst,
  type RoutePrefixAst,
  type MiddlewareNameAst,
  type RouteNamePrefixAst,
  type RouteControllerAst,
  type RouteDomainAst,
  type LaravelRouteMethod,
  type RouteTargetAst,
} from './routeDeclarationAst';
import { TokenCursor } from './tokenCursor';
import { fromOptional } from '../../../../types/upstream/presence';
import { parseRouteBindingDeclarations } from './routeBindingDeclarationAst';

interface GroupState {
  readonly prefix?: RoutePrefixAst;
  readonly middleware: readonly MiddlewareNameAst[];
  readonly namePrefix?: RouteNamePrefixAst;
  readonly controller?: RouteControllerAst;
  readonly domain?: RouteDomainAst;
  readonly bindingScope: 'default' | 'scoped' | 'without_scoped';
  readonly constraints: readonly { readonly method: 'where'; readonly parameter: string; readonly value: string }[];
}

const ROUTE_METHODS: Readonly<Record<string, LaravelRouteMethod>> = Object.freeze({
  get: 'get', post: 'post', put: 'put', patch: 'patch', delete: 'delete',
  options: 'options', head: 'head', match: 'match', any: 'any', apiResource: 'apiResource',
});

const ROUTE_CONSTRAINT_METHODS = new Set(['where', 'whereNumber', 'whereAlpha', 'whereAlphaNumeric', 'whereUuid', 'whereUlid', 'whereIn']);

type ConstraintMethod = 'where' | 'whereNumber' | 'whereAlpha' | 'whereAlphaNumeric' | 'whereUuid' | 'whereUlid' | 'whereIn';

export function parseRouteDeclarations(tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] {
  const routes: RouteDeclarationAst[] = [];
  const groups: GroupState[] = [];
  let pending: GroupState = emptyGroup();
  let cursor = TokenCursor.start(tokens);

  while (!cursor.atEnd) {
    const token = cursor.current;
    if (!token) break;
    const value = token.value;

    if (value === 'prefix') pending = { ...pending, prefix: stringCallArgument(cursor, createRoutePrefixAst) };
    if (value === 'middleware') pending = { ...pending, middleware: readMiddleware(cursor.callArgumentCursor) };
    if (value === 'name') pending = { ...pending, namePrefix: stringCallArgument(cursor, createRouteNamePrefixAst) };
    if (value === 'controller') pending = { ...pending, controller: controllerCallArgument(cursor) };
    if (value === 'domain') pending = { ...pending, domain: stringCallArgument(cursor, createRouteDomainAst) };
    if (value === 'scopeBindings') pending = { ...pending, bindingScope: 'scoped' };
    if (value === 'withoutScopedBindings') pending = { ...pending, bindingScope: 'without_scoped' };
    if (value === 'where' && isGroupWhere(cursor)) {
      const parameter = stringAt(cursor.callArgumentCursor);
      const constraint = stringAt(cursor.secondCallArgumentCursor);
      if (parameter !== undefined && constraint !== undefined) {
        pending = { ...pending, constraints: [...pending.constraints, { method: 'where', parameter, value: constraint }] };
      }
    }
    if (value === 'group') {
      groups.push(pending);
      pending = emptyGroup();
    }
    if (value === '}' && groups.length) groups.pop();

    const method = routeMethodAt(cursor);
    if (method) {
      const pathCursor = findPathCursor(cursor.callArgumentCursor, method);
      const path = pathCursor?.current;
      if (path?.type === 'STRING') {
        const end = findDeclarationEnd(cursor.afterNextCursor);
        const effective = mergeGroups(groups);
        const methods = targetMethods(cursor.callArgumentCursor, method);
        const targetMethodPresence = fromOptional(methods[0]);
        const targetMethod = Object.freeze({
          absent: () => method,
          present: (present: Extract<typeof targetMethodPresence, { kind: 'present' }>) => present.value,
        })[targetMethodPresence.kind](targetMethodPresence as never);

        routes.push(Object.freeze({
          method,
          targetMethods: methods,
          path: createRoutePathLiteral(path.value),
          target: targetAt(pathCursor, targetMethod),
          bindings: parseRouteBindingDeclarations(path.value),
          prefix: Object.freeze(effective.prefixes),
          middleware: Object.freeze(effective.middleware),
          routeMiddleware: Object.freeze(readRouteMiddleware(cursor.callArgumentCursor, end)),
          groupNamePrefix: Object.freeze(effective.namePrefixes),
          groupController: effective.controller,
          groupDomain: effective.domain,
          groupBindingScope: effective.bindingScope,
          missingHandler: hasMissingHandler(cursor.callArgumentCursor, end),
          withTrashed: hasWithTrashed(cursor.callArgumentCursor, end),
          routeConstraints: Object.freeze(readRouteConstraints(cursor.callArgumentCursor, end).map(item => ({
            method: item.method,
            parameter: createRouteConstraintParameterAst(item.parameter),
            value: constraintValueAst(item.value),
            values: Object.freeze(item.values.map(createRouteConstraintValueAst)),
          }))),
          groupConstraints: Object.freeze(effective.constraints.map(item => ({
            method: item.method,
            parameter: createRouteConstraintParameterAst(item.parameter),
            value: createRouteConstraintValueAst(item.value),
            values: Object.freeze([]),
          }))),
          source: cursor.current as TokenDescriptor,
          end: end.terminal as TokenDescriptor,
        }));
      }
    }

    cursor = cursor.advance();
  }
  return Object.freeze(routes);
}

function emptyGroup(): GroupState {
  return { middleware: Object.freeze([]), bindingScope: 'default', constraints: Object.freeze([]) };
}

function mergeGroups(groups: readonly GroupState[]) {
  const prefixes: RoutePrefixAst[] = [];
  const middleware: MiddlewareNameAst[] = [];
  const namePrefixes: RouteNamePrefixAst[] = [];
  const constraints: { method: 'where'; parameter: string; value: string }[] = [];
  let controller: RouteControllerAst | undefined;
  let domain: RouteDomainAst | undefined;
  let bindingScope: 'default' | 'scoped' | 'without_scoped' = 'default';
  for (const group of groups) {
    if (group.prefix) prefixes.push(group.prefix);
    middleware.push(...group.middleware);
    if (group.namePrefix) namePrefixes.push(group.namePrefix);
    if (group.controller) controller = group.controller;
    if (group.domain) domain = group.domain;
    if (group.bindingScope !== 'default') bindingScope = group.bindingScope;
    constraints.push(...group.constraints);
  }
  return { prefixes, middleware, namePrefixes, controller, domain, bindingScope, constraints };
}

function routeMethodAt(cursor: TokenCursor): LaravelRouteMethod | undefined {
  if (cursor.current?.value !== 'Route' || cursor.next?.value !== '::') return undefined;
  const methodName = cursor.afterNext?.value;
  if (methodName === undefined) return undefined;
  return ROUTE_METHODS[methodName];
}

function stringCallArgument<T>(cursor: TokenCursor, factory: (value: string) => T): T | undefined {
  const argument = cursor.callArgument;
  return argument?.type === 'STRING' ? factory(argument.value) : undefined;
}

function stringAt(cursor: TokenCursor): string | undefined {
  const token = cursor.current;
  return token?.type === 'STRING' ? token.value : undefined;
}

function controllerCallArgument(cursor: TokenCursor): RouteControllerAst | undefined {
  const argumentCursor = cursor.callArgumentCursor;
  const identifier = argumentCursor.current;
  if (identifier?.type !== 'IDENTIFIER' || !argumentCursor.classReference) return undefined;
  return createRouteControllerAst(identifier.value);
}

function readMiddleware(start: TokenCursor): MiddlewareNameAst[] {
  const result: MiddlewareNameAst[] = [];
  let cursor = start;
  while (!cursor.atEnd && cursor.current?.value !== ')') {
    if (cursor.current?.type === 'STRING') result.push(createMiddlewareNameAst(cursor.current.value));
    cursor = cursor.advance();
  }
  return result;
}

function isGroupWhere(cursor: TokenCursor): boolean {
  let at = cursor.nextCursor;
  while (!at.atEnd) {
    const value = at.current?.value;
    if (value === 'group') return true;
    if (value === 'Route' && at.next?.value === '::') return false;
    if (value === '}' || value === ';') return false;
    at = at.advance();
  }
  return false;
}

function findPathCursor(start: TokenCursor, method: LaravelRouteMethod): TokenCursor | undefined {
  return start.find((token, at) => token.type === 'STRING' && routeTargetMethodContext(at, method));
}

function routeTargetMethodContext(cursor: TokenCursor, method: LaravelRouteMethod): boolean {
  if (method === 'match' || method === 'any') return true;
  return cursor.current?.type === 'STRING';
}

function targetMethods(start: TokenCursor, method: LaravelRouteMethod): readonly LaravelRouteMethod[] {
  if (method !== 'match') return Object.freeze([method]);
  const argument = start.find(token => token.value === '[');
  if (!argument) return Object.freeze([method]);
  const methods: LaravelRouteMethod[] = [];
  let cursor = argument.advance();
  while (!cursor.atEnd && cursor.current?.value !== ']') {
    const methodName = cursor.current?.value;
    if (methodName === undefined) { cursor = cursor.advance(); continue; }
    const resolved = ROUTE_METHODS[methodName];
    if (resolved && !methods.includes(resolved)) methods.push(resolved);
    cursor = cursor.advance();
  }
  return Object.freeze(methods.length ? methods : [method]);
}

function targetAt(path: TokenCursor, method: LaravelRouteMethod): RouteTargetAst {
  const argument = path.nextCursor.nextCursor;
  const target = argument.current;
  if (target?.type === 'IDENTIFIER' && argument.classReference) {
    return { kind: 'controller_invokable', controller: { kind: 'identifier', value: target.value } };
  }
  if (target?.value === '[') {
    const controllerCursor = argument.nextCursor;
    const controller = controllerCursor.current;
    const actionCursor = controllerCursor.nextCursor.nextCursor.nextCursor;
    const action = actionCursor.current;
    if (controller?.type === 'IDENTIFIER' && controllerCursor.classReference && action?.type === 'STRING') {
      return {
        kind: 'controller_action',
        controller: { kind: 'identifier', value: controller.value },
        action: { kind: 'identifier', value: action.value },
      };
    }
  }
  return { kind: 'closure', action: { kind: 'identifier', value: method }, returns: [] };
}

function findDeclarationEnd(start: TokenCursor): TokenCursor {
  let depth = 0;
  let opened = false;
  let cursor = start;
  while (!cursor.atEnd) {
    const value = cursor.current?.value;
    if (value === '(') { depth += 1; opened = true; }
    if (value === ')' && opened) {
      depth -= 1;
      if (depth === 0) return cursor;
    }
    cursor = cursor.advance();
  }
  return cursor;
}

function constraintValueAst(value: string | undefined) {
  if (value === undefined) return undefined;
  return createRouteConstraintValueAst(value);
}

function inRange(start: TokenCursor, end: TokenCursor, predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): TokenCursor | undefined {
  return start.find((token, cursor) => !cursor.isBefore(end) ? false : predicate(token, cursor));
}

function hasWithTrashed(start: TokenCursor, end: TokenCursor): boolean {
  return inRange(start, end, token => token.value === 'withTrashed') !== undefined;
}

function readRouteConstraints(
  start: TokenCursor,
  end: TokenCursor,
): { method: ConstraintMethod; parameter: string; value: string | undefined; values: readonly string[] }[] {
  const result: { method: ConstraintMethod; parameter: string; value: string | undefined; values: readonly string[] }[] = [];
  let cursor = start;
  while (cursor.isBefore(end)) {
    const method = cursor.current?.value;
    if (method && ROUTE_CONSTRAINT_METHODS.has(method)) {
      const parameter = stringAt(cursor.callArgumentCursor);
      if (parameter !== undefined) {
        if (method === 'where') {
          const value = stringAt(cursor.secondCallArgumentCursor);
          if (value !== undefined) result.push({ method, parameter, value, values: [] });
        } else if (method === 'whereIn') {
          const values = readWhereInValues(cursor.secondCallArgumentCursor, end);
          if (values.length) result.push({ method, parameter, value: undefined, values });
        } else {
          result.push({ method: method as ConstraintMethod, parameter, value: undefined, values: [] });
        }
      }
    }
    cursor = cursor.advance();
  }
  return result;
}

function readWhereInValues(start: TokenCursor, end: TokenCursor): readonly string[] {
  const values: string[] = [];
  let inArray = false;
  let depth = 0;
  let current: string[] = [];
  const flush = (): void => {
    const expression = current.join('').trim();
    if (expression.length > 0) values.push(expression);
    current = [];
  };
  let cursor = start;
  while (cursor.isBefore(end)) {
    const token = cursor.current;
    if (!token) break;
    const value = token.value;
    if (!inArray) {
      if (value === '[') inArray = true;
      cursor = cursor.advance();
      continue;
    }
    if (value === ']') { flush(); break; }
    if (value === '(' || value === '[' || value === '{') depth += 1;
    if (value === ')' || value === ']' || value === '}') depth -= 1;
    if (value === ',' && depth === 0) { flush(); cursor = cursor.advance(); continue; }
    current.push(value);
    cursor = cursor.advance();
  }
  return Object.freeze(values);
}

function readRouteMiddleware(start: TokenCursor, end: TokenCursor): MiddlewareNameAst[] {
  const result: MiddlewareNameAst[] = [];
  let cursor = start;
  while (cursor.isBefore(end)) {
    if (cursor.current?.value === 'middleware') result.push(...readMiddleware(cursor.callArgumentCursor));
    cursor = cursor.advance();
  }
  return result;
}

function hasMissingHandler(start: TokenCursor, end: TokenCursor): boolean {
  return inRange(start, end, (token, cursor) => token.value === 'missing' && cursor.previous?.value === ')') !== undefined;
}
