import type { ResourceExpressionModel } from './resourceExpressionModel';
import type { ResourceQueryPredicate, ResourceQueryProjection, ResourceRelationLoadTarget, ResourceResolvedQueryOperation } from './resourceQueryOperation';
import { SemanticValueFactory, type MethodName, type PropertyName } from './semanticValues';
import type { ResourceModelMethodMeaning } from './resourceModelMethodMeaning';

function literalString(expression: ResourceExpressionModel): string | undefined {
  if (expression.expression.kind !== 'literal') return undefined;
  return expression.expression.value.kind === 'string' ? expression.expression.value.value : undefined;
}
function argumentAt(args: readonly ResourceExpressionModel[], index: number): ResourceExpressionModel | undefined { return args[index]; }
function propertyArgument(args: readonly ResourceExpressionModel[], index = 0): PropertyName | undefined {
  const value = argumentAt(args, index); const raw = value === undefined ? undefined : literalString(value);
  return raw === undefined ? undefined : SemanticValueFactory.propertyName(raw);
}
function relationLoadTargets(args: readonly ResourceExpressionModel[]): readonly ResourceRelationLoadTarget[] | undefined {
  const expression = argumentAt(args, 0); if (expression === undefined) return undefined;
  const values: string[] = []; const literal = literalString(expression);
  if (literal !== undefined) values.push(literal);
  else if (expression.expression.kind === 'array') for (const entry of expression.expression.entries) { const value = literalString(entry.value); if (value !== undefined) values.push(value); }
  else return undefined;
  if (values.length === 0) return undefined;
  return Object.freeze(values.map(raw => { const [relationPath, selected] = raw.split(':', 2); const path = Object.freeze(relationPath.split('.').filter(Boolean).map(SemanticValueFactory.relationName)); const selection = selected === undefined ? { kind: 'all' as const } : { kind: 'properties' as const, properties: Object.freeze(selected.split(',').filter(Boolean).map(SemanticValueFactory.propertyName)) }; return Object.freeze({ path, selection }); }));
}
function comparisonOperator(args: readonly ResourceExpressionModel[]): Extract<ResourceResolvedQueryOperation, { kind: 'filter' }>['predicate']['operator'] | undefined {
  const expression = argumentAt(args, 1); if (expression === undefined) return 'equal'; const value = literalString(expression); if (value === undefined) return undefined;
  switch (value) { case '=': case '==': return 'equal'; case '!=': case '<>': return 'not_equal'; case '<': return 'less_than'; case '<=': return 'less_than_or_equal'; case '>': return 'greater_than'; case '>=': return 'greater_than_or_equal'; case 'like': return 'like'; case 'not like': return 'not_like'; case 'in': return 'in'; case 'not in': return 'not_in'; default: return undefined; }
}
function predicateFromArguments(args: readonly ResourceExpressionModel[]): ResourceQueryPredicate | undefined {
  const property = propertyArgument(args); if (property === undefined) return undefined; const operator = comparisonOperator(args); if (operator === undefined) return undefined; const operand = argumentAt(args, args.length >= 3 ? 2 : 1); return operand === undefined ? undefined : Object.freeze({ property, operator, operand });
}
function projectionFromArguments(args: readonly ResourceExpressionModel[]): readonly ResourceQueryProjection[] {
  return Object.freeze(args.map(expression => { const raw = literalString(expression); return raw === undefined ? Object.freeze({ kind: 'raw' as const, expression }) : Object.freeze({ kind: 'property' as const, property: SemanticValueFactory.propertyName(raw) }); }));
}

export function resolveResourceQueryOperation(method: MethodName, meaning: ResourceModelMethodMeaning, args: readonly ResourceExpressionModel[]): ResourceResolvedQueryOperation {
  if (meaning.kind !== 'query_mutation') return Object.freeze({ kind: 'none' });
  switch (meaning.operation.kind) {
    case 'filter': { const predicate = predicateFromArguments(args); return predicate === undefined ? { kind: 'invalid', method, error: { kind: 'invalid_arguments' } } : { kind: 'filter', method, predicate }; }
    case 'relation_filter': { const targets = relationLoadTargets(args); const callback = argumentAt(args, 1); return targets === undefined || callback === undefined ? { kind: 'invalid', method, error: { kind: 'invalid_arguments' } } : { kind: 'relation_filter', method, targets, callback }; }
    case 'relation_load': { const targets = relationLoadTargets(args); return targets === undefined ? { kind: 'invalid', method, error: { kind: 'invalid_arguments' } } : { kind: 'relation_load', method, targets }; }
    case 'ordering': { const property = propertyArgument(args); const expression = argumentAt(args, 0); const target = property !== undefined ? { kind: 'property' as const, property } : expression === undefined ? undefined : { kind: 'raw' as const, expression }; return target === undefined ? { kind: 'invalid', method, error: { kind: 'invalid_arguments' } } : { kind: 'ordering', method, target, direction: meaning.operation.direction }; }
    case 'projection': return { kind: 'projection', method, projections: projectionFromArguments(args) };
    case 'pagination': return { kind: 'pagination', method, pageSize: argumentAt(args, 0) === undefined ? { kind: 'framework_default' } : { kind: 'explicit', value: argumentAt(args, 0)! } };
    case 'window': { const value = argumentAt(args, 0); return value === undefined ? { kind: 'invalid', method, error: { kind: 'invalid_arguments' } } : { kind: 'window', method, operation: meaning.operation.operation, value }; }
    case 'grouping': { const properties: PropertyName[] = []; for (const argument of args) { const value = literalString(argument); if (value === undefined) return { kind: 'invalid', method, error: { kind: 'invalid_arguments' } }; properties.push(SemanticValueFactory.propertyName(value)); } return { kind: 'grouping', method, properties: Object.freeze(properties) }; }
    case 'having': { const predicate = predicateFromArguments(args); return predicate === undefined ? { kind: 'invalid', method, error: { kind: 'invalid_arguments' } } : { kind: 'having', method, predicate }; }
    case 'locking': return { kind: 'locking', method, mode: meaning.operation.mode };
    case 'distinct': return { kind: 'distinct', method };
    case 'conditional': { const condition = argumentAt(args, 0); const callback = argumentAt(args, 1); return condition === undefined || callback === undefined ? { kind: 'invalid', method, error: { kind: 'invalid_arguments' } } : { kind: 'conditional', method, branch: meaning.operation.branch, condition, callback }; }
  }
}
