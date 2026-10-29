import type { AstIdentifier, PhpStatement, TokenDescriptor } from './phpAstTypes';
export type PhpParameterTypeAst =
  | { readonly kind: 'primitive'; readonly name: 'string' | 'int' | 'float' | 'bool' | 'mixed' | 'array' }
  | { readonly kind: 'named'; readonly name: AstIdentifier }
  | { readonly kind: 'nullable'; readonly inner: PhpParameterTypeAst };

export type PhpParameterDefaultAst =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: import('./phpAstTypes').PhpAstValue };

export interface PhpParameterAst {
  readonly type: PhpParameterTypeAst;
  readonly defaultValue: PhpParameterDefaultAst;
  readonly name: AstIdentifier;
  readonly source: TokenDescriptor;
}

export interface PhpMethodAst {
  readonly name: AstIdentifier;
  readonly parameters: readonly PhpParameterAst[];
  readonly declaredReturnType:
    | { readonly kind: 'absent' }
    | { readonly kind: 'declared'; readonly type: PhpParameterTypeAst };
  readonly body: readonly PhpStatement[];
  readonly source: TokenDescriptor;
}
