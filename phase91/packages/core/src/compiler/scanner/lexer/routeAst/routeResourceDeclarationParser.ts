import type { TokenDescriptor } from '../phpAstTypes';
import {
  createRouteResourceActionAst,
  createRouteResourceControllerAst,
  createRouteResourceNameAst,
  createRouteResourceRouteNameAst,
  createRouteResourceParameterAst,
  type RouteResourceDeclarationAst,
  type RouteResourceMethodAst,
} from './routeResourceDeclarationAst';

/** AAT extraction only: this parser preserves resource syntax; it does not decide Laravel semantics. */
export function parseRouteResourceDeclarations(
  tokens: readonly TokenDescriptor[],
): readonly RouteResourceDeclarationAst[] {
  const result: RouteResourceDeclarationAst[] = [];
  for (let i = 0; i < tokens.length - 7; i += 1) {
    if (tokens[i]?.value !== 'Route' || tokens[i + 1]?.value !== '::') continue;
    const method = tokens[i + 2]?.value;
    if (method !== 'resource' && method !== 'apiResource' && method !== 'singleton' && method !== 'apiSingleton') continue;
    let resource: string | undefined;
    if (tokens[i + 4]?.type === 'STRING') resource = tokens[i + 4].value;
    const controller = readController(tokens, i + 6);
    if (typeof resource === 'undefined' || typeof controller === 'undefined') continue;
    const end = findStatementEnd(tokens, i + 2);
    const withTrashed = readWithTrashed(tokens, i + 7, end);
    const actionFilter = readActionFilter(tokens, i + 7, end);
    const names = readPairMap(tokens, i + 7, end, 'names');
    const parameters = readPairMap(tokens, i + 7, end, 'parameters');
    const shallow = hasCall(tokens, i + 7, end, 'shallow');
    const scoped = readScoped(tokens, i + 7, end);
    const creatable = hasCall(tokens, i + 7, end, 'creatable');
    const destroyable = hasCall(tokens, i + 7, end, 'destroyable');
    const middleware = readResourceMiddleware(tokens, i + 7, end, 'middleware');
    const middlewareFor = readResourceMiddleware(tokens, i + 7, end, 'middlewareFor');
    const withoutMiddlewareFor = readResourceMiddleware(tokens, i + 7, end, 'withoutMiddlewareFor');
    const declaration = {
      method: method as RouteResourceMethodAst,
      resource: createRouteResourceNameAst(resource),
      controller: createRouteResourceControllerAst(controller),
      shallow,
      creatable,
      destroyable,
      middleware,
      middlewareExclusions: withoutMiddlewareFor,
      source: tokens[i],
    } as Omit<RouteResourceDeclarationAst, 'withTrashed' | 'actionFilter' | 'names' | 'parameters' | 'scoped'> &
      Partial<Pick<RouteResourceDeclarationAst, 'withTrashed' | 'actionFilter' | 'names' | 'parameters' | 'scoped'>>;
    if (typeof withTrashed !== 'undefined') declaration.withTrashed = Object.freeze(withTrashed.map(createRouteResourceActionAst));
    if (typeof actionFilter !== 'undefined') {
      declaration.actionFilter = Object.freeze({
        kind: actionFilter.kind,
        actions: Object.freeze(actionFilter.actions.map(createRouteResourceActionAst)),
      });
    }
    if (typeof names !== 'undefined') {
      declaration.names = Object.freeze({
        names: Object.freeze(names.map(entry => Object.freeze({
          action: createRouteResourceActionAst(entry.key),
          name: createRouteResourceRouteNameAst(entry.value),
        }))),
      });
    }
    if (typeof parameters !== 'undefined') {
      declaration.parameters = Object.freeze({
        parameters: Object.freeze(parameters.map(entry => Object.freeze({
          resource: createRouteResourceNameAst(entry.key),
          parameter: createRouteResourceParameterAst(entry.value),
        }))),
      });
    }
    if (typeof scoped !== 'undefined') {
      declaration.scoped = Object.freeze({
        parameters: Object.freeze(scoped.map(entry => Object.freeze({
          parameter: createRouteResourceParameterAst(entry.parameter),
          key: createRouteResourceParameterAst(entry.key),
        }))),
      });
    }
    result.push(Object.freeze(declaration as RouteResourceDeclarationAst));
  }
  return Object.freeze(result);
}

function readController(tokens: readonly TokenDescriptor[], index: number): string | undefined {
  if (tokens[index]?.type !== 'IDENTIFIER') return undefined;
  if (tokens[index + 1]?.value !== '::' || tokens[index + 2]?.value !== 'class') return undefined;
  return tokens[index].value;
}

function findStatementEnd(tokens: readonly TokenDescriptor[], start: number): number {
  let depth = 0;
  for (let i = start; i < tokens.length; i += 1) {
    if (tokens[i].value === '(' || tokens[i].value === '[' || tokens[i].value === '{') depth += 1;
    if (tokens[i].value === ')' || tokens[i].value === ']' || tokens[i].value === '}') {
      depth = Math.max(0, depth - 1);
    }
    // A resource declaration may continue through a fluent chain such as
    // ->only(...)->names(...)->parameters(...), so ')' cannot be the end.
    if (tokens[i].value === ';' && depth === 0) return i;
  }
  return tokens.length;
}

function readWithTrashed(
  tokens: readonly TokenDescriptor[],
  start: number,
  end: number,
): readonly string[] | undefined {
  for (let i = start; i < end; i += 1) {
    if (tokens[i].value !== 'withTrashed' || tokens[i + 1]?.value !== '(') continue;
    if (tokens[i + 2]?.value === ')') return [];
    const actions: string[] = [];
    for (let j = i + 2; j < end && tokens[j].value !== ')'; j += 1) {
      if (tokens[j].type === 'STRING') actions.push(tokens[j].value);
    }
    return actions;
  }
  return undefined;
}

function readActionFilter(
  tokens: readonly TokenDescriptor[],
  start: number,
  end: number,
): { readonly kind: 'only' | 'except'; readonly actions: readonly string[] } | undefined {
  for (let i = start; i < end; i += 1) {
    const value = tokens[i].value;
    if (value !== 'only' && value !== 'except') continue;
    if (tokens[i + 1]?.value !== '(') continue;
    const actions: string[] = [];
    for (let j = i + 2; j < end && tokens[j].value !== ')'; j += 1) {
      if (tokens[j].type === 'STRING') actions.push(tokens[j].value);
    }
    return { kind: value, actions };
  }
  return undefined;
}

function readPairMap(
  tokens: readonly TokenDescriptor[],
  start: number,
  end: number,
  method: 'names' | 'parameters',
): readonly { readonly key: string; readonly value: string }[] | undefined {
  for (let i = start; i < end; i += 1) {
    if (tokens[i].value !== method || tokens[i + 1]?.value !== '(') continue;
    const pairs: { key: string; value: string }[] = [];
    for (let j = i + 2; j < end && tokens[j].value !== ')'; j += 1) {
      if (tokens[j].type !== 'STRING') continue;
      const key = tokens[j].value;
      let k = j + 1;
      while (k < end && tokens[k].value !== '=>' && tokens[k].value !== ')') k += 1;
      if (tokens[k]?.value !== '=>' || tokens[k + 1]?.type !== 'STRING') continue;
      pairs.push({ key, value: tokens[k + 1].value });
      j = k + 1;
    }
    return Object.freeze(pairs);
  }
  return undefined;
}

function hasCall(tokens: readonly TokenDescriptor[], start: number, end: number, method: string): boolean {
  for (let i = start; i < end; i += 1) {
    if (tokens[i].value === method && tokens[i + 1]?.value === '(') return true;
  }
  return false;
}

function readScoped(tokens: readonly TokenDescriptor[], start: number, end: number): readonly { readonly parameter: string; readonly key: string }[] | undefined {
  for (let i = start; i < end; i += 1) {
    if (tokens[i].value !== 'scoped' || tokens[i + 1]?.value !== '(') continue;
    const result: { parameter: string; key: string }[] = [];
    for (let j = i + 2; j < end && tokens[j].value !== ')'; j += 1) {
      if (tokens[j].type !== 'STRING') continue;
      const parameter = tokens[j].value;
      let k = j + 1;
      while (k < end && tokens[k].value !== '=>' && tokens[k].value !== ')') k += 1;
      if (tokens[k]?.value !== '=>' || tokens[k + 1]?.type !== 'STRING') continue;
      result.push({ parameter, key: tokens[k + 1].value });
      j = k + 1;
    }
    return Object.freeze(result);
  }
  return undefined;
}


function readResourceMiddleware(
  tokens: readonly TokenDescriptor[],
  start: number,
  end: number,
  method: 'middleware' | 'middlewareFor' | 'withoutMiddlewareFor',
): readonly import('./routeResourceDeclarationAst').RouteResourceMiddlewareAst[] {
  const result: import('./routeResourceDeclarationAst').RouteResourceMiddlewareAst[] = [];
  for (let i = start; i < end; i += 1) {
    if (tokens[i].value !== method || tokens[i + 1]?.value !== '(') continue;
    const strings: string[] = [];
    for (let j = i + 2; j < end && tokens[j].value !== ')'; j += 1) {
      if (tokens[j].type === 'STRING') strings.push(tokens[j].value);
    }
    let scope: { readonly kind: 'all' | 'only'; readonly actions: readonly string[] };
    let middleware: readonly string[];
    if (method === 'middleware') {
      scope = { kind: 'all', actions: Object.freeze([]) };
      middleware = strings;
    } else {
      const actions: string[] = [];
      if (strings.length > 1) actions.push(strings[0]);
      scope = { kind: 'only', actions: Object.freeze(actions) };
      middleware = strings.slice(1);
    }
    if (middleware.length > 0) {
      result.push(Object.freeze({ middleware: Object.freeze(middleware), scope: Object.freeze(scope) }));
    }
  }
  return Object.freeze(result);
}
