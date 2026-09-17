import type { TokenDescriptor } from '../phpAstTypes';
import {
  createMiddlewareNameAst,
  createRoutePathLiteral,
  createRoutePrefixAst,
  type RouteDeclarationAst,
  type RoutePrefixAst,
  type MiddlewareNameAst,
} from './routeDeclarationAst';
import { findPath, METHODS, routeMethod, targetAt, targetMethods } from './routeDeclarationParserHelpers';

export function parseRouteDeclarations(tokens: readonly TokenDescriptor[]): readonly RouteDeclarationAst[] {
  const routes: RouteDeclarationAst[] = [];
  const prefixes: RoutePrefixAst[] = [];
  const middleware: MiddlewareNameAst[][] = [];
  let pendingPrefix: RoutePrefixAst | undefined;
  let pendingMiddleware: MiddlewareNameAst[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const value = tokens[i].value;
    if (value === 'prefix' && tokens[i + 2]?.type === 'STRING') pendingPrefix = createRoutePrefixAst(tokens[i + 2].value);
    if (value === 'middleware') pendingMiddleware = readMiddleware(tokens, i + 2);
    if (value === 'group') {
      if (pendingPrefix) prefixes.push(pendingPrefix);
      middleware.push(pendingMiddleware);
      pendingPrefix = undefined;
      pendingMiddleware = [];
    }
    if (value === '}' && prefixes.length) { prefixes.pop(); middleware.pop(); }
    if (value !== 'Route' || tokens[i + 1]?.value !== '::' || !METHODS.has(tokens[i + 2]?.value)) continue;
    const method = routeMethod(tokens[i + 2].value);
    if (!method) continue;
    const pathIndex = findPath(tokens, i + 3, method);
    const path = tokens[pathIndex];
    if (path?.type !== 'STRING') continue;
    const methods = targetMethods(tokens, method, i + 3);
    routes.push(Object.freeze({
      method,
      targetMethods: methods,
      path: createRoutePathLiteral(path.value),
      target: targetAt(tokens, pathIndex + 2, methods[0] ?? method),
      prefix: Object.freeze(prefixes.slice()),
      middleware: Object.freeze(middleware.flat()),
      source: tokens[i]
    }));
  }
  return Object.freeze(routes);
}

function readMiddleware(tokens: readonly TokenDescriptor[], start: number): MiddlewareNameAst[] {
  const result: MiddlewareNameAst[] = [];
  for (let i = start; i < tokens.length && tokens[i].value !== ')'; i++) if (tokens[i].type === 'STRING') result.push(createMiddlewareNameAst(tokens[i].value));
  return result;
}
