import type { ClassName, PropertyName, VariableName } from './names';
import type { VariableNames } from './collections';
import type { Expression } from './expression';
import type { SourceSpan } from './provenance';

export type StaticPropertyOwner =
  | { readonly kind: 'named_class'; readonly name: ClassName }
  | { readonly kind: 'self' }
  | { readonly kind: 'static' }
  | { readonly kind: 'parent' };

export type AssignmentDestructuringPattern =
  | { readonly kind: 'list'; readonly entries: AssignmentDestructuringEntries };

export type AssignmentDestructuringEntry =
  | { readonly kind: 'variable'; readonly name: VariableName }
  | { readonly kind: 'reference_variable'; readonly name: VariableName }
  | { readonly kind: 'keyed'; readonly key: Expression; readonly target: AssignmentDestructuringEntry }
  | { readonly kind: 'nested'; readonly pattern: AssignmentDestructuringPattern }
  | { readonly kind: 'skipped' };

export type AssignmentDestructuringEntries =
  | { readonly kind: 'empty' }
  | { readonly kind: 'cons'; readonly head: AssignmentDestructuringEntry; readonly tail: AssignmentDestructuringEntries };

export type AssignmentReferenceMode =
  | { readonly kind: 'by_value' }
  | { readonly kind: 'by_reference' };

export type AssignmentTarget =
  | { readonly kind: 'variable'; readonly name: VariableName }
  | { readonly kind: 'variables'; readonly names: VariableNames }
  | { readonly kind: 'destructuring'; readonly pattern: AssignmentDestructuringPattern }
  | { readonly kind: 'property'; readonly receiver: Expression; readonly name: PropertyName }
  | { readonly kind: 'static_property'; readonly owner: StaticPropertyOwner; readonly name: PropertyName }
  | { readonly kind: 'index'; readonly receiver: Expression; readonly key: Expression }
  | { readonly kind: 'append'; readonly receiver: Expression };

export type AssignmentOperator =
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

export type Assignment = {
  readonly kind: 'assignment';
  readonly target: AssignmentTarget;
  readonly expression: Expression;
  readonly operator: AssignmentOperator;
  readonly reference: AssignmentReferenceMode;
  readonly source: SourceSpan;
};

export type AssignmentAst = {
  readonly kind: 'assignment_ast';
  readonly definition: Assignment;
  readonly source: SourceSpan;
};

/** Canonical source mutation vocabulary. Every mutation keeps its source datum intact. */
export type SourceMutation =
  | { readonly kind: 'assignment'; readonly value: Assignment }
  | { readonly kind: 'unset'; readonly targets: import('./sourceStatements').SourceUnsetTargets; readonly source: SourceSpan };

export type MutationAst = {
  readonly kind: 'mutation_ast';
  readonly mutation: SourceMutation;
  readonly source: SourceSpan;
};

export type AssignmentTargetVisitor<R> = {
  readonly variable: (target: Extract<AssignmentTarget, { readonly kind: 'variable' }>) => R;
  readonly variables: (target: Extract<AssignmentTarget, { readonly kind: 'variables' }>) => R;
  readonly destructuring: (target: Extract<AssignmentTarget, { readonly kind: 'destructuring' }>) => R;
  readonly property: (target: Extract<AssignmentTarget, { readonly kind: 'property' }>) => R;
  readonly static_property: (target: Extract<AssignmentTarget, { readonly kind: 'static_property' }>) => R;
  readonly index: (target: Extract<AssignmentTarget, { readonly kind: 'index' }>) => R;
  readonly append: (target: Extract<AssignmentTarget, { readonly kind: 'append' }>) => R;
};

export function matchAssignmentTarget<R>(target: AssignmentTarget, visitor: AssignmentTargetVisitor<R>): R {
  switch (target.kind) {
    case 'variable': return visitor.variable(target);
    case 'variables': return visitor.variables(target);
    case 'destructuring': return visitor.destructuring(target);
    case 'property': return visitor.property(target);
    case 'static_property': return visitor.static_property(target);
    case 'index': return visitor.index(target);
    case 'append': return visitor.append(target);
  }
}
