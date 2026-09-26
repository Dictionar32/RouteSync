import type { AstIdentifier } from './phpAstTypes';
import type { PhpMethodAst } from './phpMethodAstTypes';

export type ServiceDeclarationAst = {
  readonly kind: 'service_declaration_ast';
  readonly className: AstIdentifier;
  readonly methods: readonly PhpMethodAst[];
};
