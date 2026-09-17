import type { AstIdentifier, TokenDescriptor } from './phpAstTypes';
import type { ControllerDeclarationAst } from './controllerAstTypes';
import { parseControllerMethod } from './controllerMethodParser';

export function parseControllerDeclaration(
  source: string,
  tokens: readonly TokenDescriptor[],
  className: AstIdentifier
): ControllerDeclarationAst {
  const methods = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value !== 'function' || tokens[i + 1]?.type !== 'IDENTIFIER') continue;
    const method = parseControllerMethod(source, tokens, i);
    if (method) methods.push(method);
  }
  return Object.freeze({ className, methods: Object.freeze(methods), source: tokens[0] });
}
