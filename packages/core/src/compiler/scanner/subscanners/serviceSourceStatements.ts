import { PHP_STATEMENT_KINDS } from '../lexer/phpAstStatementKinds';
import type { PhpAstValue } from '../lexer/phpAstExpressionTypes';
import type { PhpAssignmentTarget, PhpStatement, PhpForClause, PhpIfAlternative } from '../lexer/phpAstStatementTypes';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { SemanticValue } from '../../../types/upstream/primitiveVocabulary';
import type { BinaryOperator, Expression, ResolvedExpression } from '../../../types/upstream/expression';
import type { Assignment, AssignmentTarget } from '../../../types/upstream/assignment';
import type { SourceStatement, SourceStatements, SourceConditionalBranches, SourceCatchHandler, SourceForClause } from '../../../types/upstream/sourceStatements';
import type { VariableName, PropertyName, ExceptionName, ActionName, ModelName } from '../../../types/upstream/names';
import type { Option, Sequence } from '../../../types/upstream/collections';
import type { DeclaredType } from '../../../types/upstream/typeVocabulary';
import type { ServiceMethodResultIndex } from '../../../types/upstream/service';
import type { ModelSymbolTable } from '../symbols/ModelSymbolTable';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';
import { resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode } from './resource/resourceUpstreamExpressionMappings';
import { relationAll, relationAny, relationEqual } from '../../../semantic/foundation/semanticRelations';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/foundation/relationMembership';
import { relationFold, relationGate, relationLookup, relationProject, relationOptionFold, relationRefine, relationSome, relationNone, relationCount, RELATION_NONE, type RelationMaybe, type RelationOption, type RelationNone, type RelationVariant } from '../../../semantic/foundation/relationalSequence';

type Binding = { readonly variable: VariableName; readonly value: SemanticValue };
type Environment = RelationIndex<VariableName, Binding>;

const stringValue = (value: string) => ({ kind: 'string_value' as const, value });
const variableName = (value: string): VariableName => ({ kind: 'variable_name', value: stringValue(value) });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: stringValue(value) });
const exceptionName = (value: string): ExceptionName => ({ kind: 'exception_name', value: stringValue(value) });
const sequence = <T>(items: readonly T[], index = 0, output: Sequence<T> = { kind: 'empty' }): Sequence<T> =>
  relationGate(index >= relationCount(items), () => output, () => sequence(items, index + 1, { kind: 'cons', head: items[index], tail: output }));
const sourceSpanFromToken = (file: string, token: { readonly startOffset: number; readonly endOffset: number }): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: token.startOffset }, end: { kind: 'number_value', value: token.endOffset } });

const isSome = <T>(value: Option<T>): value is RelationVariant<Option<T>, 'some'> => Object.is(value.kind, 'some');
const isNone = <T>(value: Option<T>): value is RelationVariant<Option<T>, 'none'> => Object.is(value.kind, 'none');
const isReference = (value: SemanticValue): value is RelationVariant<SemanticValue, 'reference'> => Object.is(value.kind, 'reference');
const isResolvedProperty = (value: SemanticValue): value is RelationVariant<SemanticValue, 'resolved_property_access'> => Object.is(value.kind, 'resolved_property_access');
const isCallableValue = (value: SemanticValue): value is RelationVariant<SemanticValue, 'method_call' | 'static_call' | 'function_call'> => relationAny([Object.is(value.kind, 'method_call'), Object.is(value.kind, 'static_call'), Object.is(value.kind, 'function_call')]);

function lookupMethodResult(index: ServiceMethodResultIndex, name: ActionName): Option<SemanticValue> {
  const entries = relationFold(index.items, [] as readonly { readonly name: ActionName; readonly result: SemanticValue }[], (output, item) => [...output, { name: item.method, result: item.result }]);
  return relationOptionFold(relationLookup(relationProject(entries, item => [item.name.value.value, item.result] as const), name.value.value), () => ({ kind: 'none' }), value => ({ kind: 'some', value }));
}

function semanticFromType(type: DeclaredType): SemanticValue {
  const expression = type.value;
  return relationGate(Object.is(expression.kind, 'reference'), () => ({
    kind: 'reference',
    name: { kind: 'domain_type_name', value: expression.value.name.value },
    cardinality: { kind: 'one' },
    nullability: relationGate(Object.is(type.nullability.kind, 'nullable'), () => ({ kind: 'nullable' as const }), () => ({ kind: 'non_nullable' as const })),
  }), () => ({ kind: 'typed', type: expression }));
}

function lookup(environment: Environment, name: VariableName): Option<SemanticValue> {
  return relationOptionFold(relationIndexLookup(environment, name), () => ({ kind: 'none' }), value => ({ kind: 'some', value: value.value }));
}

function modelNameFromReference(value: SemanticValue): RelationMaybe<ModelName> {
  return relationOptionFold(relationRefine(value, isReference), () => relationOptionFold(relationRefine(value, isResolvedProperty), () => relationOptionFold(relationRefine(value, isCallableValue), () => RELATION_NONE, callable => modelNameFromReference(callable.result)), property => relationGate(Object.is(property.property.kind, 'relation'), () => property.property.targetModel, () => RELATION_NONE)), reference => ({ kind: 'model_name', value: reference.name.value }));
}

function unionValues(left: SemanticValue, right: SemanticValue): SemanticValue {
  return { kind: 'union', members: { kind: 'semantic_values', items: sequence([left, right]) } };
}

function binarySemanticValue(operator: BinaryOperator): SemanticValue {
  const booleanResult = relationAny([Object.is(operator.kind, 'equal'), Object.is(operator.kind, 'not_equal'), Object.is(operator.kind, 'greater'), Object.is(operator.kind, 'greater_equal'), Object.is(operator.kind, 'less'), Object.is(operator.kind, 'less_equal'), Object.is(operator.kind, 'and'), Object.is(operator.kind, 'or')]);
  const numericResult = relationAny([Object.is(operator.kind, 'add'), Object.is(operator.kind, 'subtract'), Object.is(operator.kind, 'multiply'), Object.is(operator.kind, 'divide'), Object.is(operator.kind, 'modulo')]);
  return relationGate(Object.is(operator.kind, 'concat'), () => ({ kind: 'typed', type: { kind: 'primitive', value: { kind: 'string' } } }), () =>
    relationGate(booleanResult, () => ({ kind: 'typed', type: { kind: 'primitive', value: { kind: 'boolean' } } }), () =>
      relationGate(numericResult, () => ({ kind: 'typed', type: { kind: 'primitive', value: { kind: 'number' } } }), () => ({ kind: 'unresolved', reason: 'external' }))));
}

function resolveMethodCallResult(expression: RelationVariant<Expression, 'method' | 'nullsafe_method'>, methodResults: ServiceMethodResultIndex): SemanticValue {
  const receiver = relationGate(Object.is(expression.receiver.kind, 'variable'), () => expression.receiver, () => RELATION_NONE as RelationNone);
  return relationGate(!Object.is(receiver, RELATION_NONE), () => relationGate(Object.is((receiver as RelationVariant<Expression, 'variable'>).name.value.value, '$this'), () => relationGate(Object.is(expression.operation.kind, 'domain'), () => relationOptionFold(lookupMethodResult(methodResults, expression.operation.name), () => ({ kind: 'unresolved', reason: 'missing_local_method' }), value => value), () => ({ kind: 'unresolved', reason: 'external' })), () => ({ kind: 'unresolved', reason: 'external' })), () => ({ kind: 'unresolved', reason: 'external' }));
}

function semanticExpression(expression: Expression, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SemanticValue {
  return relationGate(Object.is(expression.kind, 'literal'), () => ({ kind: 'literal', value: expression.value }), () =>
    relationGate(Object.is(expression.kind, 'variable'), () => relationOptionFold(lookup(environment, expression.name), () => ({ kind: 'unresolved', reason: 'missing_local_variable' }), value => value), () =>
      relationGate(Object.is(expression.kind, 'property'), () => propertyExpression(expression, false, environment, models, methodResults), () =>
        relationGate(Object.is(expression.kind, 'nullsafe_property'), () => propertyExpression(expression, true, environment, models, methodResults), () =>
          relationGate(relationAny([Object.is(expression.kind, 'method'), Object.is(expression.kind, 'nullsafe_method')]), () => {
            const receiver = semanticExpression(expression.receiver, environment, models, methodResults);
            return { kind: 'method_call', receiver, operation: expression.operation, arguments: expression.arguments, result: resolveMethodCallResult(expression, methodResults) };
          }, () =>
            relationGate(Object.is(expression.kind, 'relation'), () => relationExpression(expression, environment, models, methodResults), () =>
              relationGate(Object.is(expression.kind, 'assignment_expression'), () => ({ kind: 'unresolved', reason: 'external' }), () =>
                relationGate(Object.is(expression.kind, 'static_method'), () => ({ kind: 'static_call', receiver: expression.receiver, action: expression.action, arguments: expression.arguments, result: { kind: 'unresolved', reason: 'external' } }), () =>
                  relationGate(Object.is(expression.kind, 'builtin'), () => builtinExpression(expression), () =>
                    relationGate(Object.is(expression.kind, 'call'), () => ({ kind: 'function_call', function: expression.function, arguments: expression.arguments, result: { kind: 'unresolved', reason: 'external' } }), () =>
                      relationGate(Object.is(expression.kind, 'coalesce'), () => unionValues(semanticExpression(expression.left, environment, models, methodResults), semanticExpression(expression.right, environment, models, methodResults)), () =>
                        relationGate(Object.is(expression.kind, 'conditional'), () => conditionalExpression(expression, environment, models, methodResults), () =>
                          relationGate(Object.is(expression.kind, 'binary'), () => binarySemanticValue(expression.operator), () =>
                            relationGate(Object.is(expression.kind, 'unary'), () => semanticExpression(expression.operand, environment, models, methodResults), () =>
                              relationGate(Object.is(expression.kind, 'cast'), () => castExpression(expression), () => ({ kind: 'unresolved', reason: 'external' }))))))))))))))));
}

function propertyExpression(expression: RelationVariant<Expression, 'property' | 'nullsafe_property'>, nullable: boolean, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SemanticValue {
  const receiver = semanticExpression(expression.receiver, environment, models, methodResults);
  const model = modelNameFromReference(receiver);
  return relationGate(!Object.is(model, RELATION_NONE), () => {
    const symbol = models.get(model as ModelName);
    return relationGate(Object.is(symbol.kind, 'found'), () => {
      const property = symbol.value.resolveProperty(expression.property);
      return relationGate(Object.is(property.kind, 'found'), () => ({ kind: 'resolved_property_access', receiver, model: model as ModelName, property: property.value.source, nullability: relationGate(nullable, () => ({ kind: 'nullable' as const }), () => ({ kind: 'non_nullable' as const })) }), () => ({ kind: 'property_access', receiver, property: expression.property, nullability: relationGate(nullable, () => ({ kind: 'nullable' as const }), () => ({ kind: 'non_nullable' as const })) }));
    }, () => ({ kind: 'property_access', receiver, property: expression.property, nullability: relationGate(nullable, () => ({ kind: 'nullable' as const }), () => ({ kind: 'non_nullable' as const })) }));
  }, () => ({ kind: 'property_access', receiver, property: expression.property, nullability: relationGate(nullable, () => ({ kind: 'nullable' as const }), () => ({ kind: 'non_nullable' as const })) }));
}

function relationExpression(expression: RelationVariant<Expression, 'relation'>, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SemanticValue {
  const receiver = semanticExpression(expression.receiver, environment, models, methodResults);
  const model = modelNameFromReference(receiver);
  return relationGate(!Object.is(model, RELATION_NONE), () => {
    const symbol = models.get(model as ModelName);
    return relationGate(Object.is(symbol.kind, 'found'), () => {
      const property = symbol.value.relation(expression.relation);
      return relationGate(Object.is(property.kind, 'found'), () => ({ kind: 'resolved_property_access', receiver, model: model as ModelName, property: property.value, nullability: { kind: 'non_nullable' } }), () => ({ kind: 'relation_access', receiver, relation: expression.relation, nullability: { kind: 'non_nullable' } }));
    }, () => ({ kind: 'relation_access', receiver, relation: expression.relation, nullability: { kind: 'non_nullable' } }));
  }, () => ({ kind: 'relation_access', receiver, relation: expression.relation, nullability: { kind: 'non_nullable' } }));
}

function builtinExpression(expression: RelationVariant<Expression, 'builtin'>): SemanticValue {
  const booleanFunctions = ['is_object', 'is_array', 'empty', 'in_array', 'method_exists'] as const;
  const booleanResult = relationAny(relationProject(booleanFunctions, item => Object.is(item, expression.function.kind)));
  const dateResult = Object.is(expression.function.kind, 'now');
  const result = relationGate(booleanResult, () => ({ kind: 'typed' as const, type: { kind: 'primitive' as const, value: { kind: 'boolean' as const } } }), () => relationGate(dateResult, () => ({ kind: 'typed' as const, type: { kind: 'primitive' as const, value: { kind: 'date_time' as const } } }), () => ({ kind: 'unresolved' as const, reason: 'external' as const })));
  return { kind: 'function_call', function: { kind: 'function_name', value: stringValue(expression.function.kind) }, arguments: expression.arguments, result };
}

function conditionalExpression(expression: RelationVariant<Expression, 'conditional'>, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SemanticValue {
  const whenTrue = semanticExpression(expression.branches.whenTrue, environment, models, methodResults);
  return relationGate(Object.is(expression.branches.kind, 'then_only'), () => whenTrue, () => unionValues(whenTrue, semanticExpression(expression.branches.whenFalse, environment, models, methodResults)));
}

function castExpression(expression: RelationVariant<Expression, 'cast'>): SemanticValue {
  const numeric = relationAny([Object.is(expression.target.kind, 'integer'), Object.is(expression.target.kind, 'float')]);
  const boolean = Object.is(expression.target.kind, 'boolean');
  const primitive = relationGate(numeric, () => ({ kind: 'number' as const }), () => relationGate(boolean, () => ({ kind: 'boolean' as const }), () => ({ kind: 'string' as const })));
  return { kind: 'typed', type: { kind: 'primitive', value: primitive } };
}

function resolveExpression(value: PhpAstValue, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): ResolvedExpression {
  const expression = mapResourcePhpAstToUpstream(value, file);
  return { kind: 'resolved_expression', expression, result: semanticExpression(expression, environment, models, methodResults) };
}

function assignmentTarget(target: PhpAssignmentTarget, file: string): AssignmentTarget { return resolveAssignmentTarget(target, mapResourcePhpAstToUpstream, file); }

type StatementResult = { readonly statement: SourceStatement; readonly environment: Environment };
type ForClauseResult = { readonly clause: SourceForClause; readonly environment: Environment };

function bindOne(target: AssignmentTarget, value: SemanticValue, environment: Environment): Environment {
  return relationGate(Object.is(target.kind, 'variable'), () => relationIndexAdd(environment, target.name, { variable: target.name, value }), () =>
    relationGate(Object.is(target.kind, 'variables'), () => bindSequence(target.names.items, value, environment), () => environment));
}

function bindSequence(values: Sequence<VariableName>, value: SemanticValue, environment: Environment): Environment {
  return relationGate(Object.is(values.kind, 'empty'), () => environment, () => bindSequence(values.tail, value, relationIndexAdd(environment, values.head, { variable: values.head, value })));
}

function forClause(value: PhpForClause, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): ForClauseResult {
  return relationGate(Object.is(value.kind, 'empty'), () => ({ clause: { kind: 'empty' }, environment }), () =>
    relationGate(Object.is(value.kind, 'expression'), () => ({ clause: { kind: 'expression', value: resolveExpression(value.value, file, environment, models, methodResults) }, environment }), () => {
      const target = assignmentTarget(value.target, file);
      const resolved = resolveExpression(value.value, file, environment, models, methodResults);
      const nextEnvironment = bindOne(target, resolved.result, environment);
      return { clause: { kind: 'assignment', value: { kind: 'assignment', target, expression: resolved.expression, operator: resolveAssignmentOperator(value.operator.kind), reference: assignmentReferenceMode(value.reference.kind), source: sourceSpanFromToken(file, value.source) } }, environment: nextEnvironment };
    }));
}

const statementResolverCatalog: readonly (readonly [string, (value: PhpStatement, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex) => StatementResult])[] = [
  ['assignment', (value, file, environment, models, methodResults) => assignmentStatement(value as RelationVariant<PhpStatement, 'assignment'>, file, environment, models, methodResults)],
  ['expression_statement', (value, file, environment, models, methodResults) => expressionStatement(value as RelationVariant<PhpStatement, 'expression_statement'>, file, environment, models, methodResults)],
  ['return_with_value', (value, file, environment, models, methodResults) => returnStatement(value as RelationVariant<PhpStatement, 'return_with_value'>, file, environment, models, methodResults)],
  ['return_void', (value, file, environment) => ({ statement: { kind: 'return_void', source: sourceSpanFromToken(file, value.source) }, environment })],
  [PHP_STATEMENT_KINDS.conditional, (value, file, environment, models, methodResults) => conditionalStatement(value as RelationVariant<PhpStatement, 'conditional'>, file, environment, models, methodResults)],
  [PHP_STATEMENT_KINDS.collectionRecurrence, (value, file, environment, models, methodResults) => recurrenceStatement(value as RelationVariant<PhpStatement, 'collection_recurrence'>, file, environment, models, methodResults)],
  [PHP_STATEMENT_KINDS.countedRecurrence, (value, file, environment, models, methodResults) => countedStatement(value as RelationVariant<PhpStatement, 'counted_recurrence'>, file, environment, models, methodResults)],
  ['try_statement', (value, file, environment, models, methodResults) => tryStatement(value as RelationVariant<PhpStatement, 'try_statement'>, file, environment, models, methodResults)],
  ['throw_statement', (value, file, environment, models, methodResults) => throwStatement(value as RelationVariant<PhpStatement, 'throw_statement'>, file, environment, models, methodResults)],
];

function statement(value: PhpStatement, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  return relationOptionFold(relationLookup(statementResolverCatalog, value.kind), () => ({ statement: { kind: 'return_void', source: sourceSpanFromToken(file, value.source) }, environment }), resolver => resolver(value, file, environment, models, methodResults));
}

function assignmentStatement(value: RelationVariant<PhpStatement, 'assignment'>, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  const target = assignmentTarget(value.target, file);
  const resolved = resolveExpression(value.value, file, environment, models, methodResults);
  const nextEnvironment = bindOne(target, resolved.result, environment);
  const source = sourceSpanFromToken(file, value.source);
  const assignment: Assignment = { kind: 'assignment', target, expression: resolved.expression, operator: resolveAssignmentOperator(value.operator.kind), reference: assignmentReferenceMode(value.reference.kind), source };
  return { statement: { kind: 'assignment', value: assignment, source }, environment: nextEnvironment };
}

function expressionStatement(value: RelationVariant<PhpStatement, 'expression_statement'>, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  const resolved = resolveExpression(value.expression, file, environment, models, methodResults);
  return { statement: { kind: 'expression', value: resolved, source: resolved.expression.source }, environment };
}

function returnStatement(value: RelationVariant<PhpStatement, 'return_with_value'>, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  const resolved = resolveExpression(value.expression, file, environment, models, methodResults);
  return { statement: { kind: 'return', expression: resolved, source: resolved.expression.source }, environment };
}

function conditionalStatement(value: RelationVariant<PhpStatement, 'conditional'>, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  const condition = resolveExpression(value.condition, file, environment, models, methodResults);
  const branchResult = branches(value.alternative, value.thenBlock.statements, file, environment, models, methodResults);
  return { statement: { kind: 'conditional', condition, branches: branchResult.branches, source: condition.expression.source }, environment: branchResult.environment };
}

type BranchResult = { readonly branches: SourceConditionalBranches; readonly environment: Environment };

function recurrenceStatement(value: RelationVariant<PhpStatement, 'collection_recurrence'>, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  const iterable = resolveExpression(value.iterable, file, environment, models, methodResults);
  const variable = variableName(relationGate(Object.is(value.target.kind, 'value'), () => value.target.variable, () => value.target.value));
  const loopEnvironment = relationIndexAdd(environment, variable, { variable, value: { kind: 'unresolved', reason: 'external' } });
  const body = statements(value.body.statements, file, loopEnvironment, models, methodResults);
  return { statement: { kind: 'for_each', iterable, variable, body: body.statements }, environment };
}

function countedStatement(value: RelationVariant<PhpStatement, 'counted_recurrence'>, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  const initializer = forClause(value.initializer, file, environment, models, methodResults);
  const condition = forClause(value.condition, file, initializer.environment, models, methodResults);
  const update = forClause(value.update, file, condition.environment, models, methodResults);
  const body = statements(value.body.statements, file, update.environment, models, methodResults);
  return { statement: { kind: 'for_loop', initializer: initializer.clause, condition: condition.clause, update: update.clause, body: body.statements, source: sourceSpanFromToken(file, value.source) }, environment };
}

function tryStatement(value: RelationVariant<PhpStatement, 'try_statement'>, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  const body = statements(value.body.statements, file, environment, models, methodResults);
  const catches = relationProject(value.catches, item => ({ kind: 'catch_handler' as const, variable: variableName(item.variable), exception: exceptionName(item.exceptionType), body: statements(item.body.statements, file, environment, models, methodResults).statements, source: sourceSpanFromToken(file, item.source) } as SourceCatchHandler));
  return { statement: { kind: 'try', body: body.statements, catches: { kind: 'catch_handlers', items: sequence(catches) }, source: sourceSpanFromToken(file, value.source) }, environment: body.environment };
}

function throwStatement(value: RelationVariant<PhpStatement, 'throw_statement'>, file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementResult {
  const error = resolveExpression(value.expression, file, environment, models, methodResults);
  return { statement: { kind: 'throw', error, source: error.expression.source }, environment };
}

function branches(alternative: PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): BranchResult {
  const whenTrue = statements(thenValues, file, environment, models, methodResults);
  return relationGate(Object.is(alternative.kind, 'none'), () => ({ branches: { kind: 'then_only', whenTrue: whenTrue.statements }, environment: whenTrue.environment }), () =>
    relationGate(Object.is(alternative.kind, 'else_block'), () => {
      const whenFalse = statements(alternative.block.statements, file, environment, models, methodResults);
      return { branches: { kind: 'then_else', whenTrue: whenTrue.statements, whenFalse: whenFalse.statements }, environment };
    }, () => {
      const whenFalse = statements([alternative.statement], file, environment, models, methodResults);
      return { branches: { kind: 'then_else', whenTrue: whenTrue.statements, whenFalse: whenFalse.statements }, environment };
    }));
}

type StatementsResult = { readonly statements: SourceStatements; readonly environment: Environment };

function statements(values: readonly PhpStatement[], file: string, environment: Environment, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): StatementsResult {
  return relationFold(values, { statements: { kind: 'source_statements', items: sequence([]) }, environment }, (state, value) => {
    const result = statement(value, file, state.environment, models, methodResults);
    const existing = state.statements.items;
    return { statements: { kind: 'source_statements', items: appendSequence(existing, result.statement) }, environment: result.environment };
  });
}

function appendSequence<T>(items: Sequence<T>, value: T): Sequence<T> {
  return relationGate(Object.is(items.kind, 'empty'), () => ({ kind: 'cons', head: value, tail: { kind: 'empty' as const } }), () => ({ kind: 'cons', head: items.head, tail: appendSequence(items.tail, value) }));
}

export function serviceSourceStatements(values: readonly PhpStatement[], file: string, parameterTypes: RelationIndex<VariableName, DeclaredType>, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): SourceStatements {
  const environment = relationFold(parameterTypes, [] as Environment, (output, entry) => relationIndexAdd(output, entry[0], { variable: entry[0], value: semanticFromType(entry[1]) }));
  return statements(values, file, environment, models, methodResults).statements;
}
