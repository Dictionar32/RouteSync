import type { AstIdentifier, TokenDescriptor } from './phpAstCoreTypes';
import type { PhpAstValue } from './phpAstExpressionTypes';
export type PhpAssignmentTarget =
    | { readonly kind: 'variable'; readonly name: AstIdentifier }
    | { readonly kind: 'variables'; readonly names: readonly AstIdentifier[] }
    | { readonly kind: 'property'; readonly target: import('./phpAstExpressionTypes').PhpPropertyPath; readonly property: AstIdentifier }
    | { readonly kind: 'array_element'; readonly target: PhpAstValue; readonly index: PhpAstValue };
export type PhpStatement =
    | { readonly kind: 'expression_statement'; readonly expression: PhpAstValue }
    | { readonly kind: 'return_with_value'; readonly expression: PhpAstValue }
    | { readonly kind: 'return_void' } | { readonly kind: 'assignment'; readonly target: PhpAssignmentTarget; readonly value: PhpAstValue }
    | { readonly kind: 'if_statement'; readonly condition: PhpAstValue; readonly thenBlock: PhpBlock; readonly alternative: PhpIfAlternative }
    | { readonly kind: 'foreach_statement'; readonly iterable: PhpAstValue; readonly target: PhpForeachTarget; readonly body: PhpBlock }
    | { readonly kind: 'for_statement'; readonly initializer: PhpForClause; readonly condition: PhpForClause; readonly update: PhpForClause; readonly body: PhpBlock }
    | { readonly kind: 'try_statement'; readonly body: PhpBlock; readonly catches: readonly PhpCatchClause[]; readonly finallyBlock: PhpFinallyClause }
    | { readonly kind: 'throw_statement'; readonly expression: PhpAstValue };
export type PhpIfAlternative = { readonly kind: 'none' } | { readonly kind: 'else_block'; readonly block: PhpBlock } | { readonly kind: 'else_if'; readonly statement: Extract<PhpStatement, { kind: 'if_statement' }> };
export type PhpForeachTarget = { readonly kind: 'value'; readonly variable: AstIdentifier } | { readonly kind: 'key_value'; readonly key: AstIdentifier; readonly value: AstIdentifier };
export type PhpForClause = { readonly kind: 'empty' } | { readonly kind: 'expression'; readonly value: PhpAstValue } | { readonly kind: 'assignment'; readonly target: PhpAssignmentTarget; readonly value: PhpAstValue };
export interface PhpCatchClause { readonly exceptionType: AstIdentifier; readonly variable: AstIdentifier; readonly body: PhpBlock; }
export type PhpFinallyClause = { readonly kind: 'absent' } | { readonly kind: 'present'; readonly block: PhpBlock };
export interface PhpBlock { readonly kind: 'block'; readonly statements: readonly PhpStatement[]; }
export interface ParsedPhpArrayResult { readonly entries: readonly import('./phpAstExpressionTypes').PhpArrayEntry[]; readonly endIndex: number; }
