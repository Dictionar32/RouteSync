import { PHP_STATEMENT_KINDS } from '../../lexer/phpAstStatementKinds';
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
import { resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode } from '../resource/resourceUpstreamExpressionMappings';
import { createControllerDataflowContract, createControllerReturnSet, type ControllerResourceResponseEvidence } from './controllerDataflowContract';
import { relationGate, relationFirst, relationFirstOption, relationProject, relationExpand, relationOptionFold, relationOptionMap, relationEqual, relationNone, relationSome, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny } from '../../../../semantic/kernel/semanticRelations';

const relationCase = <T, R>(value: T, key: (value: T) => string, cases: Readonly<Record<string, (value: T) => R>>, fallback: (value: T) => R): R => relationOptionFold(relationFirstOption(Object.entries(cases), ([candidate]) => relationEqual(candidate, key(value))), () => fallback(value), ([, branch]) => branch(value));


const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const variableName = (value: string) => ({ kind: 'variable_name' as const, value: stringValue(value) });
const propertyName = (value: string) => ({ kind: 'property_name' as const, value: stringValue(value) });
const exceptionName = (value: string) => ({ kind: 'exception_name' as const, value: stringValue(value) });

const sequence = <T>(items: readonly T[], index = items.length - 1, tail: Sequence<T> = { kind: 'empty' }): Sequence<T> =>
  relationGate(index < 0, () => tail, () => sequence(items, index - 1, { kind: 'cons', head: items[index], tail }));

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
  return resolveAssignmentTarget(target, expression, file);
}

export type StatementExpressionResolver = (value: PhpAstValue, file: string, statementIndex: number) => ResolvedExpression;

export function resolvedExpression(value: PhpAstValue, method: ControllerMethodAst, file: string, statementIndex: number): ResolvedExpression {
  const semantic = relationOptionMap(relationFirstOption(method.body.dataflow.definitions, definition => relationEqual(definition.value, value)), definition => definition.semantic);
  const result: SemanticValue = semanticValue(semantic);
  return { kind: 'resolved_expression', expression: expression(value, file), result };
}

type ControllerVariableSemantic = import('../../../../types/upstream/controller').ControllerVariableSemantic;

type SemanticRule = {
  readonly matches: (value: ControllerVariableSemantic) => boolean;
  readonly resolve: (value: ControllerVariableSemantic) => SemanticValue;
};

const semanticRules: readonly SemanticRule[] = Object.freeze([
  { matches: value => relationEqual(value.kind, 'model_origin'), resolve: value => ({ kind: 'reference', name: { kind: 'domain_type_name', value: value.origin.name.value }, cardinality: { kind: 'one' }, nullability: { kind: 'non_nullable' } }) },
  { matches: value => relationEqual(value.kind, 'request_origin'), resolve: value => ({ kind: 'reference', name: { kind: 'domain_type_name', value: value.name.value }, cardinality: { kind: 'one' }, nullability: { kind: 'non_nullable' } }) },
  { matches: value => relationEqual(value.kind, 'expression'), resolve: () => ({ kind: 'unresolved', reason: 'unsupported' }) },
  { matches: value => relationEqual(value.kind, 'external'), resolve: () => ({ kind: 'unresolved', reason: 'external' }) },
]);

function semanticValue(value: RelationOption<ControllerVariableSemantic>): SemanticValue {
  return relationOptionFold(
    value,
    () => ({ kind: 'unresolved', reason: 'external' }),
    candidate => relationOptionFold(
      relationFirst(semanticRules, rule => rule.matches(candidate)),
      () => ({ kind: 'unresolved', reason: 'external' }),
      rule => rule.resolve(candidate),
    ),
  );
}

function forClause(value: PhpForClause, file: string, index: number, resolve: StatementExpressionResolver): import('../../../../types/upstream/sourceStatements').SourceForClause {
  return relationCase<PhpForClause, import('../../../../types/upstream/sourceStatements').SourceForClause>(value, item => item.kind, {
    empty: () => ({ kind: 'empty' as const }),
    expression: item => forExpressionClause(item, file, index, resolve),
    assignment: item => forAssignmentClause(item, file, index, resolve),
  }, () => ({ kind: 'empty' as const }));
}

function forExpressionClause(value: Extract<PhpForClause, { kind: 'expression' }>, file: string, index: number, resolve: StatementExpressionResolver): import('../../../../types/upstream/sourceStatements').SourceForClause {
  return { kind: 'expression', value: resolve(value.value, file, index) };
}

function forAssignmentClause(value: Extract<PhpForClause, { kind: 'assignment' }>, file: string, index: number, resolve: StatementExpressionResolver): import('../../../../types/upstream/sourceStatements').SourceForClause {
  return { kind: 'assignment', value: { kind: 'assignment', target: assignmentTarget(value.target, file), expression: resolve(value.value, file, index).expression, operator: resolveAssignmentOperator(value.operator.kind), reference: assignmentReferenceMode(value.reference.kind), source: statementSource(value, file) } };
}

function statementSource(value: PhpStatement, file: string): SourceSpan {
  return tokenSpan(file, value.source);
}

function foreachVariable(target: import('../../lexer/phpAstTypes').PhpForeachTarget) {
  return relationGate(relationEqual(target.kind, 'value'), () => variableName(target.variable), () => variableName(target.value));
}

function sourceStatement(value: PhpStatement, file: string, index: number, resolve: StatementExpressionResolver): SourceStatement {
  const source = statementSource(value, file);
  return relationCase<PhpStatement, SourceStatement>(value, item => item.kind, {
    expression_statement: item => ({ kind: 'expression', value: resolve(item.expression, file, index), source }),
    return_with_value: item => ({ kind: 'return', expression: resolve(item.expression, file, index), source }),
    return_void: () => ({ kind: 'return_void', source }),
    assignment: item => ({ kind: 'assignment', value: { kind: 'assignment', target: assignmentTarget(item.target, file), expression: resolve(item.value, file, index).expression, operator: resolveAssignmentOperator(item.operator.kind), reference: assignmentReferenceMode(item.reference.kind), source }, source }),
    [PHP_STATEMENT_KINDS.conditional]: item => ({ kind: 'conditional', condition: resolve(item.condition, file, index), branches: sourceBranches(item.alternative, item.thenBlock.statements, file, index, resolve), source }),
    [PHP_STATEMENT_KINDS.collectionRecurrence]: item => ({ kind: 'for_each', iterable: resolve(item.iterable, file, index), variable: foreachVariable(item.target), body: sourceStatements(item.body.statements, file, resolve), source }),
    [PHP_STATEMENT_KINDS.countedRecurrence]: item => ({ kind: 'for_loop', initializer: forClause(item.initializer, file, index, resolve), condition: forClause(item.condition, file, index, resolve), update: forClause(item.update, file, index, resolve), body: sourceStatements(item.body.statements, file, resolve), source }),
    try_statement: item => ({ kind: 'try', body: sourceStatements(item.body.statements, file, resolve), catches: { kind: 'catch_handlers', items: sequence(relationProject(item.catches, catcher => ({ kind: 'catch_handler', variable: variableName(catcher.variable), exception: exceptionName(catcher.exceptionType), body: sourceStatements(catcher.body.statements, file, resolve), source: tokenSpan(file, catcher.source) }))) }, source }),
    throw_statement: item => ({ kind: 'throw', error: resolve(item.expression, file, index), source }),
  }, () => ({ kind: 'return_void', source }));
}

export function sourceStatements(values: readonly PhpStatement[], file: string, resolve: StatementExpressionResolver): SourceStatements {
  return { kind: 'source_statements', items: sequence(relationProject(values, (value, index) => sourceStatement(value, file, index, resolve))) };
}

export function controllerStatements(values: readonly PhpStatement[], file: string, method: ControllerMethodAst): SourceStatements {
  return sourceStatements(values, file, (value, sourceFile, statementIndex) => resolvedExpression(value, method, sourceFile, statementIndex));
}

function sourceBranches(alternative: PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, index: number, resolve: StatementExpressionResolver) {
  const thenOnly = { kind: 'then_only' as const, whenTrue: sourceStatements(thenValues, file, resolve) };
  return relationCase<PhpIfAlternative, typeof thenOnly | { readonly kind: 'then_else'; readonly whenTrue: SourceStatements; readonly whenFalse: SourceStatements }>(alternative, item => item.kind, {
    none: () => thenOnly,
    else_block: item => ({ kind: 'then_else', whenTrue: sourceStatements(thenValues, file, resolve), whenFalse: sourceStatements(item.block.statements, file, resolve) }),
    else_if: item => ({ kind: 'then_else', whenTrue: sourceStatements(thenValues, file, resolve), whenFalse: { kind: 'source_statements', items: sequence([sourceStatement(item.statement, file, index, resolve)]) } }),
  }, () => thenOnly);
}

function forClauseExpression(clause: PhpForClause, file: string): Expression {
  return relationCase<PhpForClause, Expression>(clause, item => item.kind, {
    expression: item => expression(item.value, file),
    assignment: item => expression(item.value, file),
  }, () => { throw Error('Empty recurrence clause cannot be converted to an expression'); });
}

function requestBinding(method: ControllerMethodAst): ControllerAction['request'] {
  const rules = relationProject(method.parameters, parameter => ({
    parameter,
    matches: relationEqual(parameter.semantic.kind, 'request_origin'),
  }));
  return relationOptionFold(
    relationFirst(rules, rule => rule.matches),
    () => ({ kind: 'no_request' as const }),
    rule => ({ kind: 'bound_request' as const, name: (rule.parameter.semantic as Extract<typeof rule.parameter.semantic, { kind: 'request_origin' }>).name }),
  );
}

function semantic(method: ControllerMethodAst, file: string, response: ControllerResponse): ControllerSemanticDataflow {
  const contract = createControllerDataflowContract(
    method.body.dataflow,
    method.parameters,
    createControllerReturnSet(relationProject(method.returns, item => item.expression)),
    relationGate(relationEqual(response.kind, 'response_present'), () => ({ kind: 'present', response: response.response } satisfies ControllerResourceResponseEvidence), () => ({ kind: 'absent' } satisfies ControllerResourceResponseEvidence))
  );

  const variables = relationProject(contract.semantic.variables, binding => ({
    variable: variableName(binding.variable),
    definitions: sequence(relationProject(binding.definitions, definition => ({
      variable: variableName(definition.variable),
      origin: definition.origin,
      expression: expression(definition.value, file),
      semantic: definition.semantic,
      source: tokenSpan(file, definition.expression.source),
    }))) 
  }));

  const resources = relationProject(contract.resourceBindings, binding => ({
    resource: { kind: 'resource_reference' as const, name: { kind: 'resource_name' as const, value: binding.resourceName.value } },
    model: toUpstreamModel(binding.model),
    response: binding.response,
    source: binding.source,
  }));

  const returned = relationGate(relationEqual(method.returns.length, 0),
    () => ({ kind: 'absent' as const }),
    () => returnSetSemantic(relationProject(method.returns, item => item.expression), file, contract.resourceBindings),
  );

  return { variables: sequence(variables), resources: sequence(resources), returned };
}


const defaultStatus = (value: number): HttpStatusCode => ({
  kind: 'http_status_code',
  value: { kind: 'number_value', value },
});

const responseStatus = (value: RelationOption<number>): ResponseStatus =>
  relationOptionFold(value,
    () => ({ kind: 'response_status', value: defaultStatus(200), origin: { kind: 'framework_default' } }),
    status => ({ kind: 'response_status', value: defaultStatus(status), origin: { kind: 'source_explicit', status: defaultStatus(status) } }));

const redirectDefaultStatus: ResponseStatus = { kind: 'response_status', value: defaultStatus(302), origin: { kind: 'framework_default' } };

function positional(value: import('../../lexer/phpAstTypes').PhpAstValue, index: number): RelationOption<import('../../lexer/phpAstTypes').PhpAstValue> {
  return relationGate(relationEqual(value.kind, 'method_chain'),
    () => relationOptionFold(relationFirstOption(relationProject(value.arguments, (argument, offset) => [offset, argument] as const), entry => relationAll([relationEqual(entry[0], index), relationEqual(entry[1].kind, 'positional')])),
      () => relationNone(),
      entry => relationSome(entry[1].value)),
    () => relationNone());
}

function literalNumber(value: RelationOption<import('../../lexer/phpAstTypes').PhpAstValue>): RelationOption<number> {
  return relationOptionFold(value,
    () => relationNone(),
    candidate => relationGate(relationAllLiteralNumber(candidate), () => relationSome(candidate.value), () => relationNone()));
}

const relationAllLiteralNumber = (value: import('../../lexer/phpAstTypes').PhpAstValue): value is Extract<import('../../lexer/phpAstTypes').PhpAstValue, { kind: 'literal'; literalType: 'number' }> =>
  relationAll([relationEqual(value.kind, 'literal'), relationEqual(value.literalType, 'number')]);

function responsePayload(value: import('../../lexer/phpAstTypes').PhpAstValue): import('../../types/upstream/response').ResponseJsonPayload {
  const semantic = expression(value, 'response-runtime');
  return relationOptionFold(
    relationFirst([
      { kind: 'resource_single' as const, value: { kind: 'expression' as const, expression: semantic } },
      { kind: 'default' as const, value: { kind: 'expression' as const, expression: semantic } },
    ], candidate => relationEqual(candidate.kind, value.kind)),
    () => ({ kind: 'expression' as const, expression: semantic }),
    candidate => candidate.value,
  );
}

function resourceReference(name: string): ResourceReference {
  return { kind: 'resource_reference', name: { kind: 'resource_name', value: stringValue(name) } };
}


function collectNestedReturns(block: import('../../lexer/phpAstTypes').PhpBlock): readonly PhpAstValue[] {
  const visitBlock = (current: import('../../lexer/phpAstTypes').PhpBlock): readonly PhpAstValue[] =>
    relationExpand(current.statements, statement => collectStatementReturns(statement));
  const collectStatementReturns = (statement: PhpStatement): readonly PhpAstValue[] =>
    relationCase<PhpStatement, readonly PhpAstValue[]>(statement, item => item.kind, {
      return_with_value: item => [item.expression],
      if_statement: item => [
        ...visitBlock(item.thenBlock),
        ...relationCase<PhpIfAlternative, readonly PhpAstValue[]>(item.alternative, alternative => alternative.kind, {
          none: () => [],
          else_block: alternative => visitBlock(alternative.block),
          else_if: alternative => visitBlock(alternative.statement.thenBlock),
        }, () => []),
      ],
      foreach_statement: item => visitBlock(item.body),
      for_statement: item => visitBlock(item.body),
      try_statement: item => [
        ...visitBlock(item.body),
        ...relationExpand(item.catches, catcher => visitBlock(catcher.body)),
        ...relationGate(relationEqual(item.finallyBlock.kind, 'present'), () => visitBlock(item.finallyBlock.block), () => []),
      ],
    }, () => []);
  return visitBlock(block);
}

function returnSetSemantic(
  values: readonly PhpAstValue[],
  file: string,
  resourceBindings: readonly import('./controllerDataflowContract').ControllerResourceBinding[],
): import('../../types/upstream/controller').ControllerReturnSemantic {
  const semantics = relationProject(values, value => returnSemantic(value, file, resourceBindings));
  return relationGate(relationEqual(semantics.length, 1), () => semantics[0], () => ({
    kind: 'branches',
    branches: sequence(semantics),
    expression: semantics[0].expression,
  }));
}

function unwrapTransactionReturns(
  value: import('../../lexer/phpAstTypes').PhpAstValue,
): readonly PhpAstValue[] {
  return relationGate(
    relationAll([
      relationEqual(value.kind, 'static_call'),
      relationEqual(value.className.value, 'DB'),
      relationEqual(value.method.value, 'transaction'),
    ]),
    () => relationOptionFold(
      relationFirstOption(value.arguments, argument => relationAll([
        relationEqual(argument.kind, 'positional'),
        relationEqual(argument.value.kind, 'closure'),
      ])),
      () => [],
      argument => relationGate(relationEqual(argument.kind, 'positional'), () => relationGate(relationEqual(argument.value.kind, 'closure'), () => collectNestedReturns(argument.value.body), () => []), () => []),
    ),
    () => [],
  );
}

const responseMethodHandlers: Readonly<Record<string, (value: Extract<PhpAstValue, { kind: 'method_chain' }>, file: string, semanticExpression: ResolvedExpression, status: ResponseStatus) => import('../../types/upstream/controller').ControllerReturnSemantic>> = Object.freeze({
  json: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'json', shape: { kind: 'single', payload: relationOptionFold(positional(value, 0), () => ({ kind: 'expression' as const, expression: semanticExpression }), payload => responsePayload(payload)) } }, status }, expression: semanticExpression }),
  jsonp: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'json_with_callback', shape: { kind: 'single', payload: relationOptionFold(positional(value, 1), () => ({ kind: 'expression' as const, expression: semanticExpression }), payload => responsePayload(payload)) }, callback: relationOptionFold(positional(value, 0), () => semanticExpression, callback => expression(callback, file)) }, status }, expression: semanticExpression }),
  noContent: (_value, _file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'no_content', status }, expression: semanticExpression }),
  download: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'download', file: relationOptionFold(positional(value, 0), () => semanticExpression, candidate => expression(candidate, file)), filename: relationOptionFold(positional(value, 1), () => semanticExpression, candidate => expression(candidate, file)) }, status }, expression: semanticExpression }),
  file: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'file', file: relationOptionFold(positional(value, 0), () => semanticExpression, candidate => expression(candidate, file)) }, status }, expression: semanticExpression }),
  stream: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'stream', callback: relationOptionFold(positional(value, 0), () => semanticExpression, candidate => expression(candidate, file)) }, status }, expression: semanticExpression }),
  streamJson: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'stream_json', payload: relationOptionFold(positional(value, 0), () => semanticExpression, candidate => expression(candidate, file)) }, status }, expression: semanticExpression }),
  eventStream: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'event_stream', callback: relationOptionFold(positional(value, 0), () => semanticExpression, candidate => expression(candidate, file)) }, status }, expression: semanticExpression }),
  streamDownload: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'stream_download', callback: relationOptionFold(positional(value, 0), () => semanticExpression, candidate => expression(candidate, file)), filename: relationOptionFold(positional(value, 1), () => semanticExpression, candidate => expression(candidate, file)) }, status }, expression: semanticExpression }),
  view: (value, file, semanticExpression, status) => ({ kind: 'response', result: { kind: 'content', body: { kind: 'view', view: { kind: 'view', view: relationOptionFold(positional(value, 0), () => semanticExpression, candidate => expression(candidate, file)), data: relationOptionFold(positional(value, 1), () => semanticExpression, candidate => expression(candidate, file)) } }, status }, expression: semanticExpression }),
});

function responseMethodSemantic(value: Extract<PhpAstValue, { kind: 'method_chain' }>, file: string, semanticExpression: ResolvedExpression): RelationOption<import('../../types/upstream/controller').ControllerReturnSemantic> {
  const status = responseStatus(literalNumber(positional(value, 1)));
  return relationOptionMap(relationFirstOption(Object.entries(responseMethodHandlers), ([method]) => relationEqual(method, value.property)), ([, handler]) => handler(value, file, semanticExpression, status));
}

function returnSemantic(
  value: import('../../lexer/phpAstTypes').PhpAstValue,
  file: string,
  resourceBindings: readonly import('./controllerDataflowContract').ControllerResourceBinding[],
): import('../../types/upstream/controller').ControllerReturnSemantic {
  const semanticExpression = expression(value, file);
  const transactionReturns = unwrapTransactionReturns(value);
  return relationGate(relationAny([transactionReturns.length > 0]),
    () => returnSetSemantic(transactionReturns, file, resourceBindings),
    () => relationCase<PhpAstValue, import('../../types/upstream/controller').ControllerReturnSemantic>(value, item => item.kind, {
      method_chain: item => relationGate(relationAll([relationEqual(item.receiver.kind, 'function_call'), relationEqual(item.receiver.functionName, 'response')]),
        () => relationOptionFold(responseMethodSemantic(item, file, semanticExpression), () => relationCase<PhpAstValue, import('../../types/upstream/controller').ControllerReturnSemantic>(item, node => node.kind, {
          method_chain: () => relationGate(relationEqual(item.property, 'download'), () => ({ kind: 'response', result: { kind: 'content', body: { kind: 'download', file: expression(item.receiver, file), filename: relationOptionFold(positional(item, 0), () => semanticExpression, candidate => expression(candidate, file)) }, status: responseStatus(relationNone()) }, expression: semanticExpression }), () => ({ kind: 'expression', expression: semanticExpression })),
        }, () => ({ kind: 'expression', expression: semanticExpression })), response => response),
        () => ({ kind: 'expression', expression: semanticExpression })),
      function_call: item => relationGate(relationEqual(item.functionName, 'redirect'),
        () => ({ kind: 'response', result: { kind: 'redirect', redirect: { kind: 'internal', target: relationOptionFold(relationFirstOption(item.arguments, argument => relationEqual(argument.kind, 'positional')), () => semanticExpression, argument => expression(argument.value, file)) }, status: redirectDefaultStatus }, expression: semanticExpression }),
        () => ({ kind: 'expression', expression: semanticExpression })),
      resource_collection: item => resourceReturnSemantic(item, semanticExpression, resourceBindings, true),
      resource_single: item => resourceReturnSemantic(item, semanticExpression, resourceBindings, false),
      literal: item => relationGate(relationEqual(item.literalType, 'string'), () => ({ kind: 'response', result: { kind: 'content', body: { kind: 'text', body: semanticExpression }, status: responseStatus(relationNone()) }, expression: semanticExpression }), () => ({ kind: 'expression', expression: semanticExpression })),
      nested_array: () => ({ kind: 'response', result: { kind: 'content', body: { kind: 'json', shape: { kind: 'single', payload: { kind: 'expression', expression: semanticExpression } } }, status: responseStatus(relationNone()) }, expression: semanticExpression }),
    }, () => ({ kind: 'expression', expression: semanticExpression })),
  );
}

function resourceReturnSemantic(value: Extract<PhpAstValue, { kind: 'resource_collection' | 'resource_single' }>, semanticExpression: ResolvedExpression, resourceBindings: readonly import('./controllerDataflowContract').ControllerResourceBinding[], collection: boolean): import('../../types/upstream/controller').ControllerReturnSemantic {
  const resource = resourceReference(value.resourceName);
  return relationOptionFold(relationFirstOption(resourceBindings, item => relationEqual(item.resourceName.value, value.resourceName)),
    () => ({ kind: 'expression', expression: semanticExpression }),
    binding => ({ kind: 'resource', resource, model: toUpstreamModel(binding.model), cardinality: relationGate(collection, () => ({ kind: 'collection' }), () => ({ kind: 'single' })), expression: semanticExpression }));
}

function toUpstreamModel(origin: import('./controllerDataflowContract').ControllerModelOrigin): import('../../../../types/upstream/controller').ControllerModelOrigin {
  return relationGate(relationEqual(origin.kind, 'table'), () => ({ kind: 'table', name: { kind: 'table_name', value: origin.name.value } }), () => ({ kind: 'model_class', name: { kind: 'model_name', value: origin.name.value } }));
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

export function controllerActionFromMethod(method: ControllerMethodAst, controllerName: string, file: string, response: ControllerResponse, dependencies: readonly import('../../../../types/upstream/controller').ControllerDependency[] = []): ControllerAction {
  const action: ControllerAction = {
    kind: 'controller_action',
    controller: { kind: 'controller_name', value: stringValue(controllerName) },
    action: { kind: 'action_name', value: stringValue(method.name) },
    request: requestBinding(method),
    response,
    dependencies: sequence(dependencies),
    statements: controllerStatements(method.body.statements, file, method),
    semantic: semantic(method, file, response),
    source: tokenSpan(file, method.source),
  };
  return action;
}
