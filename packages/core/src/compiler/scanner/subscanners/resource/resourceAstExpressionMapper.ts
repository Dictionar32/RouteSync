import { CollectionKind, PrimitiveKind, PrimitiveType, ReadonlyCollectionType, ReferenceType } from '../../../types/SemanticType';
import { ResourceFieldExpressionFactory, type ResourceFieldExpression } from '../../../../types/domain/expressions';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { PhpAstValue } from '../../lexer/PhpAst';
import { matchPhpAstValue } from '../../LaravelSourceLexer';
import type { ResourceExpressionModel, ResourceExpressionBindingRequirement, ResourceExpressionFieldModel, ResourceAccessMode } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceArrayEntry, ResourceArrayKey } from '../../../../types/domain/expressions';
import { mapResourceBinaryOperator } from './resourceExpressionOperator';

const known = (expression: ResourceFieldExpression, type: import('../../../types/SemanticType').SemanticType): ResourceExpressionModel => ({ expression, semantic: { kind: 'known', type } });
const required = (expression: ResourceFieldExpression, requirement: ResourceExpressionBindingRequirement): ResourceExpressionModel => ({ expression, semantic: { kind: 'requires_binding', requirement } });
const rejected = (expression: ResourceFieldExpression): ResourceExpressionModel => ({ expression, semantic: { kind: 'rejected', reason: 'unsupported_syntax' } });

const accessMode = (nullsafe: boolean): ResourceAccessMode => nullsafe ? { kind: 'nullsafe' } : { kind: 'direct' };
const variable = (value: string) => SemanticValueFactory.variableName(value);
const model = (value: string) => SemanticValueFactory.modelName(value);
const resource = (value: string) => SemanticValueFactory.resourceName(value);
const property = (value: string) => SemanticValueFactory.propertyName(value);
const method = (value: string) => SemanticValueFactory.methodName(value);

function mapArgs(args: readonly import('../../lexer/phpAstTypes').PhpArgument[]): readonly ResourceExpressionModel[] {
  return Object.freeze(args.map(argument => mapAstValueToExpression(argument.value)));
}

function mapProperty(receiver: PhpAstValue, name: string, nullsafe: boolean): ResourceExpressionModel {
  const target = mapAstValueToExpression(receiver);
  const expression = nullsafe ? ResourceFieldExpressionFactory.nullsafePropertyAccess(target.expression, property(name)) : ResourceFieldExpressionFactory.propertyAccess(target.expression, property(name));
  return required(expression, { kind: 'property', receiver: target, property: property(name), access: accessMode(nullsafe) });
}

function mapMethod(receiver: PhpAstValue, name: string, args: readonly import('../../lexer/phpAstTypes').PhpArgument[], nullsafe: boolean): ResourceExpressionModel {
  const target = mapAstValueToExpression(receiver);
  const arguments_ = mapArgs(args);
  const expression = nullsafe ? ResourceFieldExpressionFactory.nullsafeMethodCall(target.expression, method(name), arguments_.map(item => item.expression)) : ResourceFieldExpressionFactory.methodCall(target.expression, method(name), arguments_.map(item => item.expression));
  return required(expression, { kind: 'method', receiver: target, method: method(name), arguments: arguments_, access: accessMode(nullsafe) });
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
    resourceCollection: v => known(ResourceFieldExpressionFactory.resource(resource(v.resourceName), { kind: 'collection' }), new ReadonlyCollectionType(CollectionKind.ARRAY, new ReferenceType('', v.resourceName))),
    resourceSingle: v => known(ResourceFieldExpressionFactory.resource(resource(v.resourceName)), new ReferenceType('', v.resourceName)),
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
    unaryExpression: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    matchExpression: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    classReference: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    closure: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    arrowFunction: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    unsupported: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax'))
  });
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
