import { PHP_STATEMENT_KINDS } from '../../lexer/phpAstStatementKinds';
import { solveRewriteCandidate, requirement } from '../../../../semantic/kernel/requirementSolver';
import { relationGate, relationProject, relationExpand, relationLookup, relationOptionFold, relationAdvanceIndex, relationAll, relationFold } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
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
    {
      id: 'property',
      requirements: [requirement('property', relationEqual(member.kind, 'property'))],
      rewrite: () => {
        const property = member as Extract<typeof member, { readonly kind: 'property' }>;
        return {
          kind: 'property',
          name: { kind: 'property_name', value: { kind: 'string_value', value: property.value.name } },
          value: relationGate(relationEqual(property.value.initialization.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveExpression(property.value.initialization.value, file) })),
        };
      },
    },
    {
      id: 'method',
      requirements: [requirement('method', relationEqual(member.kind, 'method'))],
      rewrite: () => {
        const methodMember = member as Extract<typeof member, { readonly kind: 'method' }>;
        return {
          kind: 'method',
          name: method(methodMember.value.name),
          parameters: { kind: 'closure_parameters', items: sequence(relationProject(methodMember.value.parameters, item => mapAnonymousClassParameter(item, resolveExpression, file))) },
          returnType: relationGate(relationEqual(methodMember.value.declaredReturnType.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveParameterTypeForClosureReturn(methodMember.value.declaredReturnType.type) })),
          body: mapResourcePhpStatementsToSourceStatements(methodMember.value.body, file),
        };
      },
    },
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
    { id: 'expression', requirements: [requirement('expression_statement', relationEqual(value.kind, 'expression_statement'))], rewrite: () => ({ kind: 'expression', value: resolved((value as Extract<PhpStatement, { kind: 'expression_statement' }>).expression, file, resolveExpression), source }) },
    { id: 'return', requirements: [requirement('return_with_value', relationEqual(value.kind, 'return_with_value'))], rewrite: () => ({ kind: 'return', expression: resolved((value as Extract<PhpStatement, { kind: 'return_with_value' }>).expression, file, resolveExpression), source }) },
    { id: 'return_void', requirements: [requirement('return_void', relationEqual(value.kind, 'return_void'))], rewrite: () => ({ kind: 'return_void', source }) },
    { id: 'assignment', requirements: [requirement('assignment', relationEqual(value.kind, 'assignment'))], rewrite: () => {
      const assignment = value as Extract<PhpStatement, { kind: 'assignment' }>;
      const target = resolveAssignmentTarget(assignment.target, resolveExpression, file);
      return { kind: 'assignment', value: { kind: 'assignment', target, expression: resolveExpression(assignment.value, file), operator: resolveAssignmentOperator(assignment.operator.kind), reference: assignmentReferenceMode(assignment.reference.kind), source }, source };
    } },
    { id: 'conditional', requirements: [requirement('conditional', relationEqual(value.kind, PHP_STATEMENT_KINDS.conditional))], rewrite: () => {
      const conditional = value as Extract<PhpStatement, { kind: 'if_statement' }>;
      return { kind: 'conditional', condition: resolved(conditional.condition, file, resolveExpression), branches: mapAnonymousClassBranches(conditional.alternative, conditional.thenBlock.statements, file, mapResourcePhpAstToUpstream), source };
    } },
    { id: 'collection_recurrence', requirements: [requirement('collection_recurrence', relationEqual(value.kind, PHP_STATEMENT_KINDS.collectionRecurrence))], rewrite: () => {
      const recurrence = value as Extract<PhpStatement, { kind: 'foreach_statement' }>;
      return { kind: 'for_each', iterable: resolved(recurrence.iterable, file, resolveExpression), target: relationGate(relationEqual(recurrence.target.kind, 'value'), () => ({ kind: 'value', variable: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.variable } } }), () => ({ kind: 'key_value', key: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.key } }, value: { kind: 'variable_name', value: { kind: 'string_value', value: recurrence.target.value } } })), body: mapResourcePhpStatementsToSourceStatements(recurrence.body.statements, file), source };
    } },
    { id: 'counted_recurrence', requirements: [requirement('counted_recurrence', relationEqual(value.kind, PHP_STATEMENT_KINDS.countedRecurrence))], rewrite: () => {
      const recurrence = value as Extract<PhpStatement, { kind: 'for_statement' }>;
      return { kind: 'for_loop', initializer: mapAnonymousClassForClause(recurrence.initializer, file, mapResourcePhpAstToUpstream), condition: mapAnonymousClassForClause(recurrence.condition, file, mapResourcePhpAstToUpstream), update: mapAnonymousClassForClause(recurrence.update, file, mapResourcePhpAstToUpstream), body: mapResourcePhpStatementsToSourceStatements(recurrence.body.statements, file), source };
    } },
    { id: 'try', requirements: [requirement('try_statement', relationEqual(value.kind, 'try_statement'))], rewrite: () => {
      const statement = value as Extract<PhpStatement, { kind: 'try_statement' }>;
      return { kind: 'try', body: mapResourcePhpStatementsToSourceStatements(statement.body.statements, file), catches: { kind: 'catch_handlers', items: sequence(relationProject(statement.catches, item => ({ kind: 'catch_handler', variable: { kind: 'variable_name', value: { kind: 'string_value', value: item.variable } }, exception: { kind: 'exception_name', value: { kind: 'string_value', value: item.exceptionType } }, body: mapResourcePhpStatementsToSourceStatements(item.body.statements, file), source: sourceSpanFromToken(file, item.source) }))) }, source };
    } },
    { id: 'throw', requirements: [requirement('throw_statement', relationEqual(value.kind, 'throw_statement'))], rewrite: () => ({ kind: 'throw', error: resolved((value as Extract<PhpStatement, { kind: 'throw_statement' }>).expression, file, resolveExpression), source }) },
    { id: 'unset', requirements: [requirement('unset_statement', relationEqual(value.kind, 'unset_statement'))], rewrite: () => {
      const statement = value as Extract<PhpStatement, { kind: 'unset_statement' }>;
      return { kind: 'unset', targets: { kind: 'source_unset_targets', items: relationExpand(statement.targets, target => mapAnonymousClassUnsetTargets(target, file, resolveExpression)) }, source };
    } },
    { id: 'include', requirements: [requirement('include_statement', relationEqual(value.kind, 'include_statement'))], rewrite: () => ({ kind: 'include', includeKind: (value as Extract<PhpStatement, { kind: 'include_statement' }>).includeKind, expression: resolved((value as Extract<PhpStatement, { kind: 'include_statement' }>).expression, file, resolveExpression), source }) },
  ];
  return relationOptionFold(solveRewriteCandidate(candidates), () => { throw Error('unresolved source statement relation'); }, value => value);
}

function mapAnonymousClassBranches(alternative: PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression) {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceConditionalBranches>([
    { id: 'none', requirements: [requirement('none', relationEqual(alternative.kind, 'none'))], rewrite: () => ({ kind: 'then_only' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file) }) },
    { id: 'else_block', requirements: [requirement('else_block', relationEqual(alternative.kind, 'else_block'))], rewrite: () => ({ kind: 'then_else' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file), whenFalse: mapResourcePhpStatementsToSourceStatements((alternative as Extract<PhpIfAlternative, { kind: 'else_block' }>).block.statements, file) }) },
    { id: 'else_statement', requirements: [requirement('else_statement', relationEqual(alternative.kind, 'else_statement'))], rewrite: () => ({ kind: 'then_else' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file), whenFalse: mapResourcePhpStatementsToSourceStatements([(alternative as Extract<PhpIfAlternative, { kind: 'else_if' }>).statement], file) }) },
  ]), () => { throw Error('unresolved branch relation'); }, value => value);
}

function mapAnonymousClassForClause(clause: PhpForClause, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression) {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceForClause>([
    { id: 'empty', requirements: [requirement('empty', relationEqual(clause.kind, 'empty'))], rewrite: () => ({ kind: 'empty' as const }) },
    { id: 'expression', requirements: [requirement('expression', relationEqual(clause.kind, 'expression'))], rewrite: () => ({ kind: 'expression' as const, value: resolved((clause as Extract<PhpForClause, { kind: 'expression' }>).value, file, resolveExpression) }) },
    { id: 'assignment', requirements: [requirement('assignment', relationEqual(clause.kind, 'assignment'))], rewrite: () => {
      const assignment = clause as Extract<PhpForClause, { kind: 'assignment' }>;
      const target = resolveAssignmentTarget(assignment.target, resolveExpression, file);
      return { kind: 'assignment' as const, value: { kind: 'assignment' as const, target, expression: resolveExpression(assignment.value, file), operator: resolveAssignmentOperator(assignment.operator.kind), reference: assignmentReferenceMode(assignment.reference.kind), source: sourceSpanFromToken(file, assignment.source) } };
    } },
  ]), () => { throw Error('unresolved recurrence clause relation'); }, value => value);
}

function mapAnonymousClassUnsetTargets(target: PhpAssignmentTarget, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[] {
  return relationOptionFold(solveRewriteCandidate<readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[]>([
    { id: 'variables', requirements: [requirement('variables', relationEqual(target.kind, 'variables'))], rewrite: () => [{ kind: 'variables', names: { kind: 'variable_names', items: relationProject((target as Extract<PhpAssignmentTarget, { kind: 'variables' }>).names, name => ({ kind: 'variable_name', value: { kind: 'string_value', value: name } })) } }] },
    { id: 'destructuring', requirements: [requirement('destructuring', relationEqual(target.kind, 'destructuring'))], rewrite: () => relationExpand((target as Extract<PhpAssignmentTarget, { kind: 'destructuring' }>).pattern.entries, entry => mapDestructuringUnsetTargets(entry)) },
    { id: 'other', requirements: [requirement('other', relationAll([!relationEqual(target.kind, 'variables'), !relationEqual(target.kind, 'destructuring')]))], rewrite: () => [mapAnonymousClassUnsetTarget(target as Exclude<PhpAssignmentTarget, { kind: 'variables' } | { kind: 'destructuring' }>, file, resolveExpression)] },
  ]), () => { throw Error('unresolved unset target relation'); }, value => value);
}

function mapDestructuringUnsetTargets(entry: import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry): readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[] {
  return relationOptionFold(solveRewriteCandidate<readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[]>([
    { id: 'variable', requirements: [requirement('variable', relationEqual(entry.kind, 'variable'))], rewrite: () => [{ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: (entry as Extract<typeof entry, { kind: 'variable' }>).name } } }] },
    { id: 'reference_variable', requirements: [requirement('reference_variable', relationEqual(entry.kind, 'reference_variable'))], rewrite: () => [{ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: (entry as Extract<typeof entry, { kind: 'reference_variable' }>).name } } }] },
    { id: 'keyed', requirements: [requirement('keyed', relationEqual(entry.kind, 'keyed'))], rewrite: () => mapDestructuringUnsetTargets((entry as Extract<typeof entry, { kind: 'keyed' }>).target) },
    { id: 'nested', requirements: [requirement('nested', relationEqual(entry.kind, 'nested'))], rewrite: () => relationExpand((entry as Extract<typeof entry, { kind: 'nested' }>).pattern.entries, item => mapDestructuringUnsetTargets(item)) },
    { id: 'skipped', requirements: [requirement('skipped', relationEqual(entry.kind, 'skipped'))], rewrite: () => [] },
  ]), () => { throw Error('unresolved destructuring relation'); }, value => value);
}

function mapAnonymousClassUnsetTarget(target: Exclude<PhpAssignmentTarget, { kind: 'variables' } | { kind: 'destructuring' }>, file: string, resolveExpression: (value: PhpAstValue, file: string) => Expression): import('../../../../types/upstream/sourceStatements').SourceUnsetTarget {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/sourceStatements').SourceUnsetTarget>([
    { id: 'variable', requirements: [requirement('variable', relationEqual(target.kind, 'variable'))], rewrite: () => ({ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: (target as Extract<typeof target, { kind: 'variable' }>).name } } }) },
    { id: 'property', requirements: [requirement('property', relationEqual(target.kind, 'property'))], rewrite: () => { const property = target as Extract<typeof target, { kind: 'property' }>; return { kind: 'property', receiver: resolveExpression(property.receiver, file), name: { kind: 'property_name', value: { kind: 'string_value', value: property.property } } }; } },
    { id: 'static_property', requirements: [requirement('static_property', relationEqual(target.kind, 'static_property'))], rewrite: () => { const property = target as Extract<typeof target, { kind: 'static_property' }>; return { kind: 'static_property', owner: relationGate(relationEqual(property.owner.kind, 'named_class'), () => ({ kind: 'named_class', name: className(property.owner.name) }), () => ({ kind: property.owner.kind })), name: { kind: 'property_name', value: { kind: 'string_value', value: property.property } } }; } },
    { id: 'array_element', requirements: [requirement('array_element', relationEqual(target.kind, 'array_element'))], rewrite: () => { const element = target as Extract<typeof target, { kind: 'array_element' }>; return { kind: 'index', receiver: resolveExpression(element.target, file), key: resolveExpression(element.index, file) }; } },
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
    { id: 'primitive', requirements: [requirement('primitive', relationEqual(type.kind, 'primitive'))], rewrite: () => relationOptionFold(solveRewriteCandidate<TypeExpression>([
      { id: 'bool', requirements: [requirement('bool', relationEqual((type as Extract<typeof type, { kind: 'primitive' }>).name, 'bool'))], rewrite: () => ({ kind: 'primitive', value: { kind: 'boolean' } }) },
      { id: 'string', requirements: [requirement('string', relationEqual((type as Extract<typeof type, { kind: 'primitive' }>).name, 'string'))], rewrite: () => ({ kind: 'primitive', value: { kind: 'string' } }) },
      { id: 'number', requirements: [requirement('int', ['int', 'float'].includes((type as Extract<typeof type, { kind: 'primitive' }>).name))], rewrite: () => ({ kind: 'primitive', value: { kind: 'number' } }) },
      { id: 'mixed', requirements: [requirement('mixed', relationEqual((type as Extract<typeof type, { kind: 'primitive' }>).name, 'mixed'))], rewrite: () => ({ kind: 'mixed' }) },
      { id: 'array', requirements: [requirement('array', relationEqual((type as Extract<typeof type, { kind: 'primitive' }>).name, 'array'))], rewrite: () => ({ kind: 'primitive', value: { kind: 'unspecified' } }) },
    ]), () => { throw Error('unresolved primitive type relation'); }, value => value) },
    { id: 'named', requirements: [requirement('named', relationEqual(type.kind, 'named'))], rewrite: () => ({ kind: 'reference', value: { kind: 'class', name: className((type as Extract<typeof type, { kind: 'named' }>).name) } }) },
    { id: 'nullable', requirements: [requirement('nullable', relationEqual(type.kind, 'nullable'))], rewrite: () => ({ kind: 'nullable', value: resolveParameterTypeForClosureReturn((type as Extract<typeof type, { kind: 'nullable' }>).inner) }) },
  ]), () => { throw Error('unresolved parameter type relation'); }, value => value);
}

function mapUnsupportedReason(reason: import('../../lexer/phpAstExpressionTypes').PhpUnsupportedExpressionReason): import('../../../../types/upstream/expression').UnsupportedExpressionReason {
  return relationOptionFold(solveRewriteCandidate<import('../../../../types/upstream/expression').UnsupportedExpressionReason>([
    { id: 'unclassified_expression', requirements: [requirement('unclassified_expression', relationEqual(reason, 'unclassified_expression'))], rewrite: () => ({ kind: 'unsupported_syntax' }) },
    { id: 'unsupported_statement', requirements: [requirement('unsupported_statement', relationEqual(reason, 'unsupported_statement'))], rewrite: () => ({ kind: 'unsupported_syntax' }) },
  ]), () => { throw Error('unresolved unsupported reason relation'); }, value => value);
}

function mapAttributeFactoryAction(arguments_: readonly import('../../lexer/phpAstExpressionTypes').PhpArgument[], resolveExpression: (value: import('../../lexer/phpAstExpressionTypes').PhpAstValue, file: string) => Expression, file: string): import('../../../../types/upstream/expression').StaticMethodAction {
  const state = relationFold(arguments_, { get: { kind: 'absent' } as import('../../../../types/upstream/expression').AttributeFactoryCallback, set: { kind: 'absent' } as import('../../../../types/upstream/expression').AttributeFactoryCallback }, (accumulator, argument) => relationGate(relationEqual(argument.kind, 'named'), () => {
    const value = { kind: 'present' as const, expression: resolveExpression(argument.value, file) };
    return relationGate(relationEqual(argument.name, 'get'), () => ({ get: value, set: accumulator.set }), () => relationGate(relationEqual(argument.name, 'set'), () => ({ get: accumulator.get, set: value }), () => accumulator));
  }, () => accumulator));
  return { kind: 'attribute_make', definition: { kind: 'attribute_factory', get: state.get, set: state.set, configuration: { kind: 'attribute_factory_configuration', caching: { kind: 'default' } } } };
}
