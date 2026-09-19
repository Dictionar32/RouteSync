import type { PropertyName, VariableName } from './names';
import type { VariableNames } from './collections';
import type { ResolvedExpression, Expression } from './expression';
import type { SourceSpan } from './provenance';

export type AssignmentTarget =
  | { readonly kind: 'variable'; readonly name: VariableName }
  | { readonly kind: 'variables'; readonly names: VariableNames }
  | { readonly kind: 'property'; readonly receiver: Expression; readonly name: PropertyName }
  | { readonly kind: 'index'; readonly receiver: Expression; readonly key: Expression };

export type Assignment = {
  readonly kind: 'assignment';
  readonly target: AssignmentTarget;
  readonly expression: ResolvedExpression;
  readonly source: SourceSpan;
};
