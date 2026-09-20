import { CollectionKind, PrimitiveKind, PrimitiveType, ReadonlyCollectionType, ReferenceType } from '../../../types/SemanticType';
import { ResourceFieldExpressionFactory, type ResourceFieldExpression } from '../../../../types/domain/expressions';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { PhpAstValue } from '../../lexer/PhpAst';
import { matchPhpAstValue } from '../../LaravelSourceLexer';
import { matchPhpAccessMode } from '../../lexer/phpAstAlgebra';
import type { PhpAccessMode } from '../../lexer/phpAstExpressionTypes';
import { matchPhpMatchArm } from '../../lexer/phpAstAlgebra';
import type { ResourceExpressionModel, ResourceExpressionBindingRequirement, ResourceExpressionFieldModel, ResourceAccessMode } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceArrayEntry, ResourceArrayKey } from '../../../../types/domain/expressions';
import { mapResourceBinaryOperator } from './resourceExpressionOperator';

const known = (expression: ResourceFieldExpression, type: import('../../../types/SemanticType').SemanticType): ResourceExpressionModel => ({ expression, semantic: { kind: 'known', type } });
const required = (expression: ResourceFieldExpression, requirement: ResourceExpressionBindingRequirement): ResourceExpressionModel => ({ expression, semantic: { kind: 'requires_binding', requirement } });
const rejected = (expression: ResourceFieldExpression): ResourceExpressionModel => ({ expression, semantic: { kind: 'rejected', reason: 'unsupported_syntax' } });

const accessMode = (mode: PhpAccessMode): ResourceAccessMode => mode;
const variable = (value: string) => SemanticValueFactory.variableName(value);
const model = (value: string) => SemanticValueFactory.modelName(value);
const className = (value: string) => SemanticValueFactory.className(value);
const resource = (value: string) => SemanticValueFactory.resourceName(value);
const property = (value: string) => SemanticValueFactory.propertyName(value);
const method = (value: string) => SemanticValueFactory.methodName(value);

function mapArgs(args: readonly import('../../lexer/phpAstTypes').PhpArgument[]): readonly ResourceExpressionModel[] {
  return Object.freeze(args.map(argument => mapAstValueToExpression(argument.value)));
}

function mapProperty(receiver: PhpAstValue, name: string, access: PhpAccessMode): ResourceExpressionModel {
  const target = mapAstValueToExpression(receiver);
  const expression = matchPhpAccessMode(access, {
    direct: () => ResourceFieldExpressionFactory.propertyAccess(target.expression, property(name)),
    nullsafe: () => ResourceFieldExpressionFactory.nullsafePropertyAccess(target.expression, property(name)),
  });
  return required(expression, { kind: 'property', receiver: target, property: property(name), access });
}

function mapMethod(receiver: PhpAstValue, name: string, args: readonly import('../../lexer/phpAstTypes').PhpArgument[], access: PhpAccessMode): ResourceExpressionModel {
  const target = mapAstValueToExpression(receiver);
  const arguments_ = mapArgs(args);
  const expression = matchPhpAccessMode(access, {
    direct: () => ResourceFieldExpressionFactory.methodCall(target.expression, method(name), arguments_.map(item => item.expression)),
    nullsafe: () => ResourceFieldExpressionFactory.nullsafeMethodCall(target.expression, method(name), arguments_.map(item => item.expression)),
  });
  return required(expression, { kind: 'method', receiver: target, method: method(name), arguments: arguments_, access });
}

function mapNested(value: Extract<PhpAstValue, { kind: 'nested_array' }>): ResourceExpressionModel {
  const entries: ResourceArrayEntry[] = value.entries.map((entry, index) => {
    const key: ResourceArrayKey = entry.kind === 'keyed'
      ? entry.key.kind === 'string'
        ? { kind: 'string', value: entry.key.value }
        : entry.key.kind === 'integer'
          ? { kind: 'integer', value: entry.key.value }
          : { kind: 'expression', value: mapAstValueToExpression(entry.key) }
      : { kind: 'implicit', index };
    return Object.freeze({ key, value: mapAstValueToExpression(entry.value) });
  });
  const cardinality = entries.every(entry => entry.key.kind === 'string') ? 'map' as const : 'sequence' as const;
  const expression = ResourceFieldExpressionFactory.array(entries.map(entry => entry.value.expression));
  return required(expression, { kind: 'nested_array', entries });
}

export function mapAstValueToExpression(value: PhpAstValue): ResourceExpressionModel {
  return matchPhpAstValue<ResourceExpressionModel>(value, {
    resourceCollection: v => known(ResourceFieldExpressionFactory.resource(resource(v.resourceName), { kind: 'collection' }), new ReadonlyCollectionType(CollectionKind.ARRAY, ReferenceType.resource('', v.resourceName))),
    resourceSingle: v => known(ResourceFieldExpressionFactory.resource(resource(v.resourceName)), ReferenceType.resource('', v.resourceName)),
    nestedArray: mapNested,
    propertyAccess: v => mapProperty(v.receiver, v.property, v.access.kind === 'nullsafe'),
    methodChain: v => mapMethod(v.receiver, v.property, v.arguments, v.access.kind === 'nullsafe'),
    variableReference: v => required(ResourceFieldExpressionFactory.variable(variable(v.name)), { kind: 'variable', name: variable(v.name) }),
    staticCall: v => mapStatic(v),
    arrayAccess: v => mapArrayAccess(v),
    functionCall: v => mapFunction(v),
    castExpression: v => mapCast(v),
    binaryExpression: v => mapBinary(v),
    ternaryExpression: v => mapTernary(v),
    shortTernary: v => mapShortTernary(v),
    nullCoalesce: v => mapNullCoalesce(v),
    literal: mapLiteral,
    unaryExpression: mapUnary,
    matchExpression: mapMatch,
    classReference: v => ({ expression: ResourceFieldExpressionFactory.classReference(className(v.className)), semantic: { kind: 'requires_binding', requirement: { kind: 'class_reference', className: className(v.className) } } }),
    construct: mapConstruct,
    instanceOf: mapInstanceOf,
    closure: mapClosure,
    arrowFunction: mapArrowFunction,
    unsupported: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax'))
  });
}



function mapClosure(v: Extract<PhpAstValue, { kind: 'closure' }>): ResourceExpressionModel {
  const parameters = v.parameters.map(parameter => variable(parameter.variable));
  const captures = v.captures.map(capture => ({ kind: capture.kind, variable: variable(capture.variable) } as const));
  const body = v.body.statements.map(mapClosureStatement);
  const expression = ResourceFieldExpressionFactory.closure(parameters, captures, body);
  return required(expression, { kind: 'closure', parameters, captures, body });
}

function mapArrowFunction(v: Extract<PhpAstValue, { kind: 'arrow_function' }>): ResourceExpressionModel {
  const parameters = v.parameters.map(parameter => variable(parameter.variable));
  const body = mapAstValueToExpression(v.body);
  const expression = ResourceFieldExpressionFactory.arrowFunction(parameters, body.expression);
  return required(expression, { kind: 'arrow_function', parameters, body });
}

function mapClosureStatement(statement: import('../../lexer/phpAstStatementTypes').PhpStatement): import('../../../../types/domain/expressions').ResourceClosureStatement {
  return matchPhpStatement(statement, {
    expression_statement: node => ({ kind: 'expression_statement', expression: mapAstValueToExpression(node.expression).expression }),
    return_with_value: node => ({ kind: 'return_with_value', expression: mapAstValueToExpression(node.expression).expression }),
    return_void: () => ({ kind: 'return_void' }),
    assignment: node => ({ kind: 'assignment', target: mapClosureAssignmentTarget(node.target), value: mapAstValueToExpression(node.value).expression }),
    if_statement: node => ({ kind: 'if_statement', condition: mapAstValueToExpression(node.condition).expression, thenBlock: node.thenBlock.statements.map(mapClosureStatement), alternative: mapClosureIfAlternative(node.alternative) }),
    foreach_statement: node => ({ kind: 'foreach_statement', iterable: mapAstValueToExpression(node.iterable).expression, target: mapClosureForeachTarget(node.target), body: node.body.statements.map(mapClosureStatement) }),
    for_statement: node => ({ kind: 'for_statement', initializer: mapClosureForClause(node.initializer), condition: mapClosureForClause(node.condition), update: mapClosureForClause(node.update), body: node.body.statements.map(mapClosureStatement) }),
    try_statement: node => ({ kind: 'try_statement', body: node.body.statements.map(mapClosureStatement), catches: node.catches.map(mapClosureCatch), finallyBlock: mapClosureFinally(node.finallyBlock) }),
    throw_statement: node => ({ kind: 'throw_statement', expression: mapAstValueToExpression(node.expression).expression })
  });
}

function mapClosureAssignmentTarget(target: import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget): import('../../../../types/domain/expressions').ResourceClosureAssignmentTarget {
  if (target.kind === 'variable') return { kind: 'variable', name: variable(target.name) };
  if (target.kind === 'variables') return { kind: 'variables', names: target.names.map(variable) };
  if (target.kind === 'property') return { kind: 'property', target: mapAstValueToExpression(target.receiver).expression, property: property(target.property) };
  return { kind: 'array_element', target: mapAstValueToExpression(target.target).expression, index: mapAstValueToExpression(target.index).expression };
}


function mapClosureIfAlternative(alternative: import('../../lexer/phpAstStatementTypes').PhpIfAlternative): import('../../../../types/domain/expressions').ResourceClosureIfAlternative {
  if (alternative.kind === 'none') return { kind: 'none' };
  if (alternative.kind === 'else_block') return { kind: 'else_block', block: alternative.block.statements.map(mapClosureStatement) };
  return { kind: 'else_if', statement: mapClosureStatement(alternative.statement) as Extract<import('../../../../types/domain/expressions').ResourceClosureStatement, { kind: 'if_statement' }> };
}

function mapClosureForeachTarget(target: import('../../lexer/phpAstStatementTypes').PhpForeachTarget): import('../../../../types/domain/expressions').ResourceClosureForeachTarget {
  if (target.kind === 'value') return { kind: 'value', variable: variable(target.variable) };
  return { kind: 'key_value', key: variable(target.key), value: variable(target.value) };
}

function mapClosureForClause(clause: import('../../lexer/phpAstStatementTypes').PhpForClause): import('../../../../types/domain/expressions').ResourceClosureForClause {
  if (clause.kind === 'empty') return { kind: 'empty' };
  if (clause.kind === 'assignment') return { kind: 'assignment', target: mapClosureAssignmentTarget(clause.target), value: mapAstValueToExpression(clause.value).expression };
  return { kind: 'expression', value: mapAstValueToExpression(clause.value).expression };
}

function mapClosureCatch(clause: import('../../lexer/phpAstStatementTypes').PhpCatchClause): import('../../../../types/domain/expressions').ResourceClosureCatchClause {
  return { exceptionType: clause.exceptionType, variable: variable(clause.variable), body: clause.body.statements.map(mapClosureStatement) };
}

function mapClosureFinally(clause: import('../../lexer/phpAstStatementTypes').PhpFinallyClause): import('../../../../types/domain/expressions').ResourceClosureFinallyClause {
  if (clause.kind === 'absent') return { kind: 'absent' };
  return { kind: 'present', block: clause.block.statements.map(mapClosureStatement) };
}

function mapUnary(v: Extract<PhpAstValue, { kind: 'unary_expression' }>): ResourceExpressionModel {
  const operand = mapAstValueToExpression(v.operand);
  const operator = { kind: v.operator.kind } as import('../../../../types/domain/expressions').ResourceUnaryOperator;
  return { expression: ResourceFieldExpressionFactory.unary(operator, operand.expression), semantic: { kind: 'requires_binding', requirement: { kind: 'unary', operator, operand } } };
}
function mapMatch(v: Extract<PhpAstValue, { kind: 'match_expression' }>): ResourceExpressionModel {
  const subject = mapAstValueToExpression(v.subject);
  const arms = v.arms.map(arm => matchPhpMatchArm(arm, {
    conditional: node => ({ kind: 'conditional' as const, conditions: node.conditions.map(item => mapAstValueToExpression(item).expression), value: mapAstValueToExpression(node.value).expression }),
    default: node => ({ kind: 'default' as const, value: mapAstValueToExpression(node.value).expression })
  }));
  return { expression: ResourceFieldExpressionFactory.match(subject.expression, arms), semantic: { kind: 'requires_binding', requirement: { kind: 'match', subject, arms } } };
}
function mapConstruct(v: Extract<PhpAstValue, { kind: 'construct' }>): ResourceExpressionModel {
  const arguments_ = mapArgs(v.arguments); const class = className(v.className);
  return { expression: ResourceFieldExpressionFactory.construct(class, arguments_.map(item => item.expression)), semantic: { kind: 'requires_binding', requirement: { kind: 'construct', className: className(v.className), arguments: arguments_ } } };
}
function mapInstanceOf(v: Extract<PhpAstValue, { kind: 'instance_of' }>): ResourceExpressionModel {
  const expression = mapAstValueToExpression(v.expression); const class = className(v.className);
  return { expression: ResourceFieldExpressionFactory.instanceOf(expression.expression, class), semantic: { kind: 'requires_binding', requirement: { kind: 'instance_of', expression, className: className(v.className) } } };
}

function mapStatic(v: Extract<PhpAstValue, { kind: 'static_call' }>): ResourceExpressionModel {
  const arguments_ = mapArgs(v.arguments); const className = model(v.className); const methodName = method(v.method);
  return required(ResourceFieldExpressionFactory.staticMethodCall(className, methodName, arguments_.map(item => item.expression)), { kind: 'static_method', model: className, method: methodName, arguments: arguments_ });
}
function mapArrayAccess(v: Extract<PhpAstValue, { kind: 'array_access' }>): ResourceExpressionModel {
  const target = mapAstValueToExpression(v.target); const index = mapAstValueToExpression(v.index);
  return required(ResourceFieldExpressionFactory.arrayAccess(target.expression, index.expression), { kind: 'array_access', target, index });
}
function mapFunction(v: Extract<PhpAstValue, { kind: 'function_call' }>): ResourceExpressionModel {
  const arguments_ = mapArgs(v.arguments); const name = SemanticValueFactory.phpFunctionName(v.functionName);
  return required(ResourceFieldExpressionFactory.functionCall(name, arguments_.map(item => item.expression)), { kind: 'function_call', functionName: name, arguments: arguments_ });
}
function mapCast(v: Extract<PhpAstValue, { kind: 'cast_expression' }>): ResourceExpressionModel {
  const operand = mapAstValueToExpression(v.operand); const type = SemanticValueFactory.castTypeName(v.castType.kind);
  return required(ResourceFieldExpressionFactory.typeCast(type, operand.expression), { kind: 'cast', type, operand });
}
function mapBinary(v: Extract<PhpAstValue, { kind: 'binary_expression' }>): ResourceExpressionModel {
  const left = mapAstValueToExpression(v.left); const right = mapAstValueToExpression(v.right); const operator = SemanticValueFactory.semanticOperator(mapResourceBinaryOperator(v.operator.kind));
  return required(ResourceFieldExpressionFactory.binary(operator, left.expression, right.expression), { kind: 'computation', operator, left, right });
}
function mapTernary(v: Extract<PhpAstValue, { kind: 'ternary_expression' }>): ResourceExpressionModel {
  const condition = mapAstValueToExpression(v.condition); const truthy = mapAstValueToExpression(v.trueBranch); const falsy = mapAstValueToExpression(v.falseBranch);
  return required(ResourceFieldExpressionFactory.ternary(condition.expression, truthy.expression, falsy.expression), { kind: 'conditional', condition, truthy, falsy });
}
function mapShortTernary(v: Extract<PhpAstValue, { kind: 'short_ternary' }>): ResourceExpressionModel {
  const condition = mapAstValueToExpression(v.condition); const falsy = mapAstValueToExpression(v.falseBranch);
  return required(ResourceFieldExpressionFactory.shortTernary(condition.expression, falsy.expression), { kind: 'short_conditional', condition, falsy });
}
function mapNullCoalesce(v: Extract<PhpAstValue, { kind: 'null_coalesce' }>): ResourceExpressionModel {
  const left = mapAstValueToExpression(v.left); const right = mapAstValueToExpression(v.right);
  return required(ResourceFieldExpressionFactory.nullCoalesce(left.expression, right.expression), { kind: 'null_coalesce', left, right });
}
function mapLiteral(v: Extract<PhpAstValue, { kind: 'literal' }>): ResourceExpressionModel {
  if (v.literalType === 'number') return known(ResourceFieldExpressionFactory.literal({ kind: 'number', value: v.value }), new PrimitiveType(PrimitiveKind.NUMBER));
  if (v.literalType === 'boolean') return known(ResourceFieldExpressionFactory.literal({ kind: 'boolean', value: v.value }), new PrimitiveType(PrimitiveKind.BOOLEAN));
  if (v.literalType === 'string') return known(ResourceFieldExpressionFactory.literal({ kind: 'string', value: v.value }), new PrimitiveType(PrimitiveKind.STRING));
  return rejected(ResourceFieldExpressionFactory.literal({ kind: 'null', value: null }));
}
