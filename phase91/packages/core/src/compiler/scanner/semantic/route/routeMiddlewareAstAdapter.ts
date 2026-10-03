/**
 * AST -> semantic middleware adapter.
 *
 * This is the only route-middleware boundary in this phase that knows the
 * Laravel route declaration AST. The semantic resolver above remains AST-free.
 */
import { createMiddlewareName } from '../../../../types/upstream/names';
import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteMiddlewareSemanticInput } from './routeMiddlewareResolver';

export function routeMiddlewareSemanticInputFromAst(
  declaration: RouteDeclarationAst,
): RouteMiddlewareSemanticInput {
  return Object.freeze({
    groupMiddleware: Object.freeze(declaration.middleware.map(createMiddlewareName)),
    routeMiddleware: Object.freeze(declaration.routeMiddleware.map(createMiddlewareName)),
  });
}
