import type { BuiltinFunction, Expression } from '../../../../types/upstream/expression';
import type { PhpAstValue } from '../../lexer/phpAstExpressionTypes';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import { matchPhpAstValue } from '../../LaravelSourceLexer';
import { createSourceFile } from '../../../../types/upstream/names';
import {
  variable, className, resource, cardinality, expressions, expressionArguments, functionName, method, mapStaticReceiver, mapStaticAction, constantName,
  mapArguments, mapLiteral, memberExpression, methodExpression, mapBinaryOperator, mapUnaryOperator,
  mapCastType, mapArrayEntry, mapClosureParameter, mapAssignmentOperator, assignmentReferenceMode, mapAssignmentTarget,
} from './resourceUpstreamExpressionMappings';
import { mapClosureBody } from './resourceUpstreamExpressionClosure';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { SourceStatement, SourceStatements } from '../../../../types/upstream/sourceStatements';
import type { ResolvedExpression, AnonymousClassMember } from '../../../../types/upstream/expression';
import type { PhpStatement, PhpAssignmentTarget, PhpIfAlternative, PhpForClause } from '../../lexer/phpAstStatementTypes';


const builtinFunctionNames = new Map<string, BuiltinFunction>([
  ['isset', { kind: 'isset' }], ['implode', { kind: 'implode' }], ['method_exists', { kind: 'method_exists' }], ['array_key_exists', { kind: 'array_key_exists' }],
  ['array_map', { kind: 'array_map' }], ['array_filter', { kind: 'array_filter' }], ['array_sum', { kind: 'array_sum' }], ['array_column', { kind: 'array_column' }],
  ['array_diff', { kind: 'array_diff' }], ['array_merge', { kind: 'array_merge' }], ['array_slice', { kind: 'array_slice' }], ['array_shift', { kind: 'array_shift' }],
  ['array_unshift', { kind: 'array_unshift' }], ['base64_decode', { kind: 'base64_decode' }], ['base64_encode', { kind: 'base64_encode' }],
  ['filter_var', { kind: 'filter_var' }], ['floor', { kind: 'floor' }], ['hash_equals', { kind: 'hash_equals' }], ['http_build_query', { kind: 'http_build_query' }],
  ['json_decode', { kind: 'json_decode' }], ['json_encode', { kind: 'json_encode' }], ['is_array', { kind: 'is_array' }], ['is_numeric', { kind: 'is_numeric' }],
  ['is_object', { kind: 'is_object' }], ['is_string', { kind: 'is_string' }], ['is_dir', { kind: 'is_dir' }], ['is_file', { kind: 'is_file' }], ['is_a', { kind: 'is_a' }], ['in_array', { kind: 'in_array' }], ['max', { kind: 'max' }], ['min', { kind: 'min' }],
  ['round', { kind: 'round' }], ['strlen', { kind: 'strlen' }], ['str_replace', { kind: 'str_replace' }], ['strtr', { kind: 'strtr' }], ['str_pad', { kind: 'str_pad' }],
  ['str_starts_with', { kind: 'str_starts_with' }], ['str_ends_with', { kind: 'str_ends_with' }], ['str_contains', { kind: 'str_contains' }],
  ['strtolower', { kind: 'strtolower' }], ['strtoupper', { kind: 'strtoupper' }], ['substr', { kind: 'substr' }], ['trim', { kind: 'trim' }],
  ['ltrim', { kind: 'ltrim' }], ['rtrim', { kind: 'rtrim' }], ['explode', { kind: 'explode' }], ['preg_match', { kind: 'preg_match' }],
  ['preg_match_all', { kind: 'preg_match_all' }], ['preg_replace', { kind: 'preg_replace' }], ['preg_quote', { kind: 'preg_quote' }], ['sprintf', { kind: 'sprintf' }],
  ['call_user_func', { kind: 'call_user_func' }], ['empty', { kind: 'empty' }], ['hash', { kind: 'hash' }], ['collect', { kind: 'collect' }],
  ['config', { kind: 'config' }], ['now', { kind: 'now' }], ['response', { kind: 'response' }], ['redirect', { kind: 'redirect' }], ['abort', { kind: 'abort' }],
  ['asset', { kind: 'asset' }], ['app', { kind: 'app' }], ['copy', { kind: 'copy' }], ['random', { kind: 'random' }], ['env', { kind: 'env' }],
  ['route', { kind: 'route' }], ['storage_path', { kind: 'storage_path' }], ['public_path', { kind: 'public_path' }], ['number_format', { kind: 'number_format' }],
  ['file_exists', { kind: 'file_exists' }], ['extension_loaded', { kind: 'extension_loaded' }], ['sys_get_temp_dir', { kind: 'sys_get_temp_dir' }],
  ['realpath', { kind: 'realpath' }], ['base_path', { kind: 'base_path' }], ['database_path', { kind: 'database_path' }], ['parse_url', { kind: 'parse_url' }],
  ['array_rand', { kind: 'array_rand' }], ['uniqid', { kind: 'uniqid' }], ['count', { kind: 'count' }], ['dirname', { kind: 'dirname' }],
  ['define', { kind: 'define' }], ['microtime', { kind: 'microtime' }], ['fake', { kind: 'fake' }],
  ['function_exists', { kind: 'function_exists' }], ['class_exists', { kind: 'class_exists' }], ['is_subclass_of', { kind: 'is_subclass_of' }],
  ['class_basename', { kind: 'class_basename' }], ['app_path', { kind: 'app_path' }], ['file', { kind: 'file' }], ['file_get_contents', { kind: 'file_get_contents' }],
  ['file_put_contents', { kind: 'file_put_contents' }], ['error_reporting', { kind: 'error_reporting' }], ['token_get_all', { kind: 'token_get_all' }],
  ['print_r', { kind: 'print_r' }],
]);

function mapFunctionCall(
  name: string,
  arguments_: readonly import('../../lexer/phpAstExpressionTypes').PhpArgument[],
  source: SourceSpan,
  mapChild: (value: PhpAstValue, file: string) => Expression,
  file: string,
): Expression {
  const mappedArguments = expressionArguments(mapArguments(arguments_, mapChild, file));
  const builtin = builtinFunctionNames.get(name);
  return builtin === undefined
    ? { kind: 'call', function: functionName(name), arguments: mappedArguments, source }
    : { kind: 'builtin', function: builtin, arguments: mappedArguments, source };
}

export function mapResourcePhpAstToUpstream(value: PhpAstValue, file: string): Expression {
  const source: SourceSpan = { kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: value.source.startOffset }, end: { kind: 'number_value', value: value.source.endOffset } };
  const mapChild = (child: PhpAstValue, _file: string): Expression => mapResourcePhpAstToUpstream(child, file);
  return matchPhpAstValue(value, {
    literal: node => mapLiteral(node.literalType, node.value, source),
    interpolatedString: node => ({
      kind: 'interpolated_string',
      parts: {
        kind: 'interpolated_string_parts',
        items: sequence(node.parts.map(part => part.kind === 'text'
          ? { kind: 'text', value: { kind: 'string_value', value: part.value } }
          : { kind: 'expression', value: mapChild(part.value, file) }))
      },
      source
    }),
    resourceSingle: node => ({ kind: 'resource_reference', resource: resource(node.resourceName), cardinality: cardinality('single'), argument: mapChild(node.argument, file), source }),
    resourceCollection: node => ({ kind: 'resource_reference', resource: resource(node.resourceName), cardinality: cardinality('collection'), argument: mapChild(node.argument, file), source }),
    variableReference: node => ({ kind: 'variable', name: variable(node.name), source }),
    magicConstant: node => ({ kind: 'magic_constant', value: node.value.kind, source }),
    constantReference: node => ({ kind: 'constant_reference', reference: { kind: 'constant_reference', name: constantName(node.name) }, source }),
    propertyAccess: node => memberExpression(node.receiver, node.target, node.property, node.access, mapChild, file, source),
    methodChain: node => methodExpression(node.receiver, node.target, node.property, node.arguments, node.access, mapChild, file, source),
    arrayAccess: node => ({ kind: 'index', receiver: mapChild(node.target, file), key: mapChild(node.index, file), source }),
    functionCall: node => mapFunctionCall(node.functionName, node.arguments, source, mapChild, file),
    callableCall: node => ({ kind: 'callable_call', callable: mapChild(node.callable, file), arguments: expressionArguments(mapArguments(node.arguments, mapChild, file)), source }),
    ternaryExpression: node => ({ kind: 'conditional', condition: mapChild(node.condition, file), branches: { kind: 'then_else', whenTrue: mapChild(node.trueBranch, file), whenFalse: mapChild(node.falseBranch, file) }, source }),
    shortTernary: node => ({ kind: 'short_conditional', condition: mapChild(node.condition, file), whenFalse: mapChild(node.falseBranch, file), source }),
    nullCoalesce: node => ({ kind: 'coalesce', left: mapChild(node.left, file), right: mapChild(node.right, file), source }),
    binaryExpression: node => ({ kind: 'binary', operator: mapBinaryOperator(node.operator.kind), left: mapChild(node.left, file), right: mapChild(node.right, file), source }),
    unaryExpression: node => ({ kind: 'unary', operator: mapUnaryOperator(node.operator.kind), operand: mapChild(node.operand, file), source }),
    castExpression: node => ({ kind: 'cast', target: mapCastType(node.castType.kind), expression: mapChild(node.operand, file), source }),
    nestedArray: node => ({ kind: 'array', entries: sequence(node.entries.map((entry, index) => mapArrayEntry(entry, index, mapChild, file, source))), source }),
    staticCall: node => ({ kind: 'static_method', receiver: mapStaticReceiver(node.className), action: node.className === 'Attribute' && node.method === 'make' ? mapAttributeFactoryAction(node.arguments, mapChild, file) : mapStaticAction(node.className, node.method), arguments: expressionArguments(mapArguments(node.arguments, mapChild, file)), source }),
    classReference: node => ({ kind: 'class_reference', className: className(node.className), source }),
    classConstant: node => ({ kind: 'class_constant', reference: { kind: 'class_constant_reference', owner: mapClassConstantOwner(node.owner), name: constantName(node.name) }, source }),
    construct: node => ({ kind: 'construct', className: className(node.className), arguments: expressionArguments(mapArguments(node.arguments, mapChild, file)), source }),
    assignmentExpression: node => {
      const target = mapAssignmentTarget(node.target, mapChild, file);
      const expression = mapChild(node.value, file);
      return { kind: 'assignment_expression', value: { kind: 'assignment', target, expression, operator: mapAssignmentOperator(node.operator.kind), reference: assignmentReferenceMode(node.reference.kind), source }, source };
    },
    dynamicConstruct: node => ({ kind: 'dynamic_construct', classExpression: mapChild(node.classExpression, file), arguments: expressionArguments(mapArguments(node.arguments, mapChild, file)), source }),
    anonymousClassConstruct: node => ({
      kind: 'anonymous_class',
      value: {
        kind: 'anonymous_class',
        extendsClass: typeof node.class.extendsClass === 'string' ? className(node.class.extendsClass) : { kind: 'absent' },
        members: node.class.members.map(member => mapAnonymousClassMember(member, file, mapChild)),
      },
      arguments: expressionArguments(mapArguments(node.arguments, mapChild, file)),
      source,
    }),
    instanceOf: node => ({ kind: 'instance_of', expression: mapChild(node.expression, file), className: className(node.className), source }),
    closure: node => ({ kind: 'closure', value: { kind: 'closure', parameters: { kind: 'closure_parameters', items: sequence(node.parameters.map(item => mapClosureParameter(item, mapChild, file))) }, captures: { kind: 'closure_captures', items: sequence(node.captures.map(item => ({ kind: item.kind, variable: variable(item.variable) }))) }, returnType: node.returnType.kind === 'absent' ? { kind: 'absent' } : { kind: 'present', value: mapParameterTypeForClosureReturn(node.returnType.type) }, body: mapClosureBody(node.body.statements, file, mapChild), source }, source }),
    arrowFunction: node => ({ kind: 'arrow_function', parameters: { kind: 'closure_parameters', items: sequence(node.parameters.map(item => mapClosureParameter(item, mapChild, file))) }, body: mapChild(node.body, file), source }),
    matchExpression: node => ({
      kind: 'match',
      subject: mapChild(node.subject, file),
      arms: {
        kind: 'match_arms',
        items: sequence(node.arms.map(arm => arm.kind === 'conditional'
          ? { kind: 'conditional', conditions: expressions(arm.conditions.map(item => mapChild(item, file))), result: mapChild(arm.value, file), source }
          : { kind: 'default', result: mapChild(arm.value, file), source }))
      },
      source
    }),
    unsupported: node => ({ kind: 'unsupported_expression', reason: mapUnsupportedReason(node.reason), source }),
  });
}

function mapAnonymousClassMember(member: import('../../lexer/phpAstExpressionTypes').PhpAnonymousClassMember, file: string, mapExpression: (value: PhpAstValue, file: string) => Expression): AnonymousClassMember {
  switch (member.kind) {
    case 'property':
      return {
        kind: 'property',
        name: { kind: 'property_name', value: { kind: 'string_value', value: member.value.name } },
        value: member.value.initialization.kind === 'absent' ? { kind: 'absent' } : mapExpression(member.value.initialization.value, file),
      };
    case 'method':
      return {
        kind: 'method',
        name: method(member.value.name),
        parameters: { kind: 'closure_parameters', items: sequence(member.value.parameters.map(item => mapAnonymousClassParameter(item, mapExpression, file))) },
        returnType: member.value.declaredReturnType.kind === 'absent' ? { kind: 'absent' } : { kind: 'present', value: mapParameterTypeForClosureReturn(member.value.declaredReturnType.type) },
        body: mapResourcePhpStatementsToSourceStatements(member.value.body, file),
      };
  }
}

function mapAnonymousClassParameter(parameter: import('../../lexer/phpMethodAstTypes').PhpParameterAst, mapExpression: (value: PhpAstValue, file: string) => Expression, file: string): import('../../../../types/upstream/expression').ClosureParameter {
  return {
    kind: 'closure_parameter',
    name: variable(parameter.name),
    type: { kind: 'present', value: mapParameterTypeForClosureReturn(parameter.type) },
    passing: { kind: 'by_value' },
    variadic: { kind: 'fixed' },
    defaultValue: parameter.defaultValue.kind === 'absent' ? { kind: 'absent' } : { kind: 'present', value: mapExpression(parameter.defaultValue.value, file) },
  };
}

export function mapResourcePhpStatementsToSourceStatements(values: readonly PhpStatement[], file: string): SourceStatements {
  return { kind: 'source_statements', items: sequence(values.map(value => mapAnonymousClassStatement(value, file, mapResourcePhpAstToUpstream))) };
}

function resolved(value: PhpAstValue, file: string, mapExpression: (value: PhpAstValue, file: string) => Expression): ResolvedExpression {
  return { kind: 'resolved_expression', expression: mapExpression(value, file), result: { kind: 'unresolved', reason: 'external' } };
}

function mapAnonymousClassStatement(value: PhpStatement, file: string, mapExpression: (value: PhpAstValue, file: string) => Expression): SourceStatement {
  const source: import('../../../../types/upstream/provenance').SourceSpan = {
    kind: 'source_span', file: createSourceFile(file),
    start: { kind: 'number_value', value: value.source.startOffset },
    end: { kind: 'number_value', value: value.source.endOffset },
  };
  switch (value.kind) {
    case 'expression_statement': return { kind: 'expression', value: resolved(value.expression, file, mapExpression), source };
    case 'return_with_value': return { kind: 'return', expression: resolved(value.expression, file, mapExpression), source };
    case 'return_void': return { kind: 'return_void', source };
    case 'assignment': {
      const target = mapAssignmentTarget(value.target, mapExpression, file);
      return { kind: 'assignment', value: { kind: 'assignment', target, expression: mapExpression(value.value, file), operator: mapAssignmentOperator(value.operator.kind), reference: assignmentReferenceMode(value.reference.kind), source }, source };
    }
    case 'if_statement': return { kind: 'conditional', condition: resolved(value.condition, file, mapExpression), branches: mapAnonymousClassBranches(value.alternative, value.thenBlock.statements, file, mapResourcePhpAstToUpstream), source };
    case 'foreach_statement': return { kind: 'for_each', iterable: resolved(value.iterable, file, mapExpression), target: value.target.kind === 'value' ? { kind: 'value', variable: { kind: 'variable_name', value: { kind: 'string_value', value: value.target.variable } } } : { kind: 'key_value', key: { kind: 'variable_name', value: { kind: 'string_value', value: value.target.key } }, value: { kind: 'variable_name', value: { kind: 'string_value', value: value.target.value } } }, body: mapResourcePhpStatementsToSourceStatements(value.body.statements, file), source };
    case 'for_statement': return { kind: 'for_loop', initializer: mapAnonymousClassForClause(value.initializer, file, mapResourcePhpAstToUpstream), condition: mapAnonymousClassForClause(value.condition, file, mapResourcePhpAstToUpstream), update: mapAnonymousClassForClause(value.update, file, mapResourcePhpAstToUpstream), body: mapResourcePhpStatementsToSourceStatements(value.body.statements, file), source };
    case 'try_statement': return { kind: 'try', body: mapResourcePhpStatementsToSourceStatements(value.body.statements, file), catches: { kind: 'catch_handlers', items: sequence(value.catches.map(item => ({ kind: 'catch_handler', variable: { kind: 'variable_name', value: { kind: 'string_value', value: item.variable } }, exception: { kind: 'exception_name', value: { kind: 'string_value', value: item.exceptionType } }, body: mapResourcePhpStatementsToSourceStatements(item.body.statements, file), source: sourceSpanFromToken(file, item.source) }))) }, source };
    case 'throw_statement': return { kind: 'throw', error: resolved(value.expression, file, mapExpression), source };
    case 'unset_statement': return { kind: 'unset', targets: { kind: 'source_unset_targets', items: sequence(value.targets.flatMap(target => mapAnonymousClassUnsetTargets(target, file, mapExpression))) }, source };
    case 'include_statement': return { kind: 'include', includeKind: value.includeKind, expression: resolved(value.expression, file, mapExpression), source };
  }
}

function mapAnonymousClassBranches(alternative: PhpIfAlternative, thenValues: readonly PhpStatement[], file: string, mapExpression: (value: PhpAstValue, file: string) => Expression) {
  if (alternative.kind === 'none') return { kind: 'then_only' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file) };
  if (alternative.kind === 'else_block') return { kind: 'then_else' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file), whenFalse: mapResourcePhpStatementsToSourceStatements(alternative.block.statements, file) };
  return { kind: 'then_else' as const, whenTrue: mapResourcePhpStatementsToSourceStatements(thenValues, file), whenFalse: mapResourcePhpStatementsToSourceStatements([alternative.statement], file) };
}

function mapAnonymousClassForClause(clause: PhpForClause, file: string, mapExpression: (value: PhpAstValue, file: string) => Expression) {
  if (clause.kind === 'empty') return { kind: 'empty' as const };
  if (clause.kind === 'expression') return { kind: 'expression' as const, value: resolved(clause.value, file, mapExpression) };
  const target = mapAssignmentTarget(clause.target, mapExpression, file);
  return { kind: 'assignment' as const, value: { kind: 'assignment' as const, target, expression: mapExpression(clause.value, file), operator: mapAssignmentOperator(clause.operator.kind), reference: assignmentReferenceMode(clause.reference.kind), source: sourceSpanFromToken(file, clause.source) } };
}

function mapAnonymousClassUnsetTargets(target: PhpAssignmentTarget, file: string, mapExpression: (value: PhpAstValue, file: string) => Expression): readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[] {
  switch (target.kind) {
    case 'variables': return [{ kind: 'variables', names: { kind: 'variable_names', items: target.names.map(name => ({ kind: 'variable_name', value: { kind: 'string_value', value: name } })) } }];
    case 'destructuring': return target.pattern.entries.flatMap(entry => mapDestructuringUnsetTargets(entry));
    default: return [mapAnonymousClassUnsetTarget(target, file, mapExpression)];
  }
}

function mapDestructuringUnsetTargets(entry: import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry): readonly import('../../../../types/upstream/sourceStatements').SourceUnsetTarget[] {
  switch (entry.kind) {
    case 'variable': return [{ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: entry.name } } }];
    case 'reference_variable': return [{ kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: entry.name } } }];
    case 'keyed': return mapDestructuringUnsetTargets(entry.target);
    case 'nested': return entry.pattern.entries.flatMap(item => mapDestructuringUnsetTargets(item));
    case 'skipped': return [];
  }
}

function mapAnonymousClassUnsetTarget(target: Exclude<PhpAssignmentTarget, { kind: 'variables' } | { kind: 'destructuring' }>, file: string, mapExpression: (value: PhpAstValue, file: string) => Expression): import('../../../../types/upstream/sourceStatements').SourceUnsetTarget {
  switch (target.kind) {
    case 'variable': return { kind: 'variable', name: { kind: 'variable_name', value: { kind: 'string_value', value: target.name } } };
    case 'property': return { kind: 'property', receiver: mapExpression(target.receiver, file), name: { kind: 'property_name', value: { kind: 'string_value', value: target.property } } };
    case 'static_property': return { kind: 'static_property', owner: target.owner.kind === 'named_class' ? { kind: 'named_class', name: className(target.owner.name) } : { kind: target.owner.kind }, name: { kind: 'property_name', value: { kind: 'string_value', value: target.property } } };
    case 'array_element': return { kind: 'index', receiver: mapExpression(target.target, file), key: mapExpression(target.index, file) };
  }
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
  return owners[value as keyof typeof owners] ?? { kind: 'named_class', name: className(value) };
}

const sequence = <T>(items: readonly T[]): import('../../../../types/upstream/collections').Sequence<T> => items.reduceRight<import('../../../../types/upstream/collections').Sequence<T>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });

function mapParameterTypeForClosureReturn(type: import('../../lexer/phpMethodAstTypes').PhpParameterTypeAst): TypeExpression {
  switch (type.kind) {
    case 'primitive':
      switch (type.name) {
        case 'bool': return { kind: 'primitive', value: { kind: 'boolean' } };
        case 'string': return { kind: 'primitive', value: { kind: 'string' } };
        case 'int':
        case 'float': return { kind: 'primitive', value: { kind: 'number' } };
        case 'mixed': return { kind: 'mixed' };
        case 'array': return { kind: 'primitive', value: { kind: 'unspecified' } };
      }
    case 'named': return { kind: 'reference', value: { kind: 'class', name: className(type.name) } };
    case 'nullable': return { kind: 'nullable', value: mapParameterTypeForClosureReturn(type.inner) };
  }
}

function mapUnsupportedReason(reason: import('../../lexer/phpAstExpressionTypes').PhpUnsupportedExpressionReason): import('../../../../types/upstream/expression').UnsupportedExpressionReason {
  switch (reason) {
    case 'unclassified_expression': return { kind: 'unsupported_syntax' };
    case 'unsupported_statement': return { kind: 'unsupported_syntax' };
  }
}

function mapAttributeFactoryAction(arguments_: readonly import('../../lexer/phpAstExpressionTypes').PhpArgument[], mapExpression: (value: import('../../lexer/phpAstExpressionTypes').PhpAstValue, file: string) => Expression, file: string): import('../../../../types/upstream/expression').StaticMethodAction {
  let get: import('../../../../types/upstream/expression').AttributeFactoryCallback = { kind: 'absent' };
  let set: import('../../../../types/upstream/expression').AttributeFactoryCallback = { kind: 'absent' };
  for (const argument of arguments_) {
    if (argument.kind !== 'named') continue;
    const value = { kind: 'present' as const, expression: mapExpression(argument.value, file) };
    if (argument.name === 'get') get = value;
    if (argument.name === 'set') set = value;
  }
  return {
    kind: 'attribute_make',
    definition: {
      kind: 'attribute_factory',
      get,
      set,
      configuration: { kind: 'attribute_factory_configuration', caching: { kind: 'default' } },
    },
  };
}
