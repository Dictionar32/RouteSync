import type { Assignment, StaticPropertyOwner } from './assignment';
import type { PropertyName } from './names';
import type { Expression, ResolvedExpression } from './expression';
import type { ExceptionName, VariableName } from './names';
import type { VariableNames } from './collections';
import type { SourceSpan } from './provenance';
import type { HttpStatusCode } from './valueObjects';

export type SourceCatchHandler = {
  readonly kind: 'catch_handler';
  readonly variable: VariableName;
  readonly exception: ExceptionName;
  readonly body: SourceStatements;
  readonly source: SourceSpan;
};

export type SourceCatchHandlers = {
  readonly kind: 'catch_handlers';
  readonly items: import('./collections').Sequence<SourceCatchHandler>;
};

export type SourceForClause =
  | { readonly kind: 'empty' }
  | { readonly kind: 'expression'; readonly value: ResolvedExpression }
  | { readonly kind: 'assignment'; readonly value: Assignment };

export type SourceUnsetTarget =
  | { readonly kind: 'variable'; readonly name: VariableName }
  | { readonly kind: 'variables'; readonly names: VariableNames }
  | { readonly kind: 'property'; readonly receiver: Expression; readonly name: PropertyName }
  | { readonly kind: 'static_property'; readonly owner: StaticPropertyOwner; readonly name: PropertyName }
  | { readonly kind: 'index'; readonly receiver: Expression; readonly key: Expression };

export type SourceUnsetTargets = {
  readonly kind: 'source_unset_targets';
  readonly items: import('./collections').Sequence<SourceUnsetTarget>;
};

export type SourceForEachTarget =
  | { readonly kind: 'value'; readonly variable: VariableName }
  | { readonly kind: 'key_value'; readonly key: VariableName; readonly value: VariableName };

export type SourceConditionalBranches =
  | { readonly kind: 'then_only'; readonly whenTrue: SourceStatements }
  | { readonly kind: 'then_else'; readonly whenTrue: SourceStatements; readonly whenFalse: SourceStatements };

export type SourceStatement =
  | { readonly kind: 'assignment'; readonly value: Assignment; readonly source: SourceSpan }
  | { readonly kind: 'expression'; readonly value: ResolvedExpression; readonly source: SourceSpan }
  | { readonly kind: 'return'; readonly expression: ResolvedExpression; readonly source: SourceSpan }
  | { readonly kind: 'return_void'; readonly source: SourceSpan }
  | { readonly kind: 'conditional'; readonly condition: ResolvedExpression; readonly branches: SourceConditionalBranches; readonly source: SourceSpan }
  | { readonly kind: 'for_each'; readonly iterable: ResolvedExpression; readonly target: SourceForEachTarget; readonly body: SourceStatements; readonly source: SourceSpan }
  | { readonly kind: 'for_loop'; readonly initializer: SourceForClause; readonly condition: SourceForClause; readonly update: SourceForClause; readonly body: SourceStatements; readonly source: SourceSpan }
  | { readonly kind: 'transaction'; readonly body: SourceStatements; readonly source: SourceSpan }
  | { readonly kind: 'try'; readonly body: SourceStatements; readonly catches: SourceCatchHandlers; readonly source: SourceSpan }
  | { readonly kind: 'throw'; readonly error: ResolvedExpression; readonly source: SourceSpan }
  | { readonly kind: 'abort'; readonly status: HttpStatusCode; readonly message: ResolvedExpression; readonly source: SourceSpan }
  | { readonly kind: 'unset'; readonly targets: SourceUnsetTargets; readonly source: SourceSpan }
  | { readonly kind: 'include'; readonly includeKind: SourceIncludeKind; readonly expression: ResolvedExpression; readonly source: SourceSpan };

export type SourceIncludeKind =
  | { readonly kind: 'include' }
  | { readonly kind: 'include_once' }
  | { readonly kind: 'require' }
  | { readonly kind: 'require_once' };

export type SourceStatements = {
  readonly kind: 'source_statements';
  readonly items: import('./collections').Sequence<SourceStatement>;
};
