import { PHP_STATEMENT_KINDS } from '../../lexer/phpAstStatementKinds';
import type { ControllerMethodAst, ControllerParameterAst } from '../../lexer/controllerAstTypes';
import type { PhpAstValue, PhpStatement, PhpAssignmentTarget, PhpIfAlternative, PhpForClause } from '../../lexer/phpAstTypes';
import type { ControllerAst } from '../../../../types/upstream/ast';
import type { QueryAst, QueryOperationAst } from '../../../../types/upstream/query';
import type { QueryCondition } from '../../../../types/upstream/expression';
import type { ControllerAction, ControllerParameter, ControllerDependency, ControllerSemanticDataflow, ControllerResponse, ControllerMethodAttribute, ControllerPolicyRelation, ControllerPolicyActionScope, ControllerQueryEvidence, ControllerQueryInput } from '../../../../types/upstream/controller';
import type { SourceStatement, SourceStatements } from '../../../../types/upstream/sourceStatements';
import type { Assignment, AssignmentTarget } from '../../../../types/upstream/assignment';
import type { Expression, ResolvedExpression, ExpressionArgument } from '../../../../types/upstream/expression';
import type { Sequence } from '../../../../types/upstream/collections';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ResourceReference, ResponseReference } from '../../../../types/upstream/semanticReferences';
import type { ResponseResult, ResponseStatus } from '../../../../types/upstream/response';
import type { HttpStatusCode, StringValue } from '../../../../types/upstream/valueObjects';
import type { ActionName } from '../../../../types/upstream/names';
import type { SemanticValue } from '../../../../types/upstream/primitiveVocabulary';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';
import { resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode } from '../resource/resourceUpstreamExpressionMappings';
import { createControllerDataflowContract, createControllerReturnSet, type ControllerResourceResponseEvidence } from './controllerDataflowContract';
import { relationGate, relationFirst, relationFirstOption, relationProject, relationExpand, relationOptionFold, relationOptionMap, relationEqual, relationNone, relationSome, relationRefine, relationSelect, relationFold, relationFoldRight, type RelationOption } from '../../../../semantic/foundation/relationalSequence';
import { relationAll, relationAny } from '../../../../semantic/foundation/semanticRelations';
import { createSemanticDataflowInput } from '../../wiring/semanticDataflowInputAdapter';

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

function sequenceToArray<T>(value: import('../../../../types/upstream/collections').Sequence<T>, output: readonly T[] = []): readonly T[] {
  return relationOptionFold(
    relationRefine(value, (candidate): candidate is Extract<typeof value, { readonly kind: 'cons' }> => relationEqual(candidate.kind, 'cons')),
    () => output,
    current => sequenceToArray(current.tail, [...output, current.head]),
  );
}

export function resolvedExpression(value: PhpAstValue, method: ControllerMethodAst, file: string, statementIndex: number): ResolvedExpression {
  const definitions = relationExpand(sequenceToArray(method.body.dataflow.semanticVariables.variables), binding => sequenceToArray(binding.definitions));
  const semantic = relationOptionMap(relationFirstOption(definitions, definition => relationEqual(definition.expression, expression(value, file))), definition => definition.semantic);
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

function semantic(method: ControllerMethodAst, controllerName: string, file: string, response: ControllerResponse, queries: readonly QueryAst[] = []): ControllerSemanticDataflow {
  const contract = createControllerDataflowContract(
    method.body.dataflow,
    method.parameters,
    createControllerReturnSet(relationProject(method.returns, item => item.expression)),
    relationGate(relationEqual(response.kind, 'response_present'), () => ({ kind: 'present', response: response.response } satisfies ControllerResourceResponseEvidence), () => ({ kind: 'absent' } satisfies ControllerResourceResponseEvidence)),
    file,
  );

  const variables = contract.semantic.variables;

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

  const source = tokenSpan(file, method.source);
  const node = {
    kind: 'semantic_dataflow_identity' as const,
    source,
    role: 'scope' as const,
    slot: stringValue(`${controllerName}.${method.name}`),
  };
  const dataflow = createSemanticDataflowInput(node, source, method.body.dataflow.semanticKnowledgeDataFlow, 'controller');
  return { dataflow, variables, resources: sequence(resources), returned, queries: sequence(controllerQueryEvidence(method, file, queries)) };
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
  return semantic(method, 'Controller', file, response).returned;
}

export function controllerReturnSemanticFromValues(
  values: readonly PhpAstValue[],
  file: string
): import('../../../../types/upstream/controller').ControllerReturnSemantic {
  return returnSetSemantic(values, file, []);
}

const controllerParameterKind = (parameter: ControllerParameterAst, dependencies: readonly ControllerDependency[]): import('../../../../types/upstream/controller').ControllerParameterKind => {
  const dependency = relationFirstOption(dependencies, candidate => relationEqual(candidate.parameter.value.value, parameter.name.value.value));
  return relationOptionFold(dependency, () => relationCase<ControllerParameterAst['semantic'], import('../../../../types/upstream/controller').ControllerParameterKind>(
    parameter.semantic,
    value => value.kind,
    {
      request_origin: value => ({ kind: 'request' as const, request: value.name }),
      model_origin: value => relationCase(value.origin, origin => origin.kind, {
        model_class: model => ({ kind: 'model' as const, model: model.name }),
        table: origin => ({ kind: 'value' as const, variable: variableName(parameter.name.value.value) }),
      }, () => ({ kind: 'value' as const, variable: variableName(parameter.name.value.value) })),
      expression: () => ({ kind: 'value' as const, variable: variableName(parameter.name.value.value) }),
      external: () => ({ kind: 'value' as const, variable: variableName(parameter.name.value.value) }),
    },
    () => ({ kind: 'value' as const, variable: variableName(parameter.name.value.value) }),
  ), dependency => ({ kind: 'dependency' as const, type: dependency.type }));
};

const controllerParameters = (method: ControllerMethodAst, dependencies: readonly ControllerDependency[], file: string): Sequence<ControllerParameter> =>
  sequence(relationProject(method.parameters, parameter => ({
    variable: variableName(parameter.name.value.value),
    kind: controllerParameterKind(parameter, dependencies),
    source: tokenSpan(file, parameter.source),
  })));

export function controllerMethodAttributesFromAttributes(
  methodAttributes: readonly import('../lexer/controllerAstTypes').ControllerParameterAttributeAst[],
  controllerAttributes: readonly import('../lexer/controllerAstTypes').ControllerParameterAttributeAst[],
  file: string,
): import('../../../../types/upstream/collections').Sequence<import('../../../../types/upstream/controller').ControllerMethodAttribute> {
  const argument = (value: import('../lexer/controllerAstTypes').ControllerParameterAttributeArgumentAst): import('../../../../types/upstream/expression').ExpressionArgument =>
    relationGate(Object.is(value.kind, 'named'),
      () => ({ kind: 'named' as const, name: { kind: 'expression_argument_name' as const, value: { kind: 'string_value' as const, value: value.name.value } }, value: mapResourcePhpAstToUpstream(value.value, file) }),
      () => relationGate(Object.is(value.kind, 'unpacked'),
        () => ({ kind: 'unpacked' as const, value: mapResourcePhpAstToUpstream(value.value, file) }),
        () => ({ kind: 'positional' as const, value: mapResourcePhpAstToUpstream(value.value, file) })));
  const classAttributes: readonly ControllerMethodAttribute[] = relationProject(controllerAttributes, attribute => ({
    kind: 'controller_method_attribute' as const,
    scope: { kind: 'class' as const },
    name: { kind: 'class_name' as const, value: { kind: 'string_value' as const, value: attribute.name.value } },
    arguments: { kind: 'expression_arguments' as const, items: sequence(relationProject(attribute.arguments, argument)) },
    source: tokenSpan(file, attribute.source),
  }));
  const methodAttributeEvidence: readonly ControllerMethodAttribute[] = relationProject(methodAttributes, attribute => ({
    kind: 'controller_method_attribute' as const,
    scope: { kind: 'method' as const },
    name: { kind: 'class_name' as const, value: { kind: 'string_value' as const, value: attribute.name.value } },
    arguments: { kind: 'expression_arguments' as const, items: sequence(relationProject(attribute.arguments, argument)) },
    source: tokenSpan(file, attribute.source),
  }));
  return relationFoldRight(classAttributes, sequence(methodAttributeEvidence), (attribute, tail) => ({ kind: 'cons' as const, head: attribute, tail }));
}

function controllerMethodAttributesFromMethod(
  method: ControllerMethodAst,
  controllerAttributes: readonly import('../lexer/controllerAstTypes').ControllerParameterAttributeAst[],
  file: string,
): import('../../../../types/upstream/collections').Sequence<import('../../../../types/upstream/controller').ControllerMethodAttribute> {
  return controllerMethodAttributesFromAttributes(method.attributes, controllerAttributes, file);
}

function policyActionScope(attribute: ControllerMethodAttribute): ControllerPolicyActionScope {
  const arguments_ = sequenceToArray(attribute.arguments.items);
  const named = relationFirstOption(arguments_, argument => argument.kind === 'named' && (argument.name.value.value === 'only' || argument.name.value.value === 'except'));
  return relationOptionFold(named, () => ({ kind: 'all' as const }), argument => {
    const name = argument.kind === 'named' ? argument.name.value.value : '';
    const value = argument.kind === 'named' ? argument.value : ({ kind: 'unsupported_expression', reason: { kind: 'unsupported' }, source: attribute.source } as Expression);
    const actions = value.kind === 'array'
      ? relationProject(sequenceToArray(value.entries), entry => entry.value).filter(item => item.kind === 'literal' && item.value.kind === 'string_literal').map(item => ({ kind: 'action_name' as const, value: { kind: 'string_value' as const, value: item.value.value.value } }))
      : [];
    return name === 'only' ? { kind: 'only' as const, actions: sequence(actions) } : { kind: 'except' as const, actions: sequence(actions) };
  });
}

function controllerPolicyRelationsFromAttributes(attributes: Sequence<ControllerMethodAttribute>, action?: ActionName): Sequence<ControllerPolicyRelation> {
  const values = sequenceToArray(attributes);
  const relations = relationExpand(values, attribute => {
    const name = attribute.name.value.value;
    if (name !== 'Middleware' && name !== 'WithoutMiddleware' && name !== 'Authorize') return [];
    if (name === 'Authorize') {
      return [{ kind: 'controller_authorization_relation' as const, scope: attribute.scope, actions: action ? { kind: 'only' as const, actions: sequence([action]) } : policyActionScope(attribute), arguments: attribute.arguments, source: attribute.source }];
    }
    const args = sequenceToArray(attribute.arguments.items);
    const first = relationFirstOption(args, argument => argument.kind === 'positional');
    return relationOptionFold(first, () => [], argument => {
      const target = argument.kind === 'positional' ? argument.value : ({ kind: 'unsupported_expression', reason: { kind: 'unsupported' }, source: attribute.source } as Expression);
      const middleware = target.kind === 'literal' && target.value.kind === 'string_literal'
        ? { kind: 'middleware_name' as const, value: { kind: 'string_value' as const, value: target.value.value.value } }
        : target;
      return [{ kind: 'controller_middleware_relation' as const, middleware, origin: { kind: 'attribute' as const }, scope: attribute.scope, actions: policyActionScope(attribute), exclusion: name === 'WithoutMiddleware', source: attribute.source }];
    });
  });
  return sequence(relations);
}


function controllerHasMiddlewareActionScope(expression: Expression): ControllerPolicyActionScope {
  const arguments_ = expression.kind === 'construct' ? sequenceToArray(expression.arguments.items) : [];
  const named = relationFirstOption(arguments_, argument => argument.kind === 'named' && (argument.name.value.value === 'only' || argument.name.value.value === 'except'));
  return relationOptionFold(named, () => ({ kind: 'all' as const }), argument => {
    if (argument.kind !== 'named') return { kind: 'all' as const };
    const values = argument.value.kind === 'array' ? sequenceToArray(argument.value.entries) : [];
    const stringEntries = relationSelect(values, entry => entry.value.kind === 'literal' && entry.value.value.kind === 'string_literal');
    const actions = relationProject(stringEntries, entry => {
      const value = entry.value as Extract<Expression, { readonly kind: 'literal' }>;
      return { kind: 'action_name' as const, value: { kind: 'string_value' as const, value: value.value.value.value } };
    });
    return argument.name.value.value === 'only' ? { kind: 'only' as const, actions: sequence(actions) } : { kind: 'except' as const, actions: sequence(actions) };
  });
}

function controllerHasMiddlewareRelations(
  methods: readonly ControllerMethodAst[],
  interfaces: readonly import('../../lexer/phpAstTypes').AstIdentifier[],
  file: string,
): Sequence<ControllerPolicyRelation> {
  const hasMiddleware = relationAny(relationProject(interfaces, item => relationEqual(item, 'HasMiddleware')));
  return relationGate(hasMiddleware, () => {
    const middlewareMethod = relationFirst(methods, method => relationAll([relationEqual(method.name, 'middleware'), relationEqual(method.storage, 'static')]));
    return relationOptionFold(middlewareMethod, () => ({ kind: 'empty' as const }), method => {
      const expressions = relationExpand(method.returns, returned => returned.expression.kind === 'nested_array'
        ? relationProject(returned.expression.entries, entry => mapResourcePhpAstToUpstream(entry.value, file))
        : [mapResourcePhpAstToUpstream(returned.expression, file)]);
      const projected = relationProject(expressions, expression => {
        const target = expression.kind === 'construct' && relationEqual(expression.className.value.value, 'Middleware')
          ? relationOptionFold(relationFirstOption(sequenceToArray(expression.arguments.items), argument => argument.kind === 'positional'), () => expression, argument => argument.kind === 'positional' ? argument.value : expression)
          : expression;
        const middleware = target.kind === 'literal' && target.value.kind === 'string_literal'
          ? { kind: 'middleware_name' as const, value: { kind: 'string_value' as const, value: target.value.value.value } }
          : target;
        return { kind: 'controller_middleware_relation' as const, middleware, origin: { kind: 'has_middleware' as const }, scope: { kind: 'class' as const }, actions: controllerHasMiddlewareActionScope(expression), exclusion: false, source: expression.source };
      });
      return sequence(projected);
    });
  }, () => ({ kind: 'empty' as const }));
}

function controllerMethodVisibilityFromMethod(method: ControllerMethodAst): import('../../../../types/upstream/controller').ControllerMethodVisibility {
  return relationCase<ControllerMethodAst['visibility'], import('../../../../types/upstream/controller').ControllerMethodVisibility>(method.visibility, value => value, {
    public: () => ({ kind: 'public' as const }),
    protected: () => ({ kind: 'protected' as const }),
    private: () => ({ kind: 'private' as const }),
    // PHP methods without an explicit modifier are public by default.
    implicit: () => ({ kind: 'public' as const }),
  }, () => ({ kind: 'public' as const }));
}

function sourceOffset(value: import('../../../../types/upstream/provenance').SourceSpan, side: 'start' | 'end'): number {
  return side === 'start' ? value.start.value : value.end.value;
}

function queryOperationIsWrite(operation: QueryOperationAst): boolean {
  return relationGate(
    relationEqual(operation.kind, 'model_static'),
    () => { const modelStatic = operation as Extract<QueryOperationAst, { readonly kind: 'model_static' }>; return relationCase(modelStatic.operation, value => value.kind, {
      create: () => true,
      update_or_create: () => true,
      first_or_create: () => true,
      all: () => false,
      query: () => false,
      where: () => false,
      where_key: () => false,
      with: () => false,
      order_by: () => false,
      order_by_raw: () => false,
      order_by_nulls: () => false,
      select: () => false,
      find_or_fail: () => false,
    }, () => false); },
    () => relationGate(
      relationEqual(operation.kind, 'instance'),
      () => { const instance = operation as Extract<QueryOperationAst, { readonly kind: 'instance' }>; return relationCase(instance.operation, value => value.kind, {
        mutation: () => true,
        insert: () => true,
        insert_get_id: () => true,
        upsert: () => true,
        force_delete: () => true,
        restore: () => true,
        delete: () => true,
        fill: () => true,
        create: () => true,
        update: () => true,
        update_or_create: () => true,
        first_or_create: () => true,
        increment: () => true,
        decrement: () => true,
        save: () => true,
        select: () => false,
        add_select: () => false,
        select_sub: () => false,
        select_expression: () => false,
        from_sub: () => false,
        index_hint: () => false,
        select_vector_distance: () => false,
        explain: () => false,
        distinct: () => false,
        join: () => false,
        left_join: () => false,
        right_join: () => false,
        cross_join: () => false,
        join_sub: () => false,
        join_lateral: () => false,
        left_join_lateral: () => false,
        straight_join: () => false,
        union: () => false,
        union_all: () => false,
        having: () => false,
        or_having: () => false,
        lock: () => false,
        offset: () => false,
        in_random_order: () => false,
        random_order: () => false,
        chunk: () => false,
        iteration: () => false,
        order_by_vector_distance: () => false,
        pipeline: () => false,
        execution_hook: () => false,
        execution_configuration: () => false,
        terminal: () => false,
        lazy: () => false,
        lazy_by_id: () => false,
        where: () => false,
        or_where: () => false,
        where_raw: () => false,
        reorder: () => false,
        group_limit: () => false,
        in_order_of: () => false,
        chunk_by_id: () => false,
        from_raw: () => false,
        timeout: () => false,
        relation: () => false,
        relation_aggregate: () => false,
        where_has: () => false,
        where_key: () => false,
        with: () => false,
        latest: () => false,
        oldest: () => false,
        order_by: () => false,
        order_by_raw: () => false,
        limit: () => false,
        first: () => false,
        first_or_fail: () => false,
        find: () => false,
        get: () => false,
        get_with_columns: () => false,
        find_or_fail: () => false,
        paginate: () => false,
        simple_paginate: () => false,
        cursor_paginate: () => false,
        sum: () => false,
        avg: () => false,
        min: () => false,
        max: () => false,
        count: () => false,
        sole: () => false,
        doesnt_exist: () => false,
        group_by: () => false,
        map: () => false,
        filter: () => false,
        values: () => false,
        pluck: () => false,
        value: () => false,
        exists: () => false,
        select_raw: () => false,
        select_raw_expression: () => false,
        load: () => false,
        lock_for_update: () => false,
        with_trashed: () => false,
        only_trashed: () => false,
        without_trashed: () => false,
      }, () => false); },
      () => false,
    ),
  );
}

function literalStringFromExpression(expression: Expression): string | undefined {
  if (expression.kind === 'literal' && expression.value.kind === 'string_literal') return expression.value.value.value;
  if (expression.kind !== 'static_method') return undefined;
  const first = sequenceToArray<ExpressionArgument>(expression.arguments.items)[0];
  if (!first || first.kind !== 'positional' || first.value.kind !== 'literal' || first.value.value.kind !== 'string_literal') return undefined;
  return first.value.value.value.value;
}

function queryConditionInputs(condition: QueryCondition): readonly ControllerQueryInput[] {
  return relationCase(condition, value => value.kind, {
    basic: value => [{ expression: value.value, role: 'predicate' as const }],
    between: value => [
      { expression: value.lower, role: 'predicate' as const },
      { expression: value.upper, role: 'predicate' as const },
    ],
    value_between: value => [
      { expression: value.value, role: 'predicate' as const },
    ],
    in: value => [{ expression: value.values, role: 'predicate' as const }],
    null_safe_equals: value => [{ expression: value.value, role: 'predicate' as const }],
    date_part: value => [{ expression: value.value, role: 'predicate' as const }],
    like: value => [{ expression: value.value, role: 'predicate' as const }],
    full_text: value => [{ expression: value.value, role: 'predicate' as const }],
    vector_similarity: value => [{ expression: value.vector, role: 'predicate' as const }, ...optionExpression(value.threshold, 'predicate'), ...optionExpression(value.order, 'predicate')],
    vector_distance: value => [{ expression: value.vector, role: 'predicate' as const }, { expression: value.maxDistance, role: 'predicate' as const }],
    row_values: value => [{ expression: value.values, role: 'predicate' as const }],
    nested: value => [{ expression: value.expression, role: 'predicate' as const }],
    not: value => [{ expression: value.expression, role: 'predicate' as const }],
    raw: value => [{ expression: value.expression, role: 'predicate' as const }, ...optionExpression(value.bindings, 'predicate')],
    any: value => [{ expression: value.value, role: 'predicate' as const }],
    all: value => [{ expression: value.value, role: 'predicate' as const }],
    none: value => [{ expression: value.value, role: 'predicate' as const }],
    exists: value => [{ expression: value.query, role: 'predicate' as const }],
    relation: () => [],
    json: value => queryJsonConditionInputs(value.condition),
    date_relative: () => [],
    null: () => [],
    between_columns: () => [],
    column: () => [],
    column_group: () => [],
  }, () => []);
}

function optionExpression(value: import('../../../../types/upstream/collections').Option<Expression>, role: ControllerQueryInput['role']): readonly ControllerQueryInput[] {
  return value.kind === 'none' ? [] : [{ expression: value.value, role }];
}

function queryJsonConditionInputs(condition: import('../../../../types/upstream/expression').QueryJsonCondition): readonly ControllerQueryInput[] {
  return relationCase(condition, value => value.kind, {
    contains: value => [{ expression: value.path, role: 'predicate' as const }, { expression: value.value, role: 'predicate' as const }],
  }, () => []);
}

function queryOperationInputs(operation: QueryOperationAst): readonly ControllerQueryInput[] {
  if (operation.kind !== 'model_static' && operation.kind !== 'instance') return [];
  const value = operation.operation;
  return relationCase(value, current => current.kind, {
    where: current => queryConditionInputs(current.condition),
    or_where: current => queryConditionInputs(current.condition),
    where_raw: current => [{ expression: current.condition.expression, role: 'predicate' as const }, ...optionExpression(current.condition.bindings, 'predicate')],
    where_key: current => [{ expression: current.value, role: 'key' as const }],
    find: current => [{ expression: current.key, role: 'key' as const }],
    find_or_fail: current => [{ expression: current.key, role: 'key' as const }],
    create: current => [{ expression: current.values, role: 'mutation' as const }],
    update: current => [{ expression: current.values, role: 'mutation' as const }],
    fill: current => [{ expression: current.values, role: 'mutation' as const }],
    update_or_create: current => [{ expression: current.lookup, role: 'mutation' as const }, { expression: current.values, role: 'mutation' as const }],
    first_or_create: current => [{ expression: current.attributes, role: 'mutation' as const }, { expression: current.values, role: 'mutation' as const }],
    update_or_insert: current => [{ expression: current.lookup, role: 'mutation' as const }, { expression: current.values, role: 'mutation' as const }],
    insert: current => [{ expression: current.values, role: 'mutation' as const }],
    insert_get_id: current => [{ expression: current.values, role: 'mutation' as const }, ...optionExpression(current.sequence, 'mutation')],
    upsert: current => [{ expression: current.values, role: 'mutation' as const }, { expression: current.uniqueBy, role: 'mutation' as const }, { expression: current.update, role: 'mutation' as const }],
    get_with_columns: current => [{ expression: current.columns, role: 'value' as const }],
    select: current => current.projection.kind === 'columns' ? expressionArgumentsInputs(current.projection.arguments) : [],
    add_select: current => current.projection.kind === 'columns' ? expressionArgumentsInputs(current.projection.arguments) : [],
    order_by: current => current.target.kind === 'expression' ? [{ expression: current.target.expression, role: 'value' as const }] : [],
    order_by_raw: current => [{ expression: current.target.expression, role: 'value' as const }, ...optionExpression(current.target.bindings, 'value')],
    group_by: current => current.grouping.kind === 'raw' ? [{ expression: current.grouping.expression, role: 'value' as const }, ...optionExpression(current.grouping.bindings, 'value')] : [],
    limit: current => [{ expression: current.value, role: 'value' as const }],
    offset: current => [{ expression: current.value, role: 'value' as const }],
    paginate: current => [{ expression: current.perPage, role: 'value' as const }, ...optionExpression(current.page, 'value')],
    simple_paginate: current => [{ expression: current.perPage, role: 'value' as const }],
    cursor_paginate: current => [{ expression: current.perPage, role: 'value' as const }, ...optionExpression(current.cursor, 'value')],
  }, () => []);
}

function expressionArgumentsInputs(argumentsValue: import('../../../../types/upstream/expression').ExpressionArguments): readonly ControllerQueryInput[] {
  const output: ControllerQueryInput[] = [];
  let current = argumentsValue.items;
  while (current.kind !== 'empty') {
    output.push({ expression: current.head.value, role: 'value' });
    current = current.tail;
  }
  return output;
}

export function controllerQueryEvidence(
  method: ControllerMethodAst,
  file: string,
  queries: readonly QueryAst[],
): readonly ControllerQueryEvidence[] {
  const methodSource = tokenSpan(file, method.source);
  return relationProject(
    relationSelect(queries, query => relationAll([
      relationEqual(query.source.file.value.value, file),
      relationGate(sourceOffset(query.source, 'start') >= sourceOffset(methodSource, 'start'), () => sourceOffset(query.source, 'end') <= sourceOffset(methodSource, 'end'), () => false),
      relationEqual(query.model.kind, 'known'),
    ])),
    query => ({
      kind: 'controller_query_evidence' as const,
      operation: relationAny(relationProject(sequenceToArray(query.operations), queryOperationIsWrite)) ? 'model_write' as const : 'model_query' as const,
      model: (query.model as Extract<QueryAst['model'], { readonly kind: 'known' }>).name,
      inputs: sequence(queryOperationsInputs(query.operations)),
      source: query.source,
    }),
  );
}

function queryOperationsInputs(operations: Sequence<QueryOperationAst>): readonly ControllerQueryInput[] {
  const output: ControllerQueryInput[] = [];
  let current = operations;
  while (current.kind !== 'empty') {
    output.push(...queryOperationInputs(current.head));
    current = current.tail;
  }
  return output;
}

export function controllerQueryOperations(
  method: ControllerMethodAst,
  file: string,
  queries: readonly QueryAst[],
): readonly import('../../../../types/upstream/controller').ControllerOperation[] {
  const methodSource = tokenSpan(file, method.source);
  const candidates = relationSelect(queries, query => relationAll([
    relationEqual(query.source.file.value.value, file),
    relationGate(sourceOffset(query.source, 'start') >= sourceOffset(methodSource, 'start'), () => sourceOffset(query.source, 'end') <= sourceOffset(methodSource, 'end'), () => false),
  ]));
  const queryOperations = relationProject(
    relationSelect(candidates, query => relationEqual(query.model.kind, 'known')),
    query => relationCase(query.model, value => value.kind, {
      known: model => ({
        kind: relationAny(relationProject(sequenceToArray(query.operations), queryOperationIsWrite)) ? 'model_write' as const : 'model_query' as const,
        model: (model as Extract<QueryAst['model'], { readonly kind: 'known' }>).name,
      }),
      indeterminate: () => ({ kind: 'model_query' as const, model: { kind: 'model_name' as const, value: { kind: 'string_value' as const, value: '' } } }),
    }, () => ({ kind: 'model_query' as const, model: { kind: 'string_value' as const, value: '' } as never })),
  );
  const databaseTables = relationProject(
    relationSelect(relationExpand(candidates, query => sequenceToArray(query.operations)), operation => relationEqual(operation.kind, 'database_table')),
    operation => { const tableOperation = operation as Extract<QueryOperationAst, { readonly kind: 'database_table' }>; return relationOptionFold(
      relationFirstOption([tableOperation.expression], value => literalStringFromExpression(value) !== undefined),
      () => ({ kind: 'database_table' as const, table: { kind: 'table_name' as const, value: { kind: 'string_value' as const, value: '' } } }),
      value => ({ kind: 'database_table' as const, table: { kind: 'table_name' as const, value: { kind: 'string_value' as const, value: literalStringFromExpression(value) as string } } }),
    ); },
  );
  const projected = relationSelect(relationExpand([queryOperations, databaseTables], value => value), operation => operation.kind !== 'model_query' || operation.model.value.value !== '');
  return relationFold(projected, [] as import('../../../../types/upstream/controller').ControllerOperation[], (seen, operation) => {
    const key = operation.kind === 'model_query' || operation.kind === 'model_write'
      ? `${operation.kind}:${operation.model.value.value}`
      : operation.kind === 'database_table'
        ? `${operation.kind}:${operation.table.value.value}`
        : `${operation.kind}`;
    return relationGate(
      relationFirst(seen, candidate => {
        const candidateKey = candidate.kind === 'model_query' || candidate.kind === 'model_write'
          ? `${candidate.kind}:${candidate.model.value.value}`
          : candidate.kind === 'database_table'
            ? `${candidate.kind}:${candidate.table.value.value}`
            : `${candidate.kind}`;
        return relationEqual(candidateKey, key);
      }).kind === 'some',
      () => seen,
      () => [...seen, operation],
    );
  });
}

function controllerOperationsFromMethod(method: ControllerMethodAst, semanticDataflow: ControllerSemanticDataflow, response: ControllerResponse, file: string, queries: readonly QueryAst[]): readonly import('../../../../types/upstream/controller').ControllerOperation[] {
  const resourceOperations = relationProject(semanticDataflow.resources, binding => ({
    kind: 'resource' as const,
    resource: binding.resource,
  }));
  const responseOperations = relationGate(relationEqual(response.kind, 'response_present'), () => [{
    kind: 'response' as const,
    response: response.response,
  }], () => []);
  const queryOperations = controllerQueryOperations(method, file, queries);
  const withQueries = relationExpand([queryOperations, resourceOperations], value => value);
  return relationExpand([withQueries, responseOperations], value => value);
}

export function controllerMethodContractFromMethod(
  method: ControllerMethodAst,
  controllerName: string,
  file: string,
  response: ControllerResponse,
  dependencies: readonly ControllerDependency[] = [],
  controllerAttributes: readonly import('../lexer/controllerAstTypes').ControllerParameterAttributeAst[] = [],
  queries: readonly QueryAst[] = [],
  controllerInterfaces: readonly import('../lexer/phpAstTypes').AstIdentifier[] = [],
  controllerMethods: readonly ControllerMethodAst[] = [],
  controllerInheritedAttributes: readonly import('../lexer/controllerAstTypes').ControllerParameterAttributeAst[] = [],
): import('../../../../types/upstream/controller').ControllerMethodContract {
  const semanticDataflow = semantic(method, file, response, queries);
  return {
    attributes: controllerMethodAttributesFromMethod(method, [...controllerInheritedAttributes, ...controllerAttributes], file),
    policy: sequence(relationExpand([sequenceToArray(controllerPolicyRelationsFromAttributes(controllerMethodAttributesFromMethod(method, [...controllerInheritedAttributes, ...controllerAttributes], file), { kind: 'action_name' as const, value: { kind: 'string_value' as const, value: method.name.value } })), sequenceToArray(controllerHasMiddlewareRelations(controllerMethods, controllerInterfaces, file))], value => value)),
    visibility: controllerMethodVisibilityFromMethod(method),
    parameters: controllerParameters(method, dependencies, file),
    dependencies: sequence(dependencies),
    operations: sequence(controllerOperationsFromMethod(method, semanticDataflow, response, file, queries)),
    queries: sequence(controllerQueryEvidence(method, file, queries)),
    failure: controllerFailureFromMethod(method),
    source: tokenSpan(file, method.source),
  };
}

function controllerFailureFromMethod(method: ControllerMethodAst): import('../../../../types/upstream/controller').ControllerFailureContract {
  const first = relationFirst(method.body.errors, () => true);
  return relationOptionFold(
    first,
    () => ({ kind: 'none' as const }),
    error => ({
      kind: 'http_abort' as const,
      status: defaultStatus(error.status),
    }),
  );
}

export const controllerFailureContractFromMethod = controllerFailureFromMethod;

export function controllerActionFromMethod(
  method: ControllerMethodAst,
  controllerName: string,
  file: string,
  response: ControllerResponse,
  dependencies: readonly ControllerDependency[] = [],
  policy: Sequence<ControllerPolicyRelation> = { kind: 'empty' },
  inheritedFrom: readonly import('../../../../types/upstream/names').ControllerName[] = [],
  queries: readonly QueryAst[] = [],
): ControllerAction {
  const action: ControllerAction = {
    kind: 'controller_action',
    controller: { kind: 'controller_name', value: stringValue(controllerName) },
    action: { kind: 'action_name', value: stringValue(method.name) },
    policy,
    inheritedFrom: Object.freeze([...inheritedFrom]),
    parameters: controllerParameters(method, dependencies, file),
    request: requestBinding(method),
    response,
    dependencies: sequence(dependencies),
    statements: controllerStatements(method.body.statements, file, method),
    semantic: semantic(method, controllerName, file, response, queries),
    source: tokenSpan(file, method.source),
  };
  return action;
}
