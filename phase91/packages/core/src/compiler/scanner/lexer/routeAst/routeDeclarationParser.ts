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
} from './routeDeclarationAst';
import { findPath, METHODS, routeMethod, targetAt, targetMethods } from './routeDeclarationParserHelpers';
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

export function parseRouteDeclarations(tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] {
  const routes: RouteDeclarationAst[] = [];
  const groups: GroupState[] = [];
  let pending: GroupState = emptyGroup();

  for (let i = 0; i < tokens.length; i++) {
    const value = tokens[i].value;
    if (value === 'prefix') pending = { ...pending, prefix: stringArg(tokens, i + 2, createRoutePrefixAst) };
    if (value === 'middleware') pending = { ...pending, middleware: readMiddleware(tokens, i + 2) };
    if (value === 'name') pending = { ...pending, namePrefix: stringArg(tokens, i + 2, createRouteNamePrefixAst) };
    if (value === 'controller') pending = { ...pending, controller: controllerArg(tokens, i + 2) };
    if (value === 'domain') pending = { ...pending, domain: stringArg(tokens, i + 2, createRouteDomainAst) };
    if (value === 'scopeBindings') pending = { ...pending, bindingScope: 'scoped' };
    if (value === 'withoutScopedBindings') pending = { ...pending, bindingScope: 'without_scoped' };
    if (value === 'where' && isGroupWhere(tokens, i)) {
      const parameter = stringAt(tokens, i + 2);
      const constraint = stringAt(tokens, i + 4);
      if (typeof parameter !== 'undefined' && typeof constraint !== 'undefined') {
        pending = { ...pending, constraints: [...pending.constraints, { method: 'where', parameter, value: constraint }] };
      }
    }
    if (value === 'group') {
      groups.push(pending);
      pending = emptyGroup();
    }
    if (value === '}' && groups.length) groups.pop();
    if (tokens[i].value !== 'Route' || tokens[i + 1]?.value !== '::' || !METHODS.has(tokens[i + 2]?.value)) continue;

    const method = routeMethod(tokens[i + 2].value);
    if (!method) continue;
    const pathIndex = findPath(tokens, i + 3, method);
    const path = tokens[pathIndex];
    if (path?.type !== 'STRING') continue;
    const methods = targetMethods(tokens, method, i + 3);
    const end = findDeclarationEnd(tokens, i + 2);
    const effective = mergeGroups(groups);
    routes.push(Object.freeze({
      method,
      targetMethods: methods,
      path: createRoutePathLiteral(path.value),
      target: targetAt(tokens, pathIndex + 2, methods[0] ?? method),
      bindings: parseRouteBindingDeclarations(path.value),
      prefix: Object.freeze(effective.prefixes),
      middleware: Object.freeze(effective.middleware),
      routeMiddleware: Object.freeze(readRouteMiddleware(tokens, i + 3, end)),
      groupNamePrefix: Object.freeze(effective.namePrefixes),
      groupController: effective.controller,
      groupDomain: effective.domain,
      groupBindingScope: effective.bindingScope,
      missingHandler: hasMissingHandler(tokens, i + 3, end),
      withTrashed: hasWithTrashed(tokens, i + 3, end),
      routeConstraints: Object.freeze(readRouteConstraints(tokens, i + 3, end).map(item => ({
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
      source: tokens[i],
      end,
    }));
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

function constraintValueAst(value: string | undefined) {
  if (typeof value === 'undefined') return undefined;
  return createRouteConstraintValueAst(value);
}

function stringArg<T>(tokens: readonly TokenDescriptor[], index: number, factory: (value: string) => T): T | undefined {
  let value: string | undefined;
  if (tokens[index]?.type === 'STRING') value = tokens[index].value;
  if (typeof value === 'undefined') return undefined;
  return factory(value);
}

function stringAt(tokens: readonly TokenDescriptor[], index: number): string | undefined {
  if (tokens[index]?.type !== 'STRING') return undefined;
  return tokens[index].value;
}

function controllerArg(tokens: readonly TokenDescriptor[], index: number): RouteControllerAst | undefined {
  let identifier: string | undefined;
  if (tokens[index]?.type === 'IDENTIFIER') identifier = tokens[index].value;
  if (typeof identifier === 'undefined') return undefined;
  if (tokens[index + 1]?.value === '::' && tokens[index + 2]?.value === 'class') return createRouteControllerAst(identifier);
  return undefined;
}

function readMiddleware(tokens: readonly TokenDescriptor[], start: number): MiddlewareNameAst[] {
  const result: MiddlewareNameAst[] = [];
  for (let i = start; i < tokens.length && tokens[i].value !== ')'; i++) if (tokens[i].type === 'STRING') result.push(createMiddlewareNameAst(tokens[i].value));
  return result;
}

function isGroupWhere(tokens: readonly TokenDescriptor[], index: number): boolean {
  for (let i = index + 1; i < tokens.length; i++) {
    const value = tokens[i].value;
    if (value === 'group') return true;
    if (value === 'Route' && tokens[i + 1]?.value === '::') return false;
    if (value === '}' || value === ';') return false;
  }
  return false;
}


function hasWithTrashed(
  tokens: readonly TokenDescriptor[],
  start: number,
  end: TokenDescriptor,
): boolean {
  const endIndex = tokens.indexOf(end);
  if (endIndex < 0) return false;
  for (let i = start; i < endIndex; i++) {
    if (tokens[i].value === 'withTrashed') return true;
  }
  return false;
}

function readRouteConstraints(
  tokens: readonly TokenDescriptor[],
  start: number,
  end: TokenDescriptor,
): { method: 'where' | 'whereNumber' | 'whereAlpha' | 'whereAlphaNumeric' | 'whereUuid' | 'whereUlid' | 'whereIn'; parameter: string; value: string | undefined; values: readonly string[] }[] {
  const result: { method: 'where' | 'whereNumber' | 'whereAlpha' | 'whereAlphaNumeric' | 'whereUuid' | 'whereUlid' | 'whereIn'; parameter: string; value: string | undefined; values: readonly string[] }[] = [];
  const endIndex = tokens.indexOf(end);
  if (endIndex < 0) return result;
  const methods = new Set(['where', 'whereNumber', 'whereAlpha', 'whereAlphaNumeric', 'whereUuid', 'whereUlid', 'whereIn']);
  for (let i = start; i < endIndex; i++) {
    const method = tokens[i].value;
    if (!methods.has(method)) continue;
    const parameter = stringAt(tokens, i + 2);
    if (typeof parameter === 'undefined') continue;
    if (method === 'where') {
      const value = stringAt(tokens, i + 4);
      if (typeof value !== 'undefined') result.push({ method: 'where', parameter, value, values: [] });
    } else if (method === 'whereIn') {
      const values = readWhereInValues(tokens, i + 4, endIndex);
      if (values.length) result.push({ method: 'whereIn', parameter, value: undefined, values });
    } else {
      result.push({ method: method as typeof result[number]['method'], parameter, value: undefined, values: [] });
    }
  }
  return result;
}

function readWhereInValues(
  tokens: readonly TokenDescriptor[],
  start: number,
  endIndex: number,
): readonly string[] {
  const values: string[] = [];
  let inArray = false;
  let depth = 0;
  let current: string[] = [];

  const flush = (): void => {
    const expression = current.join('').trim();
    if (expression.length > 0) values.push(expression);
    current = [];
  };

  for (let i = start; i < endIndex; i++) {
    const value = tokens[i].value;
    if (!inArray) {
      if (value === '[') inArray = true;
      continue;
    }
    if (value === ']') {
      flush();
      break;
    }
    if (value === '(' || value === '[' || value === '{') depth++;
    if (value === ')' || value === ']' || value === '}') depth--;
    if (value === ',' && depth === 0) {
      flush();
      continue;
    }
    if (tokens[i].type === 'STRING') {
      current.push(tokens[i].value);
    } else {
      current.push(value);
    }
  }
  return Object.freeze(values);
}

function readRouteMiddleware(
  tokens: readonly TokenDescriptor[],
  start: number,
  end: TokenDescriptor,
): MiddlewareNameAst[] {
  const result: MiddlewareNameAst[] = [];
  const endIndex = tokens.indexOf(end);
  if (endIndex < 0) return result;
  for (let i = start; i < endIndex; i++) {
    if (tokens[i].value !== 'middleware') continue;
    result.push(...readMiddleware(tokens, i + 2));
  }
  return result;
}

function hasMissingHandler(
  tokens: readonly TokenDescriptor[],
  start: number,
  end: TokenDescriptor,
): boolean {
  const endIndex = tokens.indexOf(end);
  if (endIndex < 0) return false;
  for (let i = start; i < endIndex; i++) {
    if (tokens[i].value === 'missing' && tokens[i - 1]?.value === ')') return true;
  }
  return false;
}

function findDeclarationEnd(tokens: readonly TokenDescriptor[], methodIndex: number): TokenDescriptor {
  let depth = 0;
  let opened = false;
  for (let i = methodIndex; i < tokens.length; i++) {
    const value = tokens[i].value;
    if (value === '(') { depth += 1; opened = true; continue; }
    if (value === ')' && opened) { depth -= 1; if (depth === 0) return tokens[i]; }
  }
  return tokens[Math.min(methodIndex, tokens.length - 1)];
}
