import type { PhpAstValue } from '../lexer/phpAstExpressionTypes';
import type { PhpAssignmentTarget, PhpStatement } from '../lexer/phpAstStatementTypes';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { SemanticValue } from '../../../types/upstream/primitiveVocabulary';
import type { BinaryOperator, Expression, ResolvedExpression } from '../../../types/upstream/expression';
import type { Assignment, AssignmentTarget } from '../../../types/upstream/assignment';
import type { SourceStatement, SourceStatements, SourceConditionalBranches, SourceCatchHandler } from '../../../types/upstream/sourceStatements';
import type { VariableName, PropertyName, ExceptionName, ActionName } from '../../../types/upstream/names';
import type { Option, Sequence } from '../../../types/upstream/collections';
import type { DeclaredType } from '../../../types/upstream/typeVocabulary';
import type { ModelName } from '../../../types/upstream/names';
import type { ServiceMethodResultIndex } from '../../../types/upstream/service';
import type { ModelSymbolTable } from '../symbols/ModelSymbolTable';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';
import { mapAssignmentTarget, mapAssignmentOperator, assignmentReferenceMode } from './resource/resourceUpstreamExpressionMappings';

type Binding = { readonly variable: VariableName; readonly value: SemanticValue };

type Environment = ReadonlyMap<VariableName, Binding>;

function lookupMethodResult(index: ServiceMethodResultIndex, name: ActionName): Option<SemanticValue> {
  let items = index.items;
  while (items.kind === 'cons') {
    if (items.head.method.value.value === name.value.value) return { kind: 'some', value: items.head.result };
    items = items.tail;
  }
  return { kind: 'none' };
}

const stringValue = (value: string) => ({ kind: 'string_value' as const, value });
const variableName = (value: string): VariableName => ({ kind: 'variable_name', value: stringValue(value) });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: stringValue(value) });
const exceptionName = (value: string): ExceptionName => ({ kind: 'exception_name', value: stringValue(value) });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });
const sourceSpanFromToken = (file: string, token: { readonly startOffset: number; readonly endOffset: number }): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: token.startOffset }, end: { kind: 'number_value', value: token.endOffset } });

function semanticFromType(type: DeclaredType): SemanticValue {
  const expression = type.value;
  if (expression.kind === 'reference') {
    return { kind: 'reference', name: { kind: 'domain_type_name', value: expression.value.name.value }, cardinality: { kind: 'one' }, nullability: type.nullability.kind === 'nullable' ? { kind: 'nullable' } : { kind: 'non_nullable' } };
  }
  return { kind: 'typed', type: expression };
}

function lookup(environment: Environment, name: VariableName): Option<SemanticValue> {
  const binding = environment.get(name);
  if (binding === undefined) return { kind: 'none' };
  return { kind: 'some', value: binding.value };
}

function resolveExpression(value: PhpAstValue, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): ResolvedExpression {
  const expression = mapResourcePhpAstToUpstream(value, file);
  const result = semanticExpression(expression, environment, models, methodResults);
  return { kind: 'resolved_expression', expression, result };
}

function modelNameFromReference(value: SemanticValue): ModelName | undefined {
  switch (value.kind) {
    case 'reference':
      return { kind: 'model_name', value: value.name.value };
    case 'resolved_property_access':
      return value.property.kind === 'relation' ? value.property.targetModel : undefined;
    case 'method_call':
    case 'static_call':
    case 'function_call':
      return modelNameFromReference(value.result);
    default:
      return undefined;
  }
}

function unionValues(left: SemanticValue, right: SemanticValue): SemanticValue {
  return {
    kind: 'union',
    members: {
      kind: 'semantic_values',
      items: sequence([left, right]),
    },
  };
}

function binarySemanticValue(operator: BinaryOperator): SemanticValue {
  switch (operator.kind) {
    case 'concat':
      return { kind: 'typed', type: { kind: 'primitive', value: { kind: 'string' } } };
    case 'equal':
    case 'not_equal':
    case 'greater':
    case 'greater_equal':
    case 'less':
    case 'less_equal':
    case 'and':
    case 'or':
      return { kind: 'typed', type: { kind: 'primitive', value: { kind: 'boolean' } } };
    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
    case 'modulo':
      return { kind: 'typed', type: { kind: 'primitive', value: { kind: 'number' } } };
  }
}

function resolveMethodCallResult(expression: Extract<Expression, { readonly kind: 'method' | 'nullsafe_method' }>, methodResults: ServiceMethodResultIndex): SemanticValue {
  if (expression.receiver.kind !== 'variable') return { kind: 'unresolved', reason: 'external' };
  if (expression.receiver.name.value.value !== '$this') return { kind: 'unresolved', reason: 'external' };
  if (expression.operation.kind !== 'domain') return { kind: 'unresolved', reason: 'external' };
  const localResult = lookupMethodResult(methodResults, expression.operation.name);
  if (localResult.kind === 'none') return { kind: 'unresolved', reason: 'missing_local_method' };
  return localResult.value;
}

function semanticExpression(expression: Expression, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SemanticValue {
  switch (expression.kind) {
    case 'literal':
      return { kind: 'literal', value: expression.value };
    case 'variable': {
      const value = lookup(environment, expression.name);
      if (value.kind === 'none') return { kind: 'unresolved', reason: 'missing_local_variable' };
      return value.value;
    }
    case 'property': {
      const receiver = semanticExpression(expression.receiver, environment, models, methodResults);
      const model = modelNameFromReference(receiver);
      if (model !== undefined) {
        const symbol = models.get(model);
        if (symbol.kind === 'found') {
          const property = symbol.value.resolveProperty(expression.property);
          if (property.kind === 'found') {
            return { kind: 'resolved_property_access', receiver, model, property: property.value.source, nullability: { kind: 'non_nullable' } };
          }
        }
      }
      return { kind: 'property_access', receiver, property: expression.property, nullability: { kind: 'non_nullable' } };
    }
    case 'nullsafe_property': {
      const receiver = semanticExpression(expression.receiver, environment, models, methodResults);
      const model = modelNameFromReference(receiver);
      if (model !== undefined) {
        const symbol = models.get(model);
        if (symbol.kind === 'found') {
          const property = symbol.value.resolveProperty(expression.property);
          if (property.kind === 'found') {
            return { kind: 'resolved_property_access', receiver, model, property: property.value.source, nullability: { kind: 'nullable' } };
          }
        }
      }
      return { kind: 'property_access', receiver, property: expression.property, nullability: { kind: 'nullable' } };
    }
    case 'relation': {
      const receiver = semanticExpression(expression.receiver, environment, models, methodResults);
      const model = modelNameFromReference(receiver);
      if (model !== undefined) {
        const symbol = models.get(model);
        if (symbol.kind === 'found') {
          const property = symbol.value.relation(expression.relation);
          if (property.kind === 'found') {
            return { kind: 'resolved_property_access', receiver, model, property: property.value, nullability: { kind: 'non_nullable' } };
          }
        }
      }
      return { kind: 'relation_access', receiver, relation: expression.relation, nullability: { kind: 'non_nullable' } };
    }
    case 'nullsafe_method':
    case 'method': {
      const receiver = semanticExpression(expression.receiver, environment, models, methodResults);
      const result = resolveMethodCallResult(expression, methodResults);
      return {
        kind: 'method_call',
        receiver,
        operation: expression.operation,
        arguments: expression.arguments,
        result,
      };
    }
    case 'assignment_expression':
      return { kind: 'unresolved', reason: 'external' };
    case 'static_method':
      return {
        kind: 'static_call',
        receiver: expression.receiver,
        action: expression.action,
        arguments: expression.arguments,
        result: { kind: 'unresolved', reason: 'external' },
      };
    case 'builtin': {
      const result = expression.function.kind === 'is_object' || expression.function.kind === 'is_array' || expression.function.kind === 'empty' || expression.function.kind === 'in_array' || expression.function.kind === 'method_exists'
        ? { kind: 'typed' as const, type: { kind: 'primitive' as const, value: { kind: 'boolean' as const } } }
        : expression.function.kind === 'now'
          ? { kind: 'typed' as const, type: { kind: 'primitive' as const, value: { kind: 'date_time' as const } } }
          : { kind: 'unresolved' as const, reason: 'external' as const };
      return { kind: 'function_call', function: { kind: 'function_name', value: stringValue(expression.function.kind) }, arguments: expression.arguments, result };
    }
    case 'call':
      return { kind: 'function_call', function: expression.function, arguments: expression.arguments, result: { kind: 'unresolved', reason: 'external' } };
    case 'coalesce': {
      const left = semanticExpression(expression.left, environment, models, methodResults);
      const right = semanticExpression(expression.right, environment, models, methodResults);
      return unionValues(left, right);
    }
    case 'conditional': {
      const whenTrue = semanticExpression(expression.branches.whenTrue, environment, models, methodResults);
      if (expression.branches.kind === 'then_only') return whenTrue;
      const whenFalse = semanticExpression(expression.branches.whenFalse, environment, models, methodResults);
      return unionValues(whenTrue, whenFalse);
    }
    case 'binary':
      return binarySemanticValue(expression.operator);
    case 'unary':
      return semanticExpression(expression.operand, environment, models, methodResults);
    case 'cast':
      return { kind: 'typed', type: { kind: 'primitive', value: expression.target.kind === 'integer' || expression.target.kind === 'float' ? { kind: 'number' } : expression.target.kind === 'boolean' ? { kind: 'boolean' } : { kind: 'string' } } };
    default:
      return { kind: 'unresolved', reason: 'external' };
  }
}

function assignmentTarget(target: PhpAssignmentTarget, file: string): AssignmentTarget {
  return mapAssignmentTarget(target, mapResourcePhpAstToUpstream, file);
}

function bind(target: AssignmentTarget, value: SemanticValue, environment: Map<VariableName, Binding>): void {
  if (target.kind === 'variable') environment.set(target.name, { variable: target.name, value });
  if (target.kind === 'variables') { let items = target.names.items; while (items.kind === 'cons') { environment.set(items.head, { variable: items.head, value }); items = items.tail; } }
}

function forClause(value: import('../lexer/phpAstStatementTypes').PhpForClause, file: string, environment: Map<VariableName, Binding>, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): import('../../../types/upstream/sourceStatements').SourceForClause {
  switch (value.kind) {
    case 'empty': return { kind: 'empty' };
    case 'expression': return { kind: 'expression', value: resolveExpression(value.value, file, environment, models, methodResults) };
    case 'assignment': {
      const target = assignmentTarget(value.target, file);
      const resolved = resolveExpression(value.value, file, environment, models, methodResults);
      bind(target, resolved.result, environment);
      return { kind: 'assignment', value: { kind: 'assignment', target, expression: resolved.expression, operator: mapAssignmentOperator(value.operator.kind), reference: assignmentReferenceMode(value.reference.kind), source: sourceSpanFromToken(file, value.source) } };
    }
  }
}

function statement(value: PhpStatement, file: string, environment: Map<VariableName, Binding>, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SourceStatement {
  switch (value.kind) {
    case 'assignment': {
      const target = assignmentTarget(value.target, file);
      const resolved = resolveExpression(value.value, file, environment, models, methodResults);
      bind(target, resolved.result, environment);
      const source = sourceSpanFromToken(file, value.source);
      const assignment: Assignment = { kind: 'assignment', target, expression: resolved.expression, operator: mapAssignmentOperator(value.operator.kind), reference: assignmentReferenceMode(value.reference.kind), source };
      return { kind: 'assignment', value: assignment, source };
    }
    case 'expression_statement': { const resolved = resolveExpression(value.expression, file, environment, models, methodResults); return { kind: 'expression', value: resolved, source: resolved.expression.source }; }
    case 'return_with_value': { const resolved = resolveExpression(value.expression, file, environment, models, methodResults); return { kind: 'return', expression: resolved, source: resolved.expression.source }; }
    case 'return_void': return { kind: 'return_void', source: sourceSpanFromToken(file, value.source) };
    case 'if_statement': { const condition = resolveExpression(value.condition, file, environment, models, methodResults); return { kind: 'conditional', condition, branches: branches(value.alternative, value.thenBlock.statements, file, environment, models, methodResults), source: condition.expression.source }; }
    case 'foreach_statement': {
      const iterable = resolveExpression(value.iterable, file, environment, models, methodResults);
      const variable = variableName(value.target.kind === 'value' ? value.target.variable : value.target.value);
      environment.set(variable, { variable, value: { kind: 'unresolved', reason: 'external' } });
      return { kind: 'for_each', iterable, variable, body: statements(value.body.statements, file, environment, models, methodResults), source: iterable.expression.source };
    }
    case 'for_statement': { const initializer = forClause(value.initializer, file, environment, models, methodResults); const condition = forClause(value.condition, file, environment, models, methodResults); const update = forClause(value.update, file, environment, models, methodResults); const source = value.source; return { kind: 'for_loop', initializer, condition, update, body: statements(value.body.statements, file, new Map(environment), models, methodResults), source: sourceSpanFromToken(file, source) }; }
    case 'try_statement': return { kind: 'try', body: statements(value.body.statements, file, environment, models, methodResults), catches: { kind: 'catch_handlers', items: sequence(value.catches.map((item): SourceCatchHandler => ({ kind: 'catch_handler', variable: variableName(item.variable), exception: exceptionName(item.exceptionType), body: statements(item.body.statements, file, new Map(environment), models, methodResults), source: sourceSpanFromToken(file, item.source) }))) }, source: sourceSpanFromToken(file, value.source) };
    case 'throw_statement': { const error = resolveExpression(value.expression, file, environment, models, methodResults); return { kind: 'throw', error, source: error.expression.source }; }
  }
}

function branches(alternative: import('../lexer/phpAstStatementTypes').PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, environment: Map<VariableName, Binding>, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SourceConditionalBranches {
  if (alternative.kind === 'none') return { kind: 'then_only', whenTrue: statements(thenValues, file, environment, models, methodResults) };
  if (alternative.kind === 'else_block') return { kind: 'then_else', whenTrue: statements(thenValues, file, environment, models, methodResults), whenFalse: statements(alternative.block.statements, file, environment, models, methodResults) };
  return { kind: 'then_else', whenTrue: statements(thenValues, file, environment, models, methodResults), whenFalse: statements([alternative.statement], file, environment, models, methodResults) };
}

function statements(values: readonly PhpStatement[], file: string, environment: Map<VariableName, Binding>, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SourceStatements {
  return { kind: 'source_statements', items: sequence(values.map(value => statement(value, file, environment, models, methodResults))) };
}

export function serviceSourceStatements(values: readonly PhpStatement[], file: string, parameterTypes: ReadonlyMap<VariableName, DeclaredType>, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SourceStatements {
  const environment = new Map<VariableName, Binding>();
  parameterTypes.forEach((type, variable) => {
    environment.set(variable, { variable, value: semanticFromType(type) });
  });
  return statements(values, file, environment, models, methodResults);
}
