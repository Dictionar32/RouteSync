import type { PropertyName, VariableName } from './names';
import type { VariableNames } from './collections';
import type { Expression, ResolvedExpression } from './expression';
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


export type AssignmentTargetVisitor<R> = {
  readonly variable: (target: Extract<AssignmentTarget, { readonly kind: 'variable' }>) => R;
  readonly variables: (target: Extract<AssignmentTarget, { readonly kind: 'variables' }>) => R;
  readonly property: (target: Extract<AssignmentTarget, { readonly kind: 'property' }>) => R;
  readonly index: (target: Extract<AssignmentTarget, { readonly kind: 'index' }>) => R;
};

export function matchAssignmentTarget<R>(target: AssignmentTarget, visitor: AssignmentTargetVisitor<R>): R {
  switch (target.kind) {
    case 'variable': return visitor.variable(target);
    case 'variables': return visitor.variables(target);
    case 'property': return visitor.property(target);
    case 'index': return visitor.index(target);
  }
}
