import type { ControllerMethodAst, ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { PhpAstValue, PhpStatement, PhpAssignmentTarget, PhpIfAlternative, PhpForClause } from '../../lexer/phpAstTypes';
import type { ControllerAst } from '../../../../types/upstream/ast';
import type { ControllerAction, ControllerSemanticDataflow, ControllerResponse } from '../../../../types/upstream/controller';
import type { SourceStatement, SourceStatements } from '../../../../types/upstream/sourceStatements';
import type { Assignment, AssignmentTarget } from '../../../../types/upstream/assignment';
import type { Expression, ResolvedExpression } from '../../../../types/upstream/expression';
import type { Sequence } from '../../../../types/upstream/collections';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ResponseReference } from '../../../../types/upstream/semanticReferences';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import type { SemanticValue } from '../../../../types/upstream/primitiveVocabulary';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';
import { createControllerDataflowContract, createControllerReturnSet, type ControllerResourceResponseEvidence } from './controllerDataflowContract';


const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const variableName = (value: string) => ({ kind: 'variable_name' as const, value: stringValue(value) });
const propertyName = (value: string) => ({ kind: 'property_name' as const, value: stringValue(value) });
const exceptionName = (value: string) => ({ kind: 'exception_name' as const, value: stringValue(value) });

const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>(
  (tail, item) => ({ kind: 'cons', head: item, tail }),
  { kind: 'empty' }
);

const span = (file: string, start: number, end: number = start): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: start },
  end: { kind: 'number_value', value: end },
});

const tokenSpan = (file: string, token: { readonly startOffset: number; readonly endOffset: number }): SourceSpan =>
  span(file, token.startOffset, token.endOffset);

const valueSpan = (file: string, value: PhpAstValue): SourceSpan =>
  span(file, value.source.startOffset, value.source.endOffset);

const expression = (value: PhpAstValue, file: string): Expression => mapResourcePhpAstToUpstream(value, file);

function assignmentTarget(target: PhpAssignmentTarget, file: string): AssignmentTarget {
  switch (target.kind) {
    case 'variable': return { kind: 'variable', name: variableName(target.name) };
    case 'variables': return { kind: 'variables', names: { kind: 'variable_names', items: sequence(target.names.map(name => variableName(name))) } };
    case 'property': return { kind: 'property', receiver: expression(target.receiver, file), name: propertyName(target.property) };
    case 'array_element': return { kind: 'index', receiver: expression(target.target, file), key: expression(target.index, file) };
  }
}

export type StatementExpressionResolver = (value: PhpAstValue, file: string, statementIndex: number) => ResolvedExpression;

export function resolvedExpression(value: PhpAstValue, method: ControllerMethodAst, file: string, statementIndex: number): ResolvedExpression {
  const semantic = method.body.dataflow.definitions.find(definition => definition.value === value)?.semantic;
  const result: SemanticValue = semanticValue(semantic);
  return { kind: 'resolved_expression', expression: expression(value, file), result };
}

function semanticValue(value: import('../../../../types/upstream/controller').ControllerVariableSemantic | undefined): SemanticValue {
  if (!value) return { kind: 'unresolved', reason: 'external' };
  switch (value.kind) {
    case 'model_origin':
      return { kind: 'reference', name: { kind: 'domain_type_name', value: value.origin.name.value }, cardinality: { kind: 'one' }, nullability: { kind: 'non_nullable' } };
    case 'request_origin':
      return { kind: 'reference', name: { kind: 'domain_type_name', value: value.name.value }, cardinality: { kind: 'one' }, nullability: { kind: 'non_nullable' } };
    case 'expression':
      return { kind: 'unresolved', reason: 'unsupported' };
    case 'external':
      return { kind: 'unresolved', reason: 'external' };
  }
}

function forClause(value: PhpForClause, file: string, index: number, resolve: StatementExpressionResolver): import('../../../../types/upstream/sourceStatements').SourceForClause {
  switch (value.kind) {
    case 'empty': return { kind: 'empty' };
    case 'expression': return { kind: 'expression', value: resolve(value.value, file, index) };
    case 'assignment': return { kind: 'assignment', value: { kind: 'assignment', target: assignmentTarget(value.target, file), expression: resolve(value.value, file, index), source: statementSource(value, file) } };
  }
}

function statementSource(value: PhpStatement, file: string): SourceSpan {
  return tokenSpan(file, value.source);
}

function sourceStatement(value: PhpStatement, file: string, index: number, resolve: StatementExpressionResolver): SourceStatement {
  const source = statementSource(value, file);
  switch (value.kind) {
    case 'expression_statement': return { kind: 'expression', value: resolve(value.expression, file, index), source };
    case 'return_with_value': return { kind: 'return', expression: resolve(value.expression, file, index), source };
    case 'return_void': return { kind: 'return_void', source };
    case 'assignment': return { kind: 'assignment', value: { kind: 'assignment', target: assignmentTarget(value.target, file), expression: resolve(value.value, file, index), source }, source };
    case 'if_statement': return { kind: 'conditional', condition: resolve(value.condition, file, index), branches: sourceBranches(value.alternative, value.thenBlock.statements, file, index, resolve), source };
    case 'foreach_statement': return { kind: 'for_each', iterable: resolve(value.iterable, file, index), variable: variableName(value.target.kind === 'value' ? value.target.variable : value.target.value), body: sourceStatements(value.body.statements, file, resolve), source };
    case 'for_statement': return { kind: 'for_loop', initializer: forClause(value.initializer, file, index, resolve), condition: forClause(value.condition, file, index, resolve), update: forClause(value.update, file, index, resolve), body: sourceStatements(value.body.statements, file, resolve), source };
    case 'try_statement': return { kind: 'try', body: sourceStatements(value.body.statements, file, resolve), catches: { kind: 'catch_handlers', items: sequence(value.catches.map((item, catchIndex) => ({ kind: 'catch_handler', variable: variableName(item.variable), exception: exceptionName(item.exceptionType), body: sourceStatements(item.body.statements, file, resolve), source: tokenSpan(file, item.source) }))) }, source };
    case 'throw_statement': return { kind: 'throw', error: resolve(value.expression, file, index), source };
  }
}

export function sourceStatements(values: readonly PhpStatement[], file: string, resolve: StatementExpressionResolver): SourceStatements {
  return { kind: 'source_statements', items: sequence(values.map((value, index) => sourceStatement(value, file, index, resolve))) };
}

export function controllerStatements(values: readonly PhpStatement[], file: string, method: ControllerMethodAst): SourceStatements {
  return sourceStatements(values, file, (value, sourceFile, statementIndex) => resolvedExpression(value, method, sourceFile, statementIndex));
}

function sourceBranches(alternative: PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, index: number, resolve: StatementExpressionResolver) {
  if (alternative.kind === 'none') return { kind: 'then_only' as const, whenTrue: sourceStatements(thenValues, file, resolve) };
  if (alternative.kind === 'else_block') return { kind: 'then_else' as const, whenTrue: sourceStatements(thenValues, file, resolve), whenFalse: sourceStatements(alternative.block.statements, file, resolve) };
  return { kind: 'then_else' as const, whenTrue: sourceStatements(thenValues, file, resolve), whenFalse: { kind: 'source_statements' as const, items: sequence([sourceStatement(alternative.statement, file, index, resolve)]) } };
}

function forClauseExpression(clause: PhpForClause, file: string): Expression {
  if (clause.kind === 'expression') return expression(clause.value, file);
  if (clause.kind === 'assignment') return expression(clause.value, file);
  throw new Error('Empty for clause cannot be converted to an expression');
}

function requestBinding(method: ControllerMethodAst): ControllerAction['request'] {
  const request = method.parameters.find(parameter => parameter.semantic.kind === 'request_origin');
  if (!request || request.semantic.kind !== 'request_origin') return { kind: 'no_request' };
  return { kind: 'bound_request', name: request.semantic.name };
}

function semantic(method: ControllerMethodAst, file: string, response: ControllerResponse): ControllerSemanticDataflow {
  const contract = createControllerDataflowContract(
    method.body.dataflow,
    method.parameters,
    createControllerReturnSet(method.returns.map(item => item.expression)),
    response.kind === 'response_present'
      ? { kind: 'present', response: response.response } satisfies ControllerResourceResponseEvidence
      : { kind: 'absent' } satisfies ControllerResourceResponseEvidence
  );
  const variables = method.body.dataflow.definitions.map(definition => ({
    variable: variableName(definition.name),
    definitions: sequence([{
      variable: variableName(definition.name),
      origin: definition.origin.kind === 'assignment'
        ? { kind: 'assignment' as const, statementIndex: definition.statementIndex }
        : definition.origin.kind === 'foreach'
          ? { kind: 'foreach' as const, statementIndex: definition.origin.statementIndex }
          : { kind: 'catch' as const, statementIndex: definition.origin.statementIndex },
      expression: expression(definition.value, file),
      semantic: definition.semantic,
      availability: availability(definition.availability),
      source: tokenSpan(file, definition.value.source),
    }])
  }));
  const resources = contract.resourceBindings.map(binding => ({
    resource: { kind: 'resource_reference' as const, name: { kind: 'resource_name' as const, value: binding.resourceName.value } },
    model: toUpstreamModel(binding.model),
    response: binding.response,
    source: binding.source,
  }));
  const returned = method.returns.length === 0
    ? { kind: 'absent' as const }
    : { kind: 'expression' as const, expression: expression(method.returns[method.returns.length - 1].expression, file) };
  return { variables: sequence(variables), resources: sequence(resources), returned };
}


function availability(value: import('../../lexer/controllerBodyAstTypes').ControllerDefinitionAvailability): import('../../../../types/upstream/controller').ControllerDefinitionAvailability {
  if (value.kind === 'definite') return value;
  const kind = value.kind === 'branch_conditional' ? 'branch_conditional' : value.kind === 'loop_conditional' ? 'loop_conditional' : 'catch_conditional';
  return { kind, branchPath: sequence(value.branchPath) };
}

function toUpstreamModel(origin: import('./controllerDataflowContract').ControllerModelOrigin): import('../../../../types/upstream/controller').ControllerModelOrigin {
  if (origin.kind === 'table') return { kind: 'table', name: { kind: 'table_name', value: origin.name.value } };
  return { kind: 'model_class', name: { kind: 'model_name', value: origin.name.value } };
}

export function controllerAstFromMethod(method: ControllerMethodAst, controllerName: string, file: string, response: ControllerResponse): ControllerAst {
  const action: ControllerAction = {
    kind: 'controller_action',
    controller: { kind: 'controller_name', value: stringValue(controllerName) },
    action: { kind: 'action_name', value: stringValue(method.name) },
    request: requestBinding(method),
    response,
    statements: controllerStatements(method.body.statements, file, method),
    semantic: semantic(method, file, response),
    source: tokenSpan(file, method.source),
  };
  return { kind: 'controller_ast', action, source: action.source };
}
