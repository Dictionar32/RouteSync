import type { ControllerMethodAst, ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { PhpAstValue, PhpStatement, PhpAssignmentTarget, PhpIfAlternative, PhpForClause } from '../../lexer/phpAstTypes';
import type { ControllerAst } from '../../../../types/upstream/ast';
import type { ControllerAction, ControllerSemanticDataflow, ControllerResponse } from '../../../../types/upstream/controller';
import type { SourceStatement, SourceStatements } from '../../../../types/upstream/sourceStatements';
import type { Assignment, AssignmentTarget } from '../../../../types/upstream/assignment';
import type { Expression, ResolvedExpression } from '../../../../types/upstream/expression';
import type { Sequence } from '../../../../types/upstream/collections';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ResourceReference, ResponseReference } from '../../../../types/upstream/semanticReferences';
import type { ResponseResult, ResponseStatus } from '../../../../types/upstream/response';
import type { HttpStatusCode, StringValue } from '../../../../types/upstream/valueObjects';
import type { SemanticValue } from '../../../../types/upstream/primitiveVocabulary';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';
import { mapAssignmentTarget, mapAssignmentOperator, assignmentReferenceMode } from '../resource/resourceUpstreamExpressionMappings';
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
  return mapAssignmentTarget(target, expression, file);
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
    case 'assignment': return { kind: 'assignment', value: { kind: 'assignment', target: assignmentTarget(value.target, file), expression: resolve(value.value, file, index).expression, operator: mapAssignmentOperator(value.operator.kind), reference: assignmentReferenceMode(value.reference.kind), source: statementSource(value, file) } };
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
    case 'assignment': return { kind: 'assignment', value: { kind: 'assignment', target: assignmentTarget(value.target, file), expression: resolve(value.value, file, index).expression, operator: mapAssignmentOperator(value.operator.kind), reference: assignmentReferenceMode(value.reference.kind), source }, source };
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
    : returnSetSemantic(method.returns.map(item => item.expression), file, contract.resourceBindings);
  return { variables: sequence(variables), resources: sequence(resources), returned };
}

const defaultStatus = (value: number): HttpStatusCode => ({
  kind: 'http_status_code',
  value: { kind: 'number_value', value },
});

const responseStatus = (value: number | undefined): ResponseStatus => value === undefined
  ? { kind: 'response_status', value: defaultStatus(200), origin: { kind: 'framework_default' } }
  : { kind: 'response_status', value: defaultStatus(value), origin: { kind: 'source_explicit', status: defaultStatus(value) } };

const redirectDefaultStatus: ResponseStatus = { kind: 'response_status', value: defaultStatus(302), origin: { kind: 'framework_default' } };

function positional(value: import('../../lexer/phpAstTypes').PhpAstValue, index: number): import('../../lexer/phpAstTypes').PhpAstValue | undefined {
  if (value.kind !== 'method_chain') return undefined;
  const argument = value.arguments[index];
  return argument?.kind === 'positional' ? argument.value : undefined;
}

function literalNumber(value: import('../../lexer/phpAstTypes').PhpAstValue | undefined): number | undefined {
  return value?.kind === 'literal' && value.literalType === 'number' ? value.value : undefined;
}

function responsePayload(value: import('../../lexer/phpAstTypes').PhpAstValue): import('../../types/upstream/response').ResponseJsonPayload {
  const semantic = expression(value, 'response-runtime');
  if (value.kind === 'resource_single') return { kind: 'expression', expression: semantic };
  return { kind: 'expression', expression: semantic };
}

function resourceReference(name: string): ResourceReference {
  return { kind: 'resource_reference', name: { kind: 'resource_name', value: stringValue(name) } };
}


function collectNestedReturns(block: import('../../lexer/phpAstTypes').PhpBlock): readonly PhpAstValue[] {
  const values: PhpAstValue[] = [];
  const visitBlock = (current: import('../../lexer/phpAstTypes').PhpBlock): void => {
    for (const statement of current.statements) {
      if (statement.kind === 'return_with_value') values.push(statement.expression);
      if (statement.kind === 'if_statement') {
        visitBlock(statement.thenBlock);
        if (statement.alternative.kind === 'else_block') visitBlock(statement.alternative.block);
        if (statement.alternative.kind === 'else_if') visitBlock(statement.alternative.statement.thenBlock);
      }
      if (statement.kind === 'foreach') visitBlock(statement.body);
      if (statement.kind === 'for' && statement.body) visitBlock(statement.body);
      if (statement.kind === 'try_statement') {
        visitBlock(statement.body);
        for (const catcher of statement.catches) visitBlock(catcher.body);
        if (statement.finallyBlock.kind === 'present') visitBlock(statement.finallyBlock.block);
      }
    }
  };
  visitBlock(block);
  return values;
}

function returnSetSemantic(
  values: readonly PhpAstValue[],
  file: string,
  resourceBindings: readonly import('./controllerDataflowContract').ControllerResourceBinding[],
): import('../../types/upstream/controller').ControllerReturnSemantic {
  const semantics = values.map(value => returnSemantic(value, file, resourceBindings));
  if (semantics.length === 1) return semantics[0];
  const expressions = semantics.map(item => item.expression);
  return {
    kind: 'branches',
    branches: sequence(semantics),
    expression: semantics[0].expression,
  };
}

function unwrapTransactionReturns(
  value: import('../../lexer/phpAstTypes').PhpAstValue,
): readonly PhpAstValue[] {
  if (value.kind !== 'static_call' || value.className.value !== 'DB' || value.method.value !== 'transaction') return [];
  const callback = value.arguments.find(argument => argument.kind === 'positional' && argument.value.kind === 'closure');
  if (!callback || callback.kind !== 'positional' || callback.value.kind !== 'closure') return [];
  return collectNestedReturns(callback.value.body);
}

function returnSemantic(
  value: import('../../lexer/phpAstTypes').PhpAstValue,
  file: string,
  resourceBindings: readonly import('./controllerDataflowContract').ControllerResourceBinding[],
): import('../../types/upstream/controller').ControllerReturnSemantic {
  const semanticExpression = expression(value, file);
  const transactionReturns = unwrapTransactionReturns(value);
  if (transactionReturns.length > 0) return returnSetSemantic(transactionReturns, file, resourceBindings);
  if (value.kind === 'method_chain' && value.receiver.kind === 'function_call' && value.receiver.functionName === 'response') {
    const method = value.property;
    const status = responseStatus(literalNumber(positional(value, 1)));
    if (method === 'json' || method === 'jsonp') {
      const payloadValue = method === 'jsonp' ? positional(value, 1) : positional(value, 0);
      const payload = payloadValue ? responsePayload(payloadValue) : { kind: 'expression' as const, expression: semanticExpression };
      const shape = { kind: 'single' as const, payload };
      const body = method === 'jsonp'
        ? { kind: 'json_with_callback' as const, shape, callback: positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression }
        : { kind: 'json' as const, shape };
      return { kind: 'response', result: { kind: 'content', body, status }, expression: semanticExpression };
    }
    if (method === 'noContent') return { kind: 'response', result: { kind: 'no_content', status }, expression: semanticExpression };
    if (method === 'download') return { kind: 'response', result: { kind: 'content', body: { kind: 'download', file: positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression, filename: positional(value, 1) ? expression(positional(value, 1)!, file) : semanticExpression }, status }, expression: semanticExpression };
    if (method === 'file') return { kind: 'response', result: { kind: 'content', body: { kind: 'file', file: positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression }, status }, expression: semanticExpression };
    if (method === 'stream') return { kind: 'response', result: { kind: 'content', body: { kind: 'stream', callback: positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression }, status }, expression: semanticExpression };
    if (method === 'streamJson') return { kind: 'response', result: { kind: 'content', body: { kind: 'stream_json', payload: positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression }, status }, expression: semanticExpression };
    if (method === 'eventStream') return { kind: 'response', result: { kind: 'content', body: { kind: 'event_stream', callback: positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression }, status }, expression: semanticExpression };
    if (method === 'streamDownload') return { kind: 'response', result: { kind: 'content', body: { kind: 'stream_download', callback: positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression, filename: positional(value, 1) ? expression(positional(value, 1)!, file) : semanticExpression }, status }, expression: semanticExpression };
    if (method === 'view') return { kind: 'response', result: { kind: 'content', body: { kind: 'view', view: { kind: 'view', view: positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression, data: positional(value, 1) ? expression(positional(value, 1)!, file) : semanticExpression } }, status }, expression: semanticExpression };
  }
  if (value.kind === 'method_chain' && value.receiver.kind === 'function_call' && value.receiver.functionName === 'redirect') {
    const method = value.property;
    const target = positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression;
    const redirect = method === 'away'
      ? { kind: 'away' as const, target }
      : method === 'route'
        ? { kind: 'route' as const, target }
        : method === 'action'
          ? { kind: 'action' as const, target }
          : method === 'intended'
            ? { kind: 'intended' as const, fallback: target }
            : { kind: 'internal' as const, target };
    return { kind: 'response', result: { kind: 'redirect', redirect, status: redirectDefaultStatus }, expression: semanticExpression };
  }
  if (value.kind === 'function_call' && value.functionName === 'redirect') {
    const target = value.arguments[0]?.kind === 'positional' ? expression(value.arguments[0].value, file) : semanticExpression;
    return { kind: 'response', result: { kind: 'redirect', redirect: { kind: 'internal', target }, status: redirectDefaultStatus }, expression: semanticExpression };
  }
  if (value.kind === 'method_chain' && value.property === 'download') {
    const target = expression(value.receiver, file);
    const filename = positional(value, 0) ? expression(positional(value, 0)!, file) : semanticExpression;
    return { kind: 'response', result: { kind: 'content', body: { kind: 'download', file: target, filename }, status: responseStatus(undefined) }, expression: semanticExpression };
  }
  if (value.kind === 'resource_collection' || value.kind === 'resource_single') {
    const resource = resourceReference(value.resourceName);
    const binding = resourceBindings.find(item => item.resourceName.value === value.resourceName);
    if (binding) return { kind: 'resource', resource, model: toUpstreamModel(binding.model), expression: semanticExpression };
  }
  if (value.kind === 'literal' && value.literalType === 'string') return { kind: 'response', result: { kind: 'content', body: { kind: 'text', body: semanticExpression }, status: responseStatus(undefined) }, expression: semanticExpression };
  if (value.kind === 'nested_array') return { kind: 'response', result: { kind: 'content', body: { kind: 'json', shape: { kind: 'single', payload: { kind: 'expression', expression: semanticExpression } } }, status: responseStatus(undefined) }, expression: semanticExpression };
  return { kind: 'expression', expression: semanticExpression };
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

export function controllerReturnSemanticFromMethod(method: ControllerMethodAst, file: string, response: ControllerResponse): import('../../../../types/upstream/controller').ControllerReturnSemantic {
  return semantic(method, file, response).returned;
}

export function controllerReturnSemanticFromValues(
  values: readonly PhpAstValue[],
  file: string
): import('../../../../types/upstream/controller').ControllerReturnSemantic {
  return returnSetSemantic(values, file, []);
}

export function controllerActionFromMethod(method: ControllerMethodAst, controllerName: string, file: string, response: ControllerResponse): ControllerAction {
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
  return action;
}
