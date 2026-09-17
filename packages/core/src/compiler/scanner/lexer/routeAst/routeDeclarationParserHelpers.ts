import type { TokenDescriptor } from '../phpAstTypes';
import type { LaravelRouteMethod, RouteTargetAst } from './routeDeclarationAst';
import { createAstIdentifier } from '../phpAstTypes';

export const METHODS: ReadonlySet<string> = new Set([
  'get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'match', 'any', 'apiResource'
]);
const HTTP_METHODS: ReadonlySet<string> = new Set([
  'get', 'post', 'put', 'patch', 'delete', 'options', 'head'
]);

export function routeMethod(value: string): LaravelRouteMethod | undefined {
  return METHODS.has(value) ? value as LaravelRouteMethod : undefined;
}

function httpMethod(value: string): LaravelRouteMethod | undefined {
  return HTTP_METHODS.has(value) ? value as LaravelRouteMethod : undefined;
}

export function targetAt(tokens: readonly TokenDescriptor[], start: number, fallbackAction: string): RouteTargetAst {
  const open = tokens[start]?.value;
  const controller = tokens[start + (open === '[' ? 1 : 0)];
  if (controller?.type !== 'IDENTIFIER') return { kind: 'closure', action: createAstIdentifier(fallbackAction) };
  const classIndex = start + (open === '[' ? 2 : 1);
  if (tokens[classIndex]?.value !== '::' || tokens[classIndex + 1]?.value !== 'class') return { kind: 'closure', action: createAstIdentifier(fallbackAction) };
  const action = open === '[' ? tokens[classIndex + 3] : undefined;
  if (action?.type === 'STRING') return { kind: 'controller_action', controller: createAstIdentifier(controller.value), action: createAstIdentifier(action.value) };
  return { kind: 'controller_invokable', controller: createAstIdentifier(controller.value) };
}

export function targetMethods(tokens: readonly TokenDescriptor[], method: LaravelRouteMethod, start: number): readonly LaravelRouteMethod[] {
  if (method === 'any') return ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
  if (method !== 'match') return [method];
  const result: LaravelRouteMethod[] = [];
  let i = start;
  while (i < tokens.length && tokens[i].value !== '[') i++;
  for (; i < tokens.length && tokens[i].value !== ']'; i++) {
    if (tokens[i].type !== 'STRING') continue;
    const parsed = httpMethod(tokens[i].value.toLowerCase());
    if (parsed) result.push(parsed);
  }
  return Object.freeze(result);
}

export function findPath(tokens: readonly TokenDescriptor[], start: number, method: LaravelRouteMethod): number {
  if (method === 'match') {
    let i = start;
    while (i < tokens.length && tokens[i].value !== ']') i++;
    while (i < tokens.length && tokens[i].type !== 'STRING') i++;
    return i;
  }
  for (let i = start; i < tokens.length && tokens[i].value !== ')'; i++) if (tokens[i].type === 'STRING') return i;
  return tokens.length;
}
