import type { AstIdentifier, TokenDescriptor, SourceRange } from './phpAstCoreTypes';
import type { PhpAstValue } from './phpAstExpressionTypes';
export type PhpStaticPropertyOwner =
    | { readonly kind: 'named_class'; readonly name: AstIdentifier }
    | { readonly kind: 'self' }
    | { readonly kind: 'static' }
    | { readonly kind: 'parent' };

export type PhpAssignmentDestructuringEntry =
    | { readonly kind: 'variable'; readonly name: AstIdentifier }
    | { readonly kind: 'reference_variable'; readonly name: AstIdentifier }
    | { readonly kind: 'keyed'; readonly key: PhpAstValue; readonly target: PhpAssignmentDestructuringEntry }
    | { readonly kind: 'nested'; readonly pattern: PhpAssignmentDestructuringPattern }
    | { readonly kind: 'skipped' };
export type PhpAssignmentDestructuringPattern =
    | { readonly kind: 'list'; readonly entries: readonly PhpAssignmentDestructuringEntry[] };
export type PhpAssignmentTarget =
    | { readonly kind: 'variable'; readonly name: AstIdentifier }
    | { readonly kind: 'variables'; readonly names: readonly AstIdentifier[] }
    | { readonly kind: 'destructuring'; readonly pattern: PhpAssignmentDestructuringPattern }
    | { readonly kind: 'property'; readonly receiver: PhpAstValue; readonly property: AstIdentifier }
    | { readonly kind: 'static_property'; readonly owner: PhpStaticPropertyOwner; readonly property: AstIdentifier }
    | { readonly kind: 'array_element'; readonly target: PhpAstValue; readonly index: PhpAstValue }
    | { readonly kind: 'append'; readonly target: PhpAstValue };

export type PhpAssignmentReference =
    | { readonly kind: 'by_value' }
    | { readonly kind: 'by_reference' };

export type PhpAssignmentOperator =
    | { readonly kind: 'set' }
    | { readonly kind: 'add' }
    | { readonly kind: 'subtract' }
    | { readonly kind: 'multiply' }
    | { readonly kind: 'divide' }
    | { readonly kind: 'modulo' }
    | { readonly kind: 'concatenate' }
    | { readonly kind: 'null_coalesce' }
    | { readonly kind: 'power' }
    | { readonly kind: 'bitwise_and' }
    | { readonly kind: 'bitwise_or' }
    | { readonly kind: 'bitwise_xor' }
    | { readonly kind: 'shift_left' }
    | { readonly kind: 'shift_right' };
export type PhpStatement =
    | { readonly kind: 'expression_statement'; readonly expression: PhpAstValue; readonly source: TokenDescriptor }
    | { readonly kind: 'return_with_value'; readonly expression: PhpAstValue; readonly source: TokenDescriptor }
    | { readonly kind: 'return_void'; readonly source: TokenDescriptor }
    | { readonly kind: 'unset_statement'; readonly targets: readonly PhpAssignmentTarget[]; readonly source: TokenDescriptor }
    | { readonly kind: 'assignment'; readonly target: PhpAssignmentTarget; readonly operator: PhpAssignmentOperator; readonly reference: PhpAssignmentReference; readonly value: PhpAstValue; readonly source: TokenDescriptor }
    | { readonly kind: 'if_statement'; readonly condition: PhpAstValue; readonly thenBlock: PhpBlock; readonly alternative: PhpIfAlternative; readonly source: TokenDescriptor }
    | { readonly kind: 'foreach_statement'; readonly iterable: PhpAstValue; readonly target: PhpForeachTarget; readonly body: PhpBlock; readonly source: TokenDescriptor }
    | { readonly kind: 'for_statement'; readonly initializer: PhpForClause; readonly condition: PhpForClause; readonly update: PhpForClause; readonly body: PhpBlock; readonly source: TokenDescriptor }
    | { readonly kind: 'try_statement'; readonly body: PhpBlock; readonly catches: readonly PhpCatchClause[]; readonly finallyBlock: PhpFinallyClause; readonly source: TokenDescriptor }
    | { readonly kind: 'throw_statement'; readonly expression: PhpAstValue; readonly source: TokenDescriptor }
    | { readonly kind: 'include_statement'; readonly includeKind: PhpIncludeKind; readonly expression: PhpAstValue; readonly source: TokenDescriptor };
export type PhpIncludeKind =
    | { readonly kind: 'include' }
    | { readonly kind: 'include_once' }
    | { readonly kind: 'require' }
    | { readonly kind: 'require_once' };
export type PhpIfAlternative = { readonly kind: 'none' } | { readonly kind: 'else_block'; readonly block: PhpBlock } | { readonly kind: 'else_if'; readonly statement: Extract<PhpStatement, { kind: 'if_statement' }> };
export type PhpForeachTarget = { readonly kind: 'value'; readonly variable: AstIdentifier } | { readonly kind: 'key_value'; readonly key: AstIdentifier; readonly value: AstIdentifier };
export type PhpForClause = { readonly kind: 'empty' } | { readonly kind: 'expression'; readonly value: PhpAstValue } | { readonly kind: 'assignment'; readonly target: PhpAssignmentTarget; readonly operator: PhpAssignmentOperator; readonly reference: PhpAssignmentReference; readonly value: PhpAstValue; readonly source: TokenDescriptor };
export interface PhpCatchClause { readonly exceptionType: AstIdentifier; readonly variable: AstIdentifier; readonly body: PhpBlock; readonly source: TokenDescriptor; }
export type PhpFinallyClause = { readonly kind: 'absent' } | { readonly kind: 'present'; readonly block: PhpBlock };
export interface PhpBlock { readonly kind: 'block'; readonly statements: readonly PhpStatement[]; }
export interface ParsedPhpArrayResult { readonly entries: readonly import('./phpAstExpressionTypes').PhpArrayEntry[]; readonly endIndex: number; }
