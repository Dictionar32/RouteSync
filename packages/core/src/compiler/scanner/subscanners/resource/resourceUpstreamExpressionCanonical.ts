import { PHP_STATEMENT_KINDS } from '../../lexer/phpAstStatementKinds';
import { solveRewriteCandidate, requirement, variantRewriteCandidate } from '../../../../semantic/kernel/semanticDecisionRewriteEngine';
import { relationGate, relationProject, relationExpand, relationLookup, relationOptionFold, relationAdvanceIndex, relationAll, relationFold } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import type { BuiltinFunction, Expression } from '../../../../types/upstream/expression';
import type { PhpAstValue } from '../../lexer/phpAstExpressionTypes';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import { matchPhpAstValue } from '../../LaravelSourceLexer';
import { createSourceFile } from '../../../../types/upstream/names';
import {
  variable, className, resource, cardinality, expressions, expressionArguments, functionName, method, resolveStaticReceiver, resolveStaticAction, constantName,
  resolveArguments, resolveLiteral, memberExpression, methodExpression, resolveBinaryOperator, resolveUnaryOperator,
  resolveCastType, resolveArrayEntry, resolveClosureParameter, resolveAssignmentOperator, assignmentReferenceMode, resolveAssignmentTarget,
} from './resourceUpstreamExpressionMappings';
import { resolveClosureBody } from './resourceUpstreamExpressionClosure';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { SourceStatement, SourceStatements } from '../../../../types/upstream/sourceStatements';
import type { ResolvedExpression, AnonymousClassMember } from '../../../../types/upstream/expression';
import type { PhpStatement, PhpAssignmentTarget, PhpIfAlternative, PhpForClause } from '../../lexer/phpAstStatementTypes';


const builtinFunctionEntries: readonly (readonly [string, BuiltinFunction])[] = [
  ['isset', { kind: 'isset' }],
  ['implode', { kind: 'implode' }],
  ['method_exists', { kind: 'method_exists' }],
  ['array_key_exists', { kind: 'array_key_exists' }],
  ['array_map', { kind: 'array_map' }],
  ['array_filter', { kind: 'array_filter' }],
  ['array_sum', { kind: 'array_sum' }],
  ['array_column', { kind: 'array_column' }],
  ['array_diff', { kind: 'array_diff' }],
  ['array_merge', { kind: 'array_merge' }],
  ['array_slice', { kind: 'array_slice' }],
  ['array_shift', { kind: 'array_shift' }],
  ['array_unshift', { kind: 'array_unshift' }],
  ['base64_decode', { kind: 'base64_decode' }],
  ['base64_encode', { kind: 'base64_encode' }],
  ['filter_var', { kind: 'filter_var' }],
  ['floor', { kind: 'floor' }],
  ['hash_equals', { kind: 'hash_equals' }],
  ['http_build_query', { kind: 'http_build_query' }],
  ['json_decode', { kind: 'json_decode' }],
  ['json_encode', { kind: 'json_encode' }],
  ['is_array', { kind: 'is_array' }],
  ['is_numeric', { kind: 'is_numeric' }],
  ['is_object', { kind: 'is_object' }],
  ['is_string', { kind: 'is_string' }],
  ['is_dir', { kind: 'is_dir' }],
  ['is_file', { kind: 'is_file' }],
  ['is_a', { kind: 'is_a' }],
  ['in_array', { kind: 'in_array' }],
  ['max', { kind: 'max' }],
  ['min', { kind: 'min' }],
  ['round', { kind: 'round' }],
  ['strlen', { kind: 'strlen' }],
  ['str_replace', { kind: 'str_replace' }],
  ['strtr', { kind: 'strtr' }],
  ['str_pad', { kind: 'str_pad' }],
  ['str_starts_with', { kind: 'str_starts_with' }],
  ['str_ends_with', { kind: 'str_ends_with' }],
  ['str_contains', { kind: 'str_contains' }],
  ['strtolower', { kind: 'strtolower' }],
  ['strtoupper', { kind: 'strtoupper' }],
  ['substr', { kind: 'substr' }],
  ['trim', { kind: 'trim' }],
  ['ltrim', { kind: 'ltrim' }],
  ['rtrim', { kind: 'rtrim' }],
  ['explode', { kind: 'explode' }],
  ['preg_match', { kind: 'preg_match' }],
  ['preg_match_all', { kind: 'preg_match_all' }],
  ['preg_replace', { kind: 'preg_replace' }],
  ['preg_quote', { kind: 'preg_quote' }],
  ['sprintf', { kind: 'sprintf' }],
  ['call_user_func', { kind: 'call_user_func' }],
  ['empty', { kind: 'empty' }],
  ['hash', { kind: 'hash' }],
  ['collect', { kind: 'collect' }],
  ['config', { kind: 'config' }],
  ['now', { kind: 'now' }],
  ['response', { kind: 'response' }],
  ['redirect', { kind: 'redirect' }],
  ['abort', { kind: 'abort' }],
  ['asset', { kind: 'asset' }],
  ['app', { kind: 'app' }],
  ['copy', { kind: 'copy' }],
  ['random', { kind: 'random' }],
  ['env', { kind: 'env' }],
  ['route', { kind: 'route' }],
  ['storage_path', { kind: 'storage_path' }],
  ['public_path', { kind: 'public_path' }],
  ['number_format', { kind: 'number_format' }],
  ['file_exists', { kind: 'file_exists' }],
  ['extension_loaded', { kind: 'extension_loaded' }],
  ['sys_get_temp_dir', { kind: 'sys_get_temp_dir' }],
  ['realpath', { kind: 'realpath' }],
  ['base_path', { kind: 'base_path' }],
  ['database_path', { kind: 'database_path' }],
  ['parse_url', { kind: 'parse_url' }],
  ['array_rand', { kind: 'array_rand' }],
  ['uniqid', { kind: 'uniqid' }],
  ['count', { kind: 'count' }],
  ['dirname', { kind: 'dirname' }],
  ['define', { kind: 'define' }],
  ['microtime', { kind: 'microtime' }],
  ['fake', { kind: 'fake' }],
  ['function_exists', { kind: 'function_exists' }],
  ['class_exists', { kind: 'class_exists' }],
  ['is_subclass_of', { kind: 'is_subclass_of' }],
  ['class_basename', { kind: 'class_basename' }],
  ['app_path', { kind: 'app_path' }],
  ['file', { kind: 'file' }],
  ['file_get_contents', { kind: 'file_get_contents' }],
  ['file_put_contents', { kind: 'file_put_contents' }],
  ['error_reporting', { kind: 'error_reporting' }],
  ['token_get_all', { kind: 'token_get_all' }],
  ['print_r', { kind: 'print_r' }],
];

function mapFunctionCall(
  name: string,
  arguments_: readonly import('../../lexer/phpAstExpressionTypes').PhpArgument[],
  source: SourceSpan,
  resolveChild: (value: PhpAstValue, file: string) => Expression,
  file: string,
): Expression {
  const resolvedArguments = expressionArguments(resolveArguments(arguments_, resolveChild, file));
  const builtin = relationLookup(builtinFunctionEntries, name);
  return relationOptionFold<BuiltinFunction, Expression>(
    builtin,
    () => ({ kind: 'call', function: functionName(name), arguments: resolvedArguments, source }),
    value => ({ kind: 'builtin', function: value, arguments: resolvedArguments, source }),
  );
}

export function mapResourcePhpAstToUpstream(value: PhpAstValue, file: string): Expression {
  const source: SourceSpan = { kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: value.source.startOffset }, end: { kind: 'number_value', value: value.source.endOffset } };
  const resolveChild = (child: PhpAstValue, _file: string): Expression => mapResourcePhpAstToUpstream(child, file);
  return matchPhpAstValue(value, {
    literal: node => resolveLiteral(node, source),
    interpolatedString: node => ({
      kind: 'interpolated_string',
      parts: {
        kind: 'interpolated_string_parts',
        items: sequence(relationProject(node.parts, part => relationGate(relationEqual(part.kind, 'text'), () => ({ kind: 'text', value: { kind: 'string_value', value: part.value } }), () => ({ kind: 'expression', value: resolveChild(part.value, file) }))))
      },
      source
    }),
    resourceSingle: node => ({ kind: 'resource_reference', resource: resource(node.resourceName), cardinality: cardinality('single'), argument: resolveChild(node.argument, file), source }),
    resourceCollection: node => ({ kind: 'resource_reference', resource: resource(node.resourceName), cardinality: cardinality('collection'), argument: resolveChild(node.argument, file), source }),
    variableReference: node => ({ kind: 'variable', name: variable(node.name), source }),
    magicConstant: node => ({ kind: 'magic_constant', value: node.value.kind, source }),
    constantReference: node => ({ kind: 'constant_reference', reference: { kind: 'constant_reference', name: constantName(node.name) }, source }),
    propertyAccess: node => memberExpression(node.receiver, node.target, node.property, node.access, resolveChild, file, source),
    methodChain: node => methodExpression(node.receiver, node.target, node.property, node.arguments, node.access, resolveChild, file, source),
    arrayAccess: node => ({ kind: 'index', receiver: resolveChild(node.target, file), key: resolveChild(node.index, file), source }),
    functionCall: node => mapFunctionCall(node.functionName, node.arguments, source, resolveChild, file),
    callableCall: node => ({ kind: 'callable_call', callable: resolveChild(node.callable, file), arguments: expressionArguments(resolveArguments(node.arguments, resolveChild, file)), source }),
    ternaryExpression: node => ({ kind: 'conditional', condition: resolveChild(node.condition, file), branches: { kind: 'then_else', whenTrue: resolveChild(node.trueBranch, file), whenFalse: resolveChild(node.falseBranch, file) }, source }),
    shortTernary: node => ({ kind: 'short_conditional', condition: resolveChild(node.condition, file), whenFalse: resolveChild(node.falseBranch, file), source }),
    nullCoalesce: node => ({ kind: 'coalesce', left: resolveChild(node.left, file), right: resolveChild(node.right, file), source }),
    binaryExpression: node => ({ kind: 'binary', operator: resolveBinaryOperator(node.operator.kind), left: resolveChild(node.left, file), right: resolveChild(node.right, file), source }),
    unaryExpression: node => ({ kind: 'unary', operator: resolveUnaryOperator(node.operator.kind), operand: resolveChild(node.operand, file), source }),
    castExpression: node => ({ kind: 'cast', target: resolveCastType(node.castType.kind), expression: resolveChild(node.operand, file), source }),
    nestedArray: node => ({ kind: 'array', entries: sequence(relationProject(node.entries, (entry, index) => resolveArrayEntry(entry, index, resolveChild, file, source))), source }),
    staticCall: node => ({ kind: 'static_method', receiver: resolveStaticReceiver(node.className), action: relationGate(relationAll([relationEqual(node.className, 'Attribute'), relationEqual(node.method, 'make')]), () => mapAttributeFactoryAction(node.arguments, resolveChild, file), () => resolveStaticAction(node.className, node.method)), arguments: expressionArguments(resolveArguments(node.arguments, resolveChild, file)), source }),
    classReference: node => ({ kind: 'class_reference', className: className(node.className), source }),
    classConstant: node => ({ kind: 'class_constant', reference: { kind: 'class_constant_reference', owner: mapClassConstantOwner(node.owner), name: constantName(node.name) }, source }),
    construct: node => ({ kind: 'construct', className: className(node.className), arguments: expressionArguments(resolveArguments(node.arguments, resolveChild, file)), source }),
    assignmentExpression: node => {
      const target = resolveAssignmentTarget(node.target, resolveChild, file);
      const expression = resolveChild(node.value, file);
      return { kind: 'assignment_expression', value: { kind: 'assignment', target, expression, operator: resolveAssignmentOperator(node.operator.kind), reference: assignmentReferenceMode(node.reference.kind), source }, source };
    },
    dynamicConstruct: node => ({ kind: 'dynamic_construct', classExpression: resolveChild(node.classExpression, file), arguments: expressionArguments(resolveArguments(node.arguments, resolveChild, file)), source }),
    anonymousClassConstruct: node => ({
      kind: 'anonymous_class',
      value: {
        kind: 'anonymous_class',
        extendsClass: relationGate(relationEqual(typeof node.class.extendsClass, 'string'), () => className(node.class.extendsClass as string), () => ({ kind: 'absent' })),
        members: relationProject(node.class.members, member => mapAnonymousClassMember(member, file, resolveChild)),
      },
      arguments: expressionArguments(resolveArguments(node.arguments, resolveChild, file)),
      source,
    }),
    instanceOf: node => ({ kind: 'instance_of', expression: resolveChild(node.expression, file), className: className(node.className), source }),
    closure: node => ({ kind: 'closure', value: { kind: 'closure', parameters: { kind: 'closure_parameters', items: sequence(relationProject(node.parameters, item => resolveClosureParameter(item, resolveChild, file))) }, captures: { kind: 'closure_captures', items: sequence(relationProject(node.captures, item => ({ kind: item.kind, variable: variable(item.variable) }))) }, returnType: relationGate<import('../../../../types/upstream/expression').ClosureReturnType>(relationEqual(node.returnType.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveParameterTypeForClosureReturn(node.returnType.type) })), body: resolveClosureBody(node.body.statements, file, resolveChild), source }, source }),
    arrowFunction: node => ({ kind: 'arrow_function', parameters: { kind: 'closure_parameters', items: sequence(relationProject(node.parameters, item => resolveClosureParameter(item, resolveChild, file))) }, body: resolveChild(node.body, file), source }),
    matchExpression: node => ({
      kind: 'match',
      subject: resolveChild(node.subject, file),
      arms: {
        kind: 'match_arms',
        items: sequence(relationProject(node.arms, arm => relationGate<import('../../../../types/upstream/expression').MatchArm>(relationEqual(arm.kind, 'conditional'), () => ({ kind: 'conditional', conditions: expressions(relationProject(arm.conditions, item => resolveChild(item, file))), result: resolveChild(arm.value, file), source }), () => ({ kind: 'default', result: resolveChild(arm.value, file), source }))))
      },
      source
    }),
    unsupported: node => ({ kind: 'unsupported_expression', reason: mapUnsupportedReason(node.reason), source }),
  });
}

function mapAnonymousClassMember(member: import('../../lexer/phpAstExpressionTypes').PhpAnonymousClassMember, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): AnonymousClassMember {
  return relationOptionFold(solveRewriteCandidate<AnonymousClassMember>([
    variantRewriteCandidate({ id: 'property', subject: member, variant: 'property', requirements: [requirement('property', relationEqual(member.kind, 'property'))], exclusions: [], dependencies: [], rewrite: value => ({
      kind: 'property',
      name: { kind: 'property_name', value: { kind: 'string_value', value: value.value.name } },
      value: relationGate(relationEqual(value.value.initialization.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveExpression(value.value.initialization.value, file) })),
    }) }),
    variantRewriteCandidate({ id: 'method', subject: member, variant: 'method', requirements: [requirement('method', relationEqual(member.kind, 'method'))], exclusions: [], dependencies: [], rewrite: value => ({
      kind: 'method',
      name: method(value.value.name),
      parameters: { kind: 'closure_parameters', items: sequence(relationProject(value.value.parameters, item => mapAnonymousClassParameter(item, resolveExpression, file))) },
      returnType: relationGate(relationEqual(value.value.declaredReturnType.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveParameterTypeForClosureReturn(value.value.declaredReturnType.type) })),
      body: mapResourcePhpStatementsToSourceStatements(value.value.body, file),
    }) }),
  ]), () => { throw Error('unresolved anonymous class member'); }, value => value);
}

function mapAnonymousClassParameter(parameter: import('../../lexer/phpMethodAstTypes').PhpParameterAst, resolveExpression: (value: PhpAstValue, file: string) => Expression, file: string): import('../../../../types/upstream/expression').ClosureParameter {
  return {
    kind: 'closure_parameter',
    name: variable(parameter.name),
    type: { kind: 'present', value: resolveParameterTypeForClosureReturn(parameter.type) },
    passing: { kind: 'by_value' },
    variadic: { kind: 'fixed' },
    defaultValue: relationGate(relationEqual(parameter.defaultValue.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveExpression(parameter.defaultValue.value, file) })),
  };
}

export function mapResourcePhpStatementsToSourceStatements(values: readonly PhpStatement[], file: string): SourceStatements {
  return { kind: 'source_statements', items: sequence(relationProject(values, value => mapAnonymousClassStatement(value, file, mapResourcePhpAstToUpstream))) };
}

function resolved(value: PhpAstValue, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): ResolvedExpression {
  return { kind: 'resolved_expression', expression: resolveExpression(value, file), result: { kind: 'unresolved', reason: 'external' } };
}

function mapAnonymousClassStatement(value: PhpStatement, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): SourceStatement {
  const source: import('../../../../types/upstream/provenance').SourceSpan = {
    kind: 'source_span', file: createSourceFile(file),
    start: { kind: 'number_value', value: value.source.startOffset },
    end: { kind: 'number_value', value: value.source.endOffset },
  };
  const candidates = [
    variantRewriteCandidate({ id: 'expression', subject: value, variant: 'expression_statement', requirements: [requirement('expression_statement', relationEqual(value.kind, 'expression_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'expression', value: resolved(statement.expression, file, resolveExpression), source }) }),
    variantRewriteCandidate({ id: 'return', subject: value, variant: 'return_with_value', requirements: [requirement('return_with_value', relationEqual(value.kind, 'return_with_value'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'return', expression: resolved(statement.expression, file, resolveExpression), source }) }),
    variantRewriteCandidate({ id: 'return_void', subject: value, variant: 'return_void', requirements: [requirement('return_void', relationEqual(value.kind, 'return_void'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'return_void', source }) }),
    variantRewriteCandidate({ id: 'assignment', subject: value, variant: 'assignment', requirements: [requirement('assignment', relationEqual(value.kind, 'assignment'))], exclusions: [], dependencies: [], rewrite: assignment => {
      const target = resolveAssignmentTarget(assignment.target, resolveExpression, file);
      return { kind: 'assignment', value: { kind: 'assignment', target, expression: resolveExpression(assignment.value, file), operator: resolveAssignmentOperator(assignment.operator.kind), reference: assignmentReferenceMode(assignment.reference.kind), source }, source };
    } }),
    variantRewriteCandidate({ id: 'conditional', subject: value, variant: 'if_statement', requirements: [requirement('conditional', relationEqual(value.kind, PHP_STATEMENT_KINDS.conditional))], exclusions: [], dependencies: [], rewrite: conditional => ({ kind: 'conditional', condition: resolved(conditional.condition, file, resolveExpression), branches: mapAnonymousClassBranches(conditional.alternative, conditional.thenBlock.statements, file, mapResourcePhpAstToUpstream), source }) }),
    variantRewriteCandidate({ id: 'collection_recurrence', subject: value, variant: 'foreach_statement', requirements: [requirement('collection_recurrence', relationEqual(value.kind, PHP_STATEMENT_KINDS.collectionRecurrence))], exclusions: [], dependencies: [], rewrite: recurrence => ({ kind: 'for_each', iterable: resolved(recurrence.iterable, file, resolveExpression), target: relationGate(relationEqual(recurrence.target.kind, 'value'), () => ({ kind: 'value', variable: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.variable } } }), () => ({ kind: 'key_value', key: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.key } }, value: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.value } } })), body: mapResourcePhpStatementsToSourceStatements(recurrence.body.statements, file), source }) }),
    variantRewriteCandidate({ id: 'counted_recurrence', subject: value, variant: 'for_statement', requirements: [requirement('counted_recurrence', relationEqual(value.kind, PHP_STATEMENT_KINDS.countedRecurrence))], exclusions: [], dependencies: [], rewrite: recurrence => ({ kind: 'for_loop', initializer: mapAnonymousClassForClause(recurrence.initializer, file, mapResourcePhpAstToUpstream), condition: mapAnonymousClassForClause(recurrence.condition, file, mapResourcePhpAstToUpstream), update: mapAnonymousClassForClause(recurrence.update, file, mapResourcePhpAstToUpstream), body: mapResourcePhpStatementsToSourceStatements(recurrence.body.statements, file), source }) }),
    variantRewriteCandidate({ id: 'try', subject: value, variant: 'try_statement', requirements: [requirement('try_statement', relationEqual(value.kind, 'try_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'try', body: mapResourcePhpStatementsToSourceStatements(statement.body.statements, file), catches: { kind: 'catch_handlers', items: sequence(relationProject(statement.catches, item => ({ kind: 'catch_handler', variable: { kind: 'variable_name', value: { kind: 'string_value', value: item.variable } }, exception: { kind: 'exception_name', value: { kind: 'string_value', value: item.exceptionType } }, body: mapResourcePhpStatementsToSourceStatements(item.body.statements, file), source: sourceSpanFromToken(file, item.source) }))) }, source }) }),
    variantRewriteCandidate({ id: 'throw', subject: value, variant: 'throw_statement', requirements: [requirement('throw_statement', relationEqual(value.kind, 'throw_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'throw', error: resolved(statement.expression, file, resolveExpression), source }) }),
    variantRewriteCandidate({ id: 'unset', subject: value, variant: 'unset_statement', requirements: [requirement('unset_statement', relationEqual(value.kind, 'unset_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'unset', targets: { kind: 'source_unset_targets', items: relationExpand(statement.targets, target => mapAnonymousClassUnsetTargets(target, file, resolveExpression)) }, source }) }),
    variantRewriteCandidate({ id: 'include', subject: value, variant: 'include_statement', requirements: [requirement('include_statement', relationEqual(value.kind, 'include_statement'))], exclusions: [], dependencies: [], rewrite: statement => ({ kind: 'include', includeKind: statement.includeKind, expression: resolved(statement.expression, file, resolveExpression), source }) }),
  ];
  return relationOptionFold(solveRewriteCandidate(candidates), () => { throw Error('unresolved source statement relation'); }, selected => selected);
}

function mapAnonymousClassBranches(alternative: PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression) {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceConditionalBranches>([
    variantRewriteCandidate({ id: 'none', subject: alternative, variant: 'none', requirements: [requirement('none', relationEqual(alternative.kind, 'none'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'then_only' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file) }) }),
    variantRewriteCandidate({ id: 'else_block', subject: alternative, variant: 'else_block', requirements: [requirement('else_block', relationEqual(alternative.kind, 'else_block'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'then_else' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file), whenFalse: mapResourcePhpStatementsToSourceStatements(value.block.statements, file) }) }),
    variantRewriteCandidate({ id: 'else_statement', subject: alternative, variant: 'else_statement', requirements: [requirement('else_statement', relationEqual(alternative.kind, 'else_statement'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'then_else' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file), whenFalse: mapResourcePhpStatementsToSourceStatements([value.statement], file) }) }),
  ]), () => { throw Error('unresolved branch relation'); }, value => value);
}

function mapAnonymousClassForClause(clause: PhpForClause, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression) {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceForClause>([
    variantRewriteCandidate({ id: 'empty', subject: clause, variant: 'empty', requirements: [requirement('empty', relationEqual(clause.kind, 'empty'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'empty' as const }) }),
    variantRewriteCandidate({ id: 'expression', subject: clause, variant: 'expression', requirements: [requirement('expression', relationEqual(clause.kind, 'expression'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'expression' as const, value: resolved(value.value, file, resolveExpression) }) }),
    variantRewriteCandidate({ id: 'assignment', subject: clause, variant: 'assignment', requirements: [requirement('assignment', relationEqual(clause.kind, 'assignment'))], exclusions: [], dependencies: [], rewrite: assignment => {
      const target = resolveAssignmentTarget(assignment.target, resolveExpression, file);
      return { kind: 'assignment' as const, value: { kind: 'assignment' as const, target, expression: resolveExpression(assignment.value, file), operator: resolveAssignmentOperator(assignment.operator.kind), reference: assignmentReferenceMode(assignment.reference.kind), source: sourceSpanFromToken(file, assignment.source) }};
    } }),
  ]), () => { throw Error('unresolved recurrence clause relation'); }, value => value);
}

function mapAnonymousClassUnsetTargets(target: PhpAssignmentTarget, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[] {
  return relationOptionFold(solveRewriteCandidate<readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[]>([
    variantRewriteCandidate({ id: 'variables', subject: target, variant: 'variables', requirements: [requirement('variables', relationEqual(target.kind, 'variables'))], exclusions: [], dependencies: [], rewrite: value => [{ kind: 'variables', names: { kind: 'variable_names', items: relationProject(value.names, name => ({ kind: 'variable_name', value: { kind: 'string_value', value: name } })) } }] }),
    variantRewriteCandidate({ id: 'destructuring', subject: target, variant: 'destructuring', requirements: [requirement('destructuring', relationEqual(target.kind, 'destructuring'))], exclusions: [], dependencies: [], rewrite: value => relationExpand(value.pattern.entries, entry => mapDestructuringUnsetTargets(entry)) }),
    { id: 'other', requirements: [requirement('other', relationAll([!relationEqual(target.kind, 'variables'), !relationEqual(target.kind, 'destructuring')]))], exclusions: [], dependencies: [], rewrite: () => [mapAnonymousClassUnsetTarget(target, file, resolveExpression)] },
  ]), () => { throw Error('unresolved unset target relation'); }, value => value);
}

function mapDestructuringUnsetTargets(entry: import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry): readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[] {
  return relationOptionFold(solveRewriteCandidate<readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[]>([
    variantRewriteCandidate({ id: 'variable', subject: entry, variant: 'variable', requirements: [requirement('variable', relationEqual(entry.kind, 'variable'))], exclusions: [], dependencies: [], rewrite: value => [{ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: value.name } } }] }),
    variantRewriteCandidate({ id: 'reference_variable', subject: entry, variant: 'reference_variable', requirements: [requirement('reference_variable', relationEqual(entry.kind, 'reference_variable'))], exclusions: [], dependencies: [], rewrite: value => [{ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: value.name } } }] }),
    variantRewriteCandidate({ id: 'keyed', subject: entry, variant: 'keyed', requirements: [requirement('keyed', relationEqual(entry.kind, 'keyed'))], exclusions: [], dependencies: [], rewrite: value => mapDestructuringUnsetTargets(value.target) }),
    variantRewriteCandidate({ id: 'nested', subject: entry, variant: 'nested', requirements: [requirement('nested', relationEqual(entry.kind, 'nested'))], exclusions: [], dependencies: [], rewrite: value => relationExpand(value.pattern.entries, item => mapDestructuringUnsetTargets(item)) }),
    variantRewriteCandidate({ id: 'skipped', subject: entry, variant: 'skipped', requirements: [requirement('skipped', relationEqual(entry.kind, 'skipped'))], exclusions: [], dependencies: [], rewrite: () => [] }),
  ]), () => { throw Error('unresolved destructuring relation'); }, value => value);
}

function mapAnonymousClassUnsetTarget(target: PhpAssignmentTarget, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): import('../../../../types/upstream/sourceStatements').SourceUnsetTarget {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceUnsetTarget>([
    variantRewriteCandidate({ id: 'variable', subject: target, variant: 'variable', requirements: [requirement('variable', relationEqual(target.kind, 'variable'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: value.name } } }) }),
    variantRewriteCandidate({ id: 'property', subject: target, variant: 'property', requirements: [requirement('property', relationEqual(target.kind, 'property'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'property', receiver: resolveExpression(value.receiver, file), name: { kind: 'property_name', value: { kind: 'string_value', value: value.property } } }) }),
    variantRewriteCandidate({ id: 'static_property', subject: target, variant: 'static_property', requirements: [requirement('static_property', relationEqual(target.kind, 'static_property'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'static_property', owner: relationGate(relationEqual(value.owner.kind, 'named_class'), () => ({ kind: 'named_class', name: className(value.owner.name) }), () => ({ kind: value.owner.kind })), name: { kind: 'property_name', value: { kind: 'string_value', value: value.property } } }) }),
    variantRewriteCandidate({ id: 'array_element', subject: target, variant: 'array_element', requirements: [requirement('array_element', relationEqual(target.kind, 'array_element'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'index', receiver: resolveExpression(value.target, file), key: resolveExpression(value.index, file) }) }),
  ]), () => { throw Error('unresolved unset target'); }, value => value);
}

function sourceSpanFromToken(file: string, token: { readonly startOffset: number; readonly endOffset: number }): import('../../../../types/upstream/provenance').SourceSpan {
  return { kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: token.startOffset }, end: { kind: 'number_value', value: token.endOffset } };
}

function mapClassConstantOwner(value: string): import('../../../../types/upstream/expression').ClassConstantOwner {
  const owners = {
    self: { kind: 'self' },
    static: { kind: 'static' },
    parent: { kind: 'parent' },
  } as const;
  return relationOptionFold(relationLookup(Object.entries(owners) as readonly (readonly [string, import('../../../../types/upstream/expression').ClassConstantOwner])[], value), () => ({ kind: 'named_class', name: className(value) }), owner => owner);
}

const sequence = <T>(items: readonly T[], index = 0): import('../../../../types/upstream/collections').Sequence<T> =>
  relationGate<import('../../../../types/upstream/collections').Sequence<T>>(index >= items.length, () => ({ kind: 'empty' }), () => ({ kind: 'cons', head: items[index], tail: sequence(items, relationAdvanceIndex(index, 1)) }));

function resolveParameterTypeForClosureReturn(type: import('../../lexer/phpMethodAstTypes').PhpParameterTypeAst): TypeExpression {
  return relationOptionFold(solveRewriteCandidate<TypeExpression>([
    variantRewriteCandidate({ id: 'primitive', subject: type, variant: 'primitive', requirements: [requirement('primitive', relationEqual(type.kind, 'primitive'))], exclusions: [], dependencies: [], rewrite: primitive => relationOptionFold(solveRewriteCandidate<TypeExpression>([
      { id: 'bool', requirements: [requirement('bool', relationEqual(primitive.name, 'bool'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'primitive', value: { kind: 'boolean' } }) },
      { id: 'string', requirements: [requirement('string', relationEqual(primitive.name, 'string'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'primitive', value: { kind: 'string' } }) },
      { id: 'number', requirements: [requirement('int_or_float', relationAny([relationEqual(primitive.name, 'int'), relationEqual(primitive.name, 'float')]))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'primitive', value: { kind: 'number' } }) },
      { id: 'mixed', requirements: [requirement('mixed', relationEqual(primitive.name, 'mixed'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'mixed' }) },
      { id: 'array', requirements: [requirement('array', relationEqual(primitive.name, 'array'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'primitive', value: { kind: 'unspecified' } }) },
    ]), () => { throw Error('unresolved primitive type relation'); }, value => value) }),
    variantRewriteCandidate({ id: 'named', subject: type, variant: 'named', requirements: [requirement('named', relationEqual(type.kind, 'named'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'reference', value: { kind: 'class', name: className(value.name) } }) }),
    variantRewriteCandidate({ id: 'nullable', subject: type, variant: 'nullable', requirements: [requirement('nullable', relationEqual(type.kind, 'nullable'))], exclusions: [], dependencies: [], rewrite: value => ({ kind: 'nullable', value: resolveParameterTypeForClosureReturn(value.inner) }) }),
  ]), () => { throw Error('unresolved parameter type relation'); }, value => value);
}

function mapUnsupportedReason(reason: import('../../lexer/phpAstExpressionTypes').PhpUnsupportedExpressionReason): import('../../../../types/upstream/expression').UnsupportedExpressionReason {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/expression').UnsupportedExpressionReason>([
    { id: 'unclassified_expression', requirements: [requirement('unclassified_expression', relationEqual(reason, 'unclassified_expression'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'unsupported_syntax' }) },
    { id: 'unsupported_statement', requirements: [requirement('unsupported_statement', relationEqual(reason, 'unsupported_statement'))], exclusions: [], dependencies: [], rewrite: () => ({ kind: 'unsupported_syntax' }) },
  ]), () => { throw Error('unresolved unsupported reason relation'); }, value => value);
}

function mapAttributeFactoryAction(arguments_: readonly import('../../lexer/phpAstExpressionTypes').PhpArgument[], resolveExpression: (value: import('../../lexer/phpAstExpressionTypes').PhpAstValue, file: string) => Expression, file: string): import('../../../../types/upstream/expression').StaticMethodAction {
  const state = relationFold(arguments_, { get: { kind: 'absent' } as import('../../../../types/upstream/expression').AttributeFactoryCallback, set: { kind: 'absent' } as import('../../../../types/upstream/expression').AttributeFactoryCallback }, (accumulator, argument) => relationGate(relationEqual(argument.kind, 'named'), () => {
    const value = { kind: 'present' as const, expression: resolveExpression(argument.value, file) };
    return relationGate(relationEqual(argument.name, 'get'), () => ({ get: value, set: accumulator.set }), () => relationGate(relationEqual(argument.name, 'set'), () => ({ get: accumulator.get, set: value }), () => accumulator));
  }, () => accumulator));
  return { kind: 'attribute_make', definition: { kind: 'attribute_factory', get: state.get, set: state.set, configuration: { kind: 'attribute_factory_configuration', caching: { kind: 'default' } } } };
}
