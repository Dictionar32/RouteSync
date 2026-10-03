/**
 * AST -> semantic middleware adapter.
 *
 * This is the only route-middleware boundary in this phase that knows the
 * Laravel route declaration AST. The semantic resolver above remains AST-free.
 */
import { createActionName, createMiddlewareName } from '../../../../types/upstream/names';
import type { ActionName } from '../../../../types/upstream/names';
import type { Presence } from '../../../../types/upstream/presence';
import { fromOptional, absent } from '../../../../types/upstream/presence';
import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { ControllerMiddlewareDeclaration, ControllerMiddlewareExclusionDeclaration, RouteMiddlewareSemanticInput } from './routeMiddlewareResolver';

export function routeMiddlewareSemanticInputFromAst(
  declaration: RouteDeclarationAst,
): RouteMiddlewareSemanticInput {
  const targetActionPresence = Object.freeze({
    controller_action: (target: Extract<RouteDeclarationAst['target'], { kind: 'controller_action' }>) => fromOptional(createActionName(target.action.value)),
    controller_invokable: () => absent<ActionName>(),
    closure: (target: Extract<RouteDeclarationAst['target'], { kind: 'closure' }>) => fromOptional(createActionName(target.action.value)),
  });
  const action = targetActionPresence[declaration.target.kind](declaration.target as never) as Presence<ActionName>;
  return Object.freeze({
    action,
    groupMiddleware: Object.freeze(declaration.middleware.map(createMiddlewareName)),
    routeMiddleware: Object.freeze(declaration.routeMiddleware.map(createMiddlewareName)),
    classMiddleware: absent<readonly (import('../../../../types/upstream/names').MiddlewareName | ControllerMiddlewareDeclaration)[]>(),
    methodMiddleware: absent<readonly (import('../../../../types/upstream/names').MiddlewareName | ControllerMiddlewareDeclaration)[]>(),
    classExclusions: absent<readonly (import('../../../../types/upstream/names').MiddlewareName | ControllerMiddlewareExclusionDeclaration)[]>(),
    methodExclusions: absent<readonly (import('../../../../types/upstream/names').MiddlewareName | ControllerMiddlewareExclusionDeclaration)[]>(),
  });
}
