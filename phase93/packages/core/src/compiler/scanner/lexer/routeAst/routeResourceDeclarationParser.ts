import type { TokenDescriptor } from '../phpAstTypes';
import { TokenCursor } from './tokenCursor';
import {
  createRouteResourceActionAst,
  createRouteResourceControllerAst,
  createRouteResourceNameAst,
  createRouteResourceRouteNameAst,
  createRouteResourceParameterAst,
  type RouteResourceDeclarationAst,
  type RouteResourceMethodAst,
  type RouteResourceMiddlewareAst,
} from './routeResourceDeclarationAst';

/** Syntax extraction only. Laravel meaning is resolved downstream from the produced facts. */
export function parseRouteResourceDeclarations(tokens: readonly TokenDescriptor[]): readonly RouteResourceDeclarationAst[] {
  const result: RouteResourceDeclarationAst[] = [];
  let cursor = TokenCursor.start(tokens);

  while (!cursor.atEnd) {
    const route = cursor.find((token, at) => token.value === 'Route' && at.next?.value === '::');
    if (!route) break;

    const methodCursor = route.afterNextCursor;
    const methodToken = methodCursor.current;
    if (!isResourceMethod(methodToken?.value)) {
      cursor = route.advance();
      continue;
    }

    const resource = methodCursor.callArgument;
    const controllerCursor = methodCursor.secondCallArgumentCursor;
    const controller = controllerCursor.current;
    if (resource?.type !== 'STRING' || !controller || controller.type !== 'IDENTIFIER') {
      cursor = route.advance();
      continue;
    }
    if (!controllerCursor.classReference) {
      cursor = route.advance();
      continue;
    }

    const end = findStatementEnd(route);
    const fluentStart = methodCursor.afterCallCursor;
    const withTrashed = readWithTrashed(fluentStart, end);
    const actionFilter = readActionFilter(fluentStart, end);
    const names = readPairMap(fluentStart, end, 'names');
    const parameters = readPairMap(fluentStart, end, 'parameters');
    const shallow = hasCall(fluentStart, end, 'shallow');
    const scoped = readScoped(fluentStart, end);
    const creatable = hasCall(fluentStart, end, 'creatable');
    const destroyable = hasCall(fluentStart, end, 'destroyable');
    const middleware = readResourceMiddleware(fluentStart, end, 'middleware');
    const middlewareFor = readResourceMiddleware(fluentStart, end, 'middlewareFor');
    const withoutMiddlewareFor = readResourceMiddleware(fluentStart, end, 'withoutMiddlewareFor');

    const resolvedWithTrashed = optionalMap(withTrashed, values => Object.freeze(values.map(createRouteResourceActionAst)));
    const resolvedActionFilter = optionalMap(actionFilter, value => Object.freeze({ kind: value.kind, actions: Object.freeze(value.actions.map(createRouteResourceActionAst)) }));
    const resolvedNames = optionalMap(names, values => Object.freeze({ names: Object.freeze(values.map(entry => Object.freeze({ action: createRouteResourceActionAst(entry.key), name: createRouteResourceRouteNameAst(entry.value) }))) }));
    const resolvedParameters = optionalMap(parameters, values => Object.freeze({ parameters: Object.freeze(values.map(entry => Object.freeze({ resource: createRouteResourceNameAst(entry.key), parameter: createRouteResourceParameterAst(entry.value) }))) }));
    const resolvedScoped = optionalMap(scoped, values => Object.freeze({ parameters: Object.freeze(values.map(entry => Object.freeze({ parameter: createRouteResourceParameterAst(entry.parameter), key: createRouteResourceParameterAst(entry.key) }))) }));

    result.push(Object.freeze({
      method: methodToken!.value as RouteResourceMethodAst,
      resource: createRouteResourceNameAst(resource.value),
      controller: createRouteResourceControllerAst(controller.value),
      withTrashed: resolvedWithTrashed,
      actionFilter: resolvedActionFilter,
      names: resolvedNames,
      parameters: resolvedParameters,
      shallow,
      scoped: resolvedScoped,
      creatable,
      destroyable,
      middleware,
      middlewareExclusions: withoutMiddlewareFor,
      source: route.current as TokenDescriptor,
    }));
    cursor = end.atEnd ? end : end.advance();
  }
  return Object.freeze(result);
}


function optionalMap<T, R>(value: T | undefined, map: (value: T) => R): R | undefined {
  if (value === undefined) return undefined;
  return map(value);
}

function isResourceMethod(value: string | undefined): value is RouteResourceMethodAst {
  return value === 'resource' || value === 'apiResource' || value === 'singleton' || value === 'apiSingleton';
}

function findStatementEnd(start: TokenCursor): TokenCursor {
  let depth = 0;
  let cursor = start;
  while (!cursor.atEnd) {
    const value = cursor.current!.value;
    if (value === '(' || value === '[' || value === '{') depth += 1;
    if (value === ')' || value === ']' || value === '}') depth = Math.max(0, depth - 1);
    if (value === ';' && depth === 0) return cursor;
    cursor = cursor.advance();
  }
  return cursor;
}

function inRange(start: TokenCursor, end: TokenCursor, predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): TokenCursor | undefined {
  let cursor = start;
  while (!cursor.atEnd && cursor.current !== end.current) {
    if (predicate(cursor.current!, cursor)) return cursor;
    cursor = cursor.advance();
  }
  return undefined;
}

function readWithTrashed(start: TokenCursor, end: TokenCursor): readonly string[] | undefined {
  const found = inRange(start, end, (_, at) => at.current?.value === 'withTrashed' && at.callOpen?.value === '(');
  if (!found) return undefined;
  const actions: string[] = [];
  let cursor = found.callArgumentCursor;
  while (!cursor.atEnd && cursor.current !== end.current && cursor.current!.value !== ')') {
    if (cursor.current!.type === 'STRING') actions.push(cursor.current!.value);
    cursor = cursor.advance();
  }
  return Object.freeze(actions);
}

function readActionFilter(start: TokenCursor, end: TokenCursor): { readonly kind: 'only' | 'except'; readonly actions: readonly string[] } | undefined {
  const found = inRange(start, end, (_, at) => (at.current?.value === 'only' || at.current?.value === 'except') && at.callOpen?.value === '(');
  if (!found) return undefined;
  const actions: string[] = [];
  let cursor = found.callArgumentCursor;
  while (!cursor.atEnd && cursor.current !== end.current && cursor.current!.value !== ')') {
    if (cursor.current!.type === 'STRING') actions.push(cursor.current!.value);
    cursor = cursor.advance();
  }
  return { kind: found.current!.value as 'only' | 'except', actions: Object.freeze(actions) };
}

function readPairMap(start: TokenCursor, end: TokenCursor, method: 'names' | 'parameters'): readonly { readonly key: string; readonly value: string }[] | undefined {
  const found = inRange(start, end, (_, at) => at.current?.value === method && at.callOpen?.value === '(');
  if (!found) return undefined;
  const pairs: { key: string; value: string }[] = [];
  let cursor = found.callArgumentCursor;
  while (!cursor.atEnd && cursor.current !== end.current && cursor.current!.value !== ')') {
    if (cursor.current!.type !== 'STRING') { cursor = cursor.advance(); continue; }
    const key = cursor.current!.value;
    const arrow = cursor.advance().find((token, at) => token.value === '=>' || token.value === ')');
    if (!arrow || arrow.current!.value !== '=>') { cursor = arrow ? arrow : cursor.advance(); continue; }
    const value = arrow.advance().current;
    if (value?.type === 'STRING') pairs.push({ key, value: value.value });
    cursor = value ? valueCursor(value, arrow) : arrow.advance();
  }
  return Object.freeze(pairs);
}

function valueCursor(value: TokenDescriptor, arrow: TokenCursor): TokenCursor {
  const found = arrow.find(token => token === value);
  if (found) return found.advance();
  return arrow.advance();
}

function hasCall(start: TokenCursor, end: TokenCursor, method: string): boolean {
  return inRange(start, end, (_, at) => at.current?.value === method && at.callOpen?.value === '(') !== undefined;
}

function readScoped(start: TokenCursor, end: TokenCursor): readonly { readonly parameter: string; readonly key: string }[] | undefined {
  const found = inRange(start, end, (_, at) => at.current?.value === 'scoped' && at.callOpen?.value === '(');
  if (!found) return undefined;
  const result: { parameter: string; key: string }[] = [];
  let cursor = found.callArgumentCursor;
  while (!cursor.atEnd && cursor.current !== end.current && cursor.current!.value !== ')') {
    if (cursor.current!.type !== 'STRING') { cursor = cursor.advance(); continue; }
    const parameter = cursor.current!.value;
    const arrow = cursor.advance().find(token => token.value === '=>' || token.value === ')');
    if (!arrow || arrow.current!.value !== '=>') { cursor = arrow ? arrow : cursor.advance(); continue; }
    const key = arrow.advance().current;
    if (key?.type === 'STRING') result.push({ parameter, key: key.value });
    cursor = key ? valueCursor(key, arrow) : arrow.advance();
  }
  return Object.freeze(result);
}

function readResourceMiddleware(start: TokenCursor, end: TokenCursor, method: 'middleware' | 'middlewareFor' | 'withoutMiddlewareFor'): readonly RouteResourceMiddlewareAst[] {
  const result: RouteResourceMiddlewareAst[] = [];
  let cursor = start;
  while (!cursor.atEnd && cursor.current !== end.current) {
    if (cursor.current?.value !== method || cursor.callOpen?.value !== '(') { cursor = cursor.advance(); continue; }
    const strings: string[] = [];
    let arg = cursor.callArgumentCursor;
    while (!arg.atEnd && arg.current !== end.current && arg.current!.value !== ')') {
      if (arg.current!.type === 'STRING') strings.push(arg.current!.value);
      arg = arg.advance();
    }
    if (strings.length > 0) {
      if (method === 'middleware') {
        result.push(Object.freeze({ middleware: Object.freeze(strings), scope: Object.freeze({ kind: 'all', actions: Object.freeze([]) }) }));
      } else {
        const [action, ...middleware] = strings;
        if (action && middleware.length > 0) {
          result.push(Object.freeze({ middleware: Object.freeze(middleware), scope: Object.freeze({ kind: 'only', actions: Object.freeze([action]) }) }));
        }
      }
    }
    cursor = arg.atEnd ? arg : arg.advance();
  }
  return Object.freeze(result);
}
