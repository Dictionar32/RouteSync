import type { Expression, ExpressionArgument, ExpressionArguments } from './expression';
import type {
  ControllerMethodAttributeScope,
  ControllerPolicyActionScopeBlockReason,
  ControllerPolicyActionScopeJudgment,
  ControllerPolicyNamedScopeArgument,
} from './controller';
import type { ActionName } from './names';
import { createActionName } from './names';
import type { ControllerPolicyActionScopeJudgmentInterface } from './controllerPolicyActionScopeJudgmentInterface';

const valuesOf = <T>(sequence: Sequence<T>): readonly T[] => {
  switch (sequence.kind) {
    case 'empty': return Object.freeze([]);
    case 'cons': return Object.freeze([sequence.head, ...valuesOf(sequence.tail)]);
  }
};

const sequenceOf = <T>(items: readonly T[]): Sequence<T> =>
  items.reduceRight<Sequence<T>>((tail, head) => Object.freeze({ kind: 'cons', head, tail }), Object.freeze({ kind: 'empty' }));

type NamedScopes = Readonly<{
  readonly only: readonly ControllerPolicyNamedScopeArgument[];
  readonly except: readonly ControllerPolicyNamedScopeArgument[];
  readonly unpacked: readonly Extract<ExpressionArgument, { readonly kind: 'unpacked' }>[];
}>;

const namedScopes = (arguments_: ExpressionArguments): NamedScopes => {
  const argumentsList = valuesOf(arguments_.items);
  const named = argumentsList.filter((argument): argument is ControllerPolicyNamedScopeArgument => argument.kind === 'named');
  return Object.freeze({
    only: Object.freeze(named.filter(argument => argument.name.value.value === 'only')),
    except: Object.freeze(named.filter(argument => argument.name.value.value === 'except')),
    unpacked: Object.freeze(argumentsList.filter((argument): argument is Extract<ExpressionArgument, { readonly kind: 'unpacked' }> => argument.kind === 'unpacked')),
  });
};

const blocked = (reason: ControllerPolicyActionScopeBlockReason): ControllerPolicyActionScopeJudgment =>
  Object.freeze({ kind: 'blocked', reason });

const actionName = (expression: Expression): ActionName | undefined => {
  switch (expression.kind) {
    case 'literal':
      switch (expression.value.kind) {
        case 'string_literal': return createActionName(expression.value.value.value);
        case 'number_literal':
        case 'boolean_literal':
        case 'null_literal': return undefined;
      }
    default: return undefined;
  }
};

type ActionNamesJudgment =
  | Readonly<{ readonly kind: 'resolved'; readonly actions: readonly ActionName[] }>
  | Readonly<{ readonly kind: 'blocked'; readonly expression: Expression }>;

const actionNames = (argument: ControllerPolicyNamedScopeArgument): ActionNamesJudgment => {
  const expression = argument.value;
  switch (expression.kind) {
    case 'literal': {
      const value = actionName(expression);
      switch (value) {
        case undefined: return Object.freeze({ kind: 'blocked', expression });
        default: return Object.freeze({ kind: 'resolved', actions: Object.freeze([value]) });
      }
    }
    case 'array': {
      const entries = valuesOf(expression.entries);
      const actions: ActionName[] = [];
      for (const entry of entries) {
        switch (entry.kind) {
          case 'implicit':
          case 'keyed': {
            const value = actionName(entry.value);
            switch (value) {
              case undefined: return Object.freeze({ kind: 'blocked', expression: entry.value });
              default: actions.push(value);
            }
            break;
          }
          case 'unpacked': return Object.freeze({ kind: 'blocked', expression: entry.value });
        }
      }
      return Object.freeze({ kind: 'resolved', actions: Object.freeze(actions) });
    }
    default: return Object.freeze({ kind: 'blocked', expression });
  }
};

type ScopeSelection =
  | Readonly<{ readonly kind: 'all' }>
  | Readonly<{ readonly kind: 'only'; readonly argument: ControllerPolicyNamedScopeArgument }>
  | Readonly<{ readonly kind: 'except'; readonly argument: ControllerPolicyNamedScopeArgument }>
  | Readonly<{ readonly kind: 'only_except'; readonly only: ControllerPolicyNamedScopeArgument; readonly except: ControllerPolicyNamedScopeArgument }>;

type ScopeSelectionJudgment =
  | Readonly<{ readonly kind: 'selected'; readonly selection: ScopeSelection }>
  | Readonly<{ readonly kind: 'blocked'; readonly reason: ControllerPolicyActionScopeBlockReason }>;

type FirstNamedScope =
  | Readonly<{ readonly kind: 'absent' }>
  | Readonly<{ readonly kind: 'present'; readonly value: ControllerPolicyNamedScopeArgument }>;

const firstNamedScope = (items: readonly ControllerPolicyNamedScopeArgument[]): FirstNamedScope => {
  const candidate = items[0];
  switch (candidate) {
    case undefined: return Object.freeze({ kind: 'absent' });
    default: return Object.freeze({ kind: 'present', value: candidate });
  }
};

const inconsistentInventory = (items: readonly ControllerPolicyNamedScopeArgument[]): ScopeSelectionJudgment =>
  Object.freeze({ kind: 'blocked', reason: Object.freeze({ kind: 'scope_argument_inventory_inconsistent', arguments: items }) });

const selectScope = (scopes: NamedScopes): ScopeSelectionJudgment => {
  switch (scopes.unpacked.length) {
    case 0: break;
    default: return Object.freeze({ kind: 'blocked', reason: Object.freeze({ kind: 'unsupported_unpacked_arguments', arguments: scopes.unpacked }) });
  }
  const only = firstNamedScope(scopes.only);
  const except = firstNamedScope(scopes.except);
  switch (scopes.only.length) {
    case 0:
      switch (scopes.except.length) {
        case 0: return Object.freeze({ kind: 'selected', selection: Object.freeze({ kind: 'all' }) });
        case 1:
          switch (except.kind) {
            case 'present': return Object.freeze({ kind: 'selected', selection: Object.freeze({ kind: 'except', argument: except.value }) });
            case 'absent': return inconsistentInventory(scopes.except);
          }
        default: return Object.freeze({ kind: 'blocked', reason: Object.freeze({ kind: 'duplicate_except_argument', arguments: scopes.except }) });
      }
    case 1:
      switch (only.kind) {
        case 'absent': return inconsistentInventory(scopes.only);
        case 'present':
          switch (scopes.except.length) {
            case 0: return Object.freeze({ kind: 'selected', selection: Object.freeze({ kind: 'only', argument: only.value }) });
            case 1:
              switch (except.kind) {
                case 'absent': return inconsistentInventory(scopes.except);
                case 'present': return Object.freeze({ kind: 'selected', selection: Object.freeze({ kind: 'only_except', only: only.value, except: except.value }) });
              }
            default: return Object.freeze({ kind: 'blocked', reason: Object.freeze({ kind: 'duplicate_except_argument', arguments: scopes.except }) });
          }
      }
    default: return Object.freeze({ kind: 'blocked', reason: Object.freeze({ kind: 'duplicate_only_argument', arguments: scopes.only }) });
  }
};

const invalidExpressionReason = (
  role: 'only' | 'except',
  argument: ControllerPolicyNamedScopeArgument,
  expression: Expression,
): ControllerPolicyActionScopeBlockReason => {
  switch (Object.is(expression, argument.value)) {
    case true:
      switch (role) {
        case 'only': return Object.freeze({ kind: 'unsupported_only_expression', argument });
        case 'except': return Object.freeze({ kind: 'unsupported_except_expression', argument });
      }
    case false: return Object.freeze({ kind: 'unsupported_action_array_entry', argument, expression });
  }
};

const resolvedScope = (
  role: 'only' | 'except',
  argument: ControllerPolicyNamedScopeArgument,
): ControllerPolicyActionScopeJudgment => {
  const names = actionNames(argument);
  switch (names.kind) {
    case 'blocked': return blocked(invalidExpressionReason(role, argument, names.expression));
    case 'resolved':
      switch (role) {
        case 'only': return Object.freeze({ kind: 'only', actions: sequenceOf(names.actions) });
        case 'except': return Object.freeze({ kind: 'except', actions: sequenceOf(names.actions) });
      }
  }
};

const scopeFromSelection = (selection: ScopeSelection): ControllerPolicyActionScopeJudgment => {
  switch (selection.kind) {
    case 'all': return Object.freeze({ kind: 'all' });
    case 'only': return resolvedScope('only', selection.argument);
    case 'except': return resolvedScope('except', selection.argument);
    case 'only_except': {
      const only = actionNames(selection.only);
      switch (only.kind) {
        case 'blocked': return blocked(invalidExpressionReason('only', selection.only, only.expression));
        case 'resolved': {
          const except = actionNames(selection.except);
          switch (except.kind) {
            case 'blocked': return blocked(invalidExpressionReason('except', selection.except, except.expression));
            case 'resolved': return Object.freeze({ kind: 'only_except', only: sequenceOf(only.actions), except: sequenceOf(except.actions) });
          }
        }
      }
    }
  }
};

const scopeFromArguments = (scopes: NamedScopes): ControllerPolicyActionScopeJudgment => {
  const selection = selectScope(scopes);
  switch (selection.kind) {
    case 'blocked': return blocked(selection.reason);
    case 'selected': return scopeFromSelection(selection.selection);
  }
};

const actionApplicability = (
  scope: ControllerMethodAttributeScope,
  action: ActionName | undefined,
  arguments_: ExpressionArguments,
): ControllerPolicyActionScopeJudgment => {
  switch (scope.kind) {
    case 'class':
      return Object.freeze({ kind: 'all' });
    case 'method':
      switch (action) {
        case undefined:
          return scopeFromArguments(namedScopes(arguments_));
        default:
          return Object.freeze({ kind: 'only', actions: sequenceOf([action]) });
      }
  }
};

export const controllerPolicyActionScopeJudgmentAuthority: ControllerPolicyActionScopeJudgmentInterface = Object.freeze({
  kind: 'controller_policy_action_scope_judgment',
  closed: true,
  analyze: (arguments_: ExpressionArguments): ControllerPolicyActionScopeJudgment => scopeFromArguments(namedScopes(arguments_)),
  analyzeAttribute: actionApplicability,
});
