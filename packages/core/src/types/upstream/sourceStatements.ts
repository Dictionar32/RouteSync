import type { Assignment } from './assignment';
import type { Expression, ResolvedExpression } from './expression';
import type { ExceptionName, VariableName } from './names';
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

export type SourceConditionalBranches =
  | { readonly kind: 'then_only'; readonly whenTrue: SourceStatements }
  | { readonly kind: 'then_else'; readonly whenTrue: SourceStatements; readonly whenFalse: SourceStatements };

export type SourceStatement =
  | { readonly kind: 'assignment'; readonly value: Assignment; readonly source: SourceSpan }
  | { readonly kind: 'expression'; readonly value: ResolvedExpression; readonly source: SourceSpan }
  | { readonly kind: 'return'; readonly expression: ResolvedExpression; readonly source: SourceSpan }
  | { readonly kind: 'return_void'; readonly source: SourceSpan }
  | { readonly kind: 'conditional'; readonly condition: ResolvedExpression; readonly branches: SourceConditionalBranches; readonly source: SourceSpan }
  | { readonly kind: 'for_each'; readonly iterable: ResolvedExpression; readonly variable: VariableName; readonly body: SourceStatements; readonly source: SourceSpan }
  | { readonly kind: 'for_loop'; readonly initializer: SourceForClause; readonly condition: SourceForClause; readonly update: SourceForClause; readonly body: SourceStatements; readonly source: SourceSpan }
  | { readonly kind: 'transaction'; readonly body: SourceStatements; readonly source: SourceSpan }
  | { readonly kind: 'try'; readonly body: SourceStatements; readonly catches: SourceCatchHandlers; readonly source: SourceSpan }
  | { readonly kind: 'throw'; readonly error: ResolvedExpression; readonly source: SourceSpan }
  | { readonly kind: 'abort'; readonly status: HttpStatusCode; readonly message: ResolvedExpression; readonly source: SourceSpan };

export type SourceStatements = {
  readonly kind: 'source_statements';
  readonly items: import('./collections').Sequence<SourceStatement>;
};
