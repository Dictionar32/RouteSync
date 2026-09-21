import type { ControllerMethodAst, ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { PhpAstValue, PhpStatement, PhpAssignmentTarget, PhpIfAlternative, PhpForClause } from '../../lexer/phpAstTypes';
import type { ControllerAst } from '../../../../types/upstream/ast';
import type { ControllerAction, ControllerSemanticDataflow, ControllerStatement } from '../../../../types/upstream/controller';
import type { Assignment, AssignmentTarget } from '../../../../types/upstream/assignment';
import type { Expression, ResolvedExpression } from '../../../../types/upstream/expression';
import type { Sequence } from '../../../../types/upstream/collections';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import type { SemanticValue } from '../../../../types/upstream/primitiveVocabulary';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';
import { createControllerDataflowContract, createControllerReturnSet } from './controllerDataflowContract';
import { resolveControllerExpression } from '../../descriptors/request/controllerExpressionContract';


const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const variableName = (value: string) => ({ kind: 'variable_name' as const, value: stringValue(value) });
const propertyName = (value: string) => ({ kind: 'property_name' as const, value: stringValue(value) });
const exceptionName = (value: string) => ({ kind: 'exception_name' as const, value: stringValue(value) });

const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>(
  (tail, item) => ({ kind: 'cons', head: item, tail }),
  { kind: 'empty' }
);

const span = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

const expression = (value: PhpAstValue, file: string): Expression => mapResourcePhpAstToUpstream(value, file);

function assignmentTarget(target: PhpAssignmentTarget, file: string): AssignmentTarget {
  switch (target.kind) {
    case 'variable': return { kind: 'variable', name: variableName(target.name) };
    case 'variables': return { kind: 'variables', names: { kind: 'variable_names', items: sequence(target.names.map(name => variableName(name))) } };
    case 'property': return { kind: 'property', receiver: expression(target.receiver, file), name: propertyName(target.property) };
    case 'array_element': return { kind: 'index', receiver: expression(target.target, file), key: expression(target.index, file) };
  }
}

export function resolvedExpression(value: PhpAstValue, method: ControllerMethodAst, file: string, statementIndex: number): ResolvedExpression {
  const semantic = method.body.dataflow.definitions.find(definition => definition.value === value)?.semantic;
  const result: SemanticValue = semanticValue(semantic);
  return { kind: 'resolved_expression', expression: expression(value, file), result };
}

function semanticValue(value: import('../../../../types/upstream/controller').ControllerVariableSemantic | undefined): SemanticValue {
  if (!value) return { kind: 'unresolved', reason: 'external' };
  switch (value.kind) {
    case 'model_origin':
      return { kind: 'reference', name: { kind: 'domain_type_name', value: value.origin.name.value }, cardinality: { kind: 'one' }, nullability: { kind: 'non_null' } };
    case 'request_origin':
      return { kind: 'reference', name: { kind: 'domain_type_name', value: value.name.value }, cardinality: { kind: 'one' }, nullability: { kind: 'non_null' } };
    case 'expression':
      return { kind: 'unresolved', reason: 'unsupported' };
    case 'external':
      return { kind: 'unresolved', reason: 'external' };
  }
}

function statement(value: PhpStatement, file: string, index: number, method: ControllerMethodAst): ControllerStatement {
  const source = span(file, index + 1);
  switch (value.kind) {
    case 'expression_statement': return { kind: 'expression', value: expression(value.expression, file), source };
    case 'return_with_value': return { kind: 'return', expression: expression(value.expression, file), source };
    case 'return_void': return { kind: 'return', expression: expression({ kind: 'literal', literalType: 'null', value: null }, file), source };
    case 'assignment': return { kind: 'assignment', value: { kind: 'assignment', target: assignmentTarget(value.target, file), expression: resolvedExpression(value.value, method, file, index), source }, source };
    case 'if_statement': return { kind: 'conditional', condition: expression(value.condition, file), branches: branches(value.alternative, value.thenBlock.statements, file, index, method), source };
    case 'foreach_statement': return { kind: 'for_each', iterable: expression(value.iterable, file), variable: variableName(value.target.kind === 'value' ? value.target.variable : value.target.value), body: controllerStatements(value.body.statements, file, method), source };
    case 'for_statement': return { kind: 'for_each', iterable: forClauseExpression(value.initializer, file), variable: { kind: 'variable_name', value: stringValue('__for') }, body: controllerStatements(value.body.statements, file, method), source };
    case 'try_statement': return { kind: 'try', body: controllerStatements(value.body.statements, file, method), catches: { kind: 'catch_handlers', items: sequence(value.catches.map((item, catchIndex) => ({ kind: 'catch_handler', variable: variableName(item.variable), exception: exceptionName(item.exceptionType), body: controllerStatements(item.body.statements, file, method), source: span(file, index + catchIndex + 1) }))) }, source };
    case 'throw_statement': return { kind: 'throw', error: expression(value.expression, file), source };
  }
}

export function controllerStatements(values: readonly PhpStatement[], file: string, method: ControllerMethodAst): { kind: 'controller_statements'; items: Sequence<ControllerStatement> } {
  return { kind: 'controller_statements', items: sequence(values.map((value, index) => statement(value, file, index, method))) };
}

function branches(alternative: PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, index: number, method: ControllerMethodAst) {
  if (alternative.kind === 'none') return { kind: 'then_only' as const, whenTrue: controllerStatements(thenValues, file, method) };
  if (alternative.kind === 'else_block') return { kind: 'then_else' as const, whenTrue: controllerStatements(thenValues, file, method), whenFalse: controllerStatements(alternative.block.statements, file, method) };
  return { kind: 'then_else' as const, whenTrue: controllerStatements(thenValues, file, method), whenFalse: { kind: 'controller_statements' as const, items: sequence([statement(alternative.statement, file, index, method)]) } };
}

function forClauseExpression(clause: PhpForClause, file: string): Expression {
  if (clause.kind === 'expression') return expression(clause.value, file);
  if (clause.kind === 'assignment') return expression(clause.value, file);
  return { kind: 'literal', value: { kind: 'null_literal' }, source: span(file, 0) };
}

function requestBinding(method: ControllerMethodAst): ControllerAction['request'] {
  const request = method.parameters.find(parameter => parameter.semantic.kind === 'request_origin');
  if (!request || request.semantic.kind !== 'request_origin') return { kind: 'no_request' };
  return { kind: 'bound_request', name: request.semantic.name };
}

function semantic(method: ControllerMethodAst, file: string): ControllerSemanticDataflow {
  const contract = createControllerDataflowContract(
    method.body.dataflow,
    method.parameters,
    createControllerReturnSet(method.returns.map(item => item.expression))
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
      source: span(file, definition.statementIndex + 1),
    }])
  }));
  const resources = contract.resourceBindings.map(binding => ({
    resource: { kind: 'resource_reference' as const, name: { kind: 'resource_name' as const, value: binding.resourceName.value } },
    model: toUpstreamModel(binding.model),
    source: span(file, 0),
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

export function controllerAstFromMethod(method: ControllerMethodAst, controllerName: string, file: string): ControllerAst {
  const action: ControllerAction = {
    kind: 'controller_action',
    controller: { kind: 'controller_name', value: stringValue(controllerName) },
    action: { kind: 'action_name', value: stringValue(method.name) },
    request: requestBinding(method),
    statements: controllerStatements(method.body.statements, file, method),
    semantic: semantic(method, file),
    source: span(file, Number(method.source.line)),
  };
  return { kind: 'controller_ast', action, source: action.source };
}
