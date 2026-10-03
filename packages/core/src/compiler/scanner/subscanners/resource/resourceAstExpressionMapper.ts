import { PHP_STATEMENT_KINDS } from '../../lexer/phpAstStatementKinds';
import { CollectionKind, PrimitiveKind, PrimitiveType, ReadonlyCollectionType, ReferenceType } from '../../../types/SemanticType';
import { ResourceFieldExpressionFactory, resourceNullLiteralValue, type ResourceFieldExpression } from '../../../../types/domain/expressions';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { PhpAstValue } from '../../lexer/PhpAst';
import { matchPhpAstValue } from '../../LaravelSourceLexer';
import { matchPhpAccessMode } from '../../lexer/phpAstAlgebra';
import type { PhpAccessMode } from '../../lexer/phpAstExpressionTypes';
import { matchPhpMatchArm, matchPhpStatement } from '../../lexer/phpAstAlgebra';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationEvery, relationFirstOption, relationGate, relationOptionFold, relationProject, relationVariantValue, type RelationVariant } from '../../../../semantic/kernel/relationalSequence';
import type { ResourceExpressionModel, ResourceExpressionBindingRequirement, ResourceAccessMode } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceArrayEntry, ResourceArrayKey } from '../../../../types/domain/expressions';
import * as BinaryOperator from './resourceExpressionOperator';
import * as Upstream from './resourceUpstreamExpressionCanonical';
import * as Closure from './resourceUpstreamExpressionClosure';
import * as AssignmentMappings from './resourceUpstreamExpressionMappings';

type DomainExpressionModel = Omit<ResourceExpressionModel, 'upstream'>;
const known = (expression: ResourceFieldExpression, type: import('../../../types/SemanticType').SemanticType): DomainExpressionModel => ({ expression, semantic: { kind: 'known', type } });
const required = (expression: ResourceFieldExpression, requirement: ResourceExpressionBindingRequirement): DomainExpressionModel => ({ expression, semantic: { kind: 'requires_binding', requirement } });
const rejected = (expression: ResourceFieldExpression): DomainExpressionModel => ({ expression, semantic: { kind: 'rejected', reason: 'unsupported_syntax' } });

const accessMode = (mode: PhpAccessMode): ResourceAccessMode => mode;
const variable = (value: string) => SemanticValueFactory.variableName(value);
const model = (value: string) => SemanticValueFactory.modelName(value);
const className = (value: string) => SemanticValueFactory.className(value);
const exceptionName = (value: string): import('../../../../types/upstream/names').ExceptionName => ({ kind: 'exception_name', value: { kind: 'string_value', value } });
const resource = (value: string) => SemanticValueFactory.resourceName(value);
const property = (value: string) => SemanticValueFactory.propertyName(value);
const method = (value: string) => SemanticValueFactory.methodName(value);

function resolveArguments(args: readonly import('../../lexer/phpAstTypes').PhpArgument[]): readonly ResourceExpressionModel[] {
  return Object.freeze(relationProject(args, argument => resolveAstValueToExpression(argument.value)));
}

function resolveProperty(receiver: PhpAstValue, name: string, access: PhpAccessMode): DomainExpressionModel {
  const target = resolveAstValueToExpression(receiver);
  const expression = matchPhpAccessMode(access, {
    direct: () => ResourceFieldExpressionFactory.propertyAccess(target.expression, property(name)),
    nullsafe: () => ResourceFieldExpressionFactory.nullsafePropertyAccess(target.expression, property(name)),
  });
  return required(expression, { kind: 'property', receiver: target, property: property(name), access });
}

function resolveMethod(receiver: PhpAstValue, name: string, args: readonly import('../../lexer/phpAstTypes').PhpArgument[], access: PhpAccessMode): DomainExpressionModel {
  const target = resolveAstValueToExpression(receiver);
  const arguments_ = resolveArguments(args);
  const expression = matchPhpAccessMode(access, {
    direct: () => ResourceFieldExpressionFactory.methodCall(target.expression, method(name), relationProject(arguments_, item => item.expression)),
    nullsafe: () => ResourceFieldExpressionFactory.nullsafeMethodCall(target.expression, method(name), relationProject(arguments_, item => item.expression)),
  });
  return required(expression, { kind: 'method', receiver: target, method: method(name), arguments: arguments_, access });
}

function resolveNested(value: RelationVariant<PhpAstValue, 'nested_array'>): DomainExpressionModel {
  const entries = relationProject(value.entries, (entry, index): ResourceArrayEntry => {
    const key = relationGate<ResourceArrayKey>(relationEqual(entry.kind, 'keyed'),
      () => {
        const keyed = relationVariantValue(entry, 'keyed');
        return relationGate<ResourceArrayKey>(relationEqual(keyed.key.kind, 'string'),
          () => ({ kind: 'string', value: keyed.key.value }),
          () => relationGate<ResourceArrayKey>(relationEqual(keyed.key.kind, 'integer'),
            () => ({ kind: 'integer', value: keyed.key.value }),
            () => ({ kind: 'expression', value: resolveAstValueToExpression(keyed.key.value) })));
      },
      () => ({ kind: 'implicit', index }));
    return Object.freeze({ key, value: resolveAstValueToExpression(entry.value) });
  });
  const cardinality = relationGate<'map' | 'sequence'>(relationEvery(entries, entry => relationEqual(entry.key.kind, 'string')), () => 'map', () => 'sequence');
  const expression = ResourceFieldExpressionFactory.array(relationProject(entries, entry => entry.value), cardinality);
  return required(expression, { kind: 'nested_array', entries });
}

export function resolveAstValueToExpression(value: PhpAstValue, sourceFile = '<scanner>'): ResourceExpressionModel {
  const upstream = Upstream['mapResourcePhpAstToUpstream'](value, sourceFile);
  const model = resolveAstValueToDomainExpression(value, sourceFile);
  return { ...model, upstream };
}

function resolveAstValueToDomainExpression(value: PhpAstValue, sourceFile = '<scanner>'): DomainExpressionModel {
  const model = matchPhpAstValue<DomainExpressionModel>(value, {
    resourceCollection: v => known(ResourceFieldExpressionFactory.resource(resource(v.resourceName), { kind: 'collection' }), ReadonlyCollectionType(CollectionKind.ARRAY, ReferenceType.resource('', v.resourceName))),
    resourceSingle: v => known(ResourceFieldExpressionFactory.resource(resource(v.resourceName)), ReferenceType.resource('', v.resourceName)),
    nestedArray: resolveNested,
    propertyAccess: v => resolveProperty(v.receiver, v.property, matchPhpAccessMode(v.access, { direct: () => false, nullsafe: () => true })),
    methodChain: v => resolveMethod(v.receiver, v.property, v.arguments, matchPhpAccessMode(v.access, { direct: () => false, nullsafe: () => true })),
    variableReference: v => required(ResourceFieldExpressionFactory.variable(variable(v.name)), { kind: 'variable', name: variable(v.name) }),
    staticCall: v => resolveStatic(v),
    arrayAccess: v => resolveArrayAccess(v),
    functionCall: v => resolveFunction(v),
    castExpression: v => resolveCast(v),
    binaryExpression: v => resolveBinary(v),
    ternaryExpression: v => resolveTernary(v),
    shortTernary: v => resolveShortTernary(v),
    nullCoalesce: v => resolveNullCoalesce(v),
    literal: resolveLiteral,
    unaryExpression: resolveUnary,
    matchExpression: resolveMatch,
    classReference: v => ({ expression: ResourceFieldExpressionFactory.classReference(className(v.className)), semantic: { kind: 'requires_binding', requirement: { kind: 'class_reference', className: className(v.className) } } }),
    construct: resolveConstruct,
    instanceOf: resolveInstanceOf,
    closure: v => resolveClosure(v, sourceFile),
    arrowFunction: resolveArrowFunction,
    unsupported: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax'))
  });
  return model;
}



function resolveClosure(v: RelationVariant<PhpAstValue, 'closure'>, sourceFile: string): DomainExpressionModel {
  const parameters = relationProject(v.parameters, parameter => variable(parameter.variable));
  const captures = relationProject(v.captures, capture => ({ kind: capture.kind, variable: variable(capture.variable) } as const));
  const body = relationProject(v.body.statements, item => resolveClosureStatement(item, sourceFile));
  const expression = ResourceFieldExpressionFactory.closure(parameters, captures, body);
  return required(expression, { kind: 'closure', parameters, captures, body });
}

function resolveArrowFunction(v: RelationVariant<PhpAstValue, 'arrow_function'>): DomainExpressionModel {
  const parameters = relationProject(v.parameters, parameter => variable(parameter.variable));
  const body = resolveAstValueToExpression(v.body);
  const expression = ResourceFieldExpressionFactory.arrowFunction(parameters, body.expression);
  return required(expression, { kind: 'arrow_function', parameters, body });
}

function resolveClosureStatement(statement: import('../../lexer/phpAstStatementTypes').PhpStatement, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureStatement {
  return matchPhpStatement(statement, {
    expression_statement: node => ({ kind: 'expression_statement', expression: resolveAstValueToExpression(node.expression, sourceFile).expression }),
    return_with_value: node => ({ kind: 'return_with_value', expression: resolveAstValueToExpression(node.expression, sourceFile).expression }),
    return_void: () => ({ kind: 'return_void' }),
    assignment: node => { const upstream = Closure.resolveClosureAssignment(node, sourceFile, (value, file) => Upstream['mapResourcePhpAstToUpstream'](value, file)); return { kind: 'assignment', upstream, target: resolveAssignmentTarget(node.target, sourceFile), value: resolveAstValueToExpression(node.value, sourceFile).expression, operator: upstream.operator, reference: upstream.reference, source: upstream.source }; },
    [PHP_STATEMENT_KINDS.conditional]: node => ({ kind: PHP_STATEMENT_KINDS.conditional, condition: resolveAstValueToExpression(node.condition, sourceFile).expression, thenBlock: relationProject(node.thenBlock.statements, item => resolveClosureStatement(item, sourceFile)), alternative: resolveIfAlternative(node.alternative, sourceFile) }),
    [PHP_STATEMENT_KINDS.collectionRecurrence]: node => ({ kind: PHP_STATEMENT_KINDS.collectionRecurrence, iterable: resolveAstValueToExpression(node.iterable, sourceFile).expression, target: resolveForeachTarget(node.target), body: relationProject(node.body.statements, item => resolveClosureStatement(item, sourceFile)) }),
    [PHP_STATEMENT_KINDS.countedRecurrence]: node => ({ kind: PHP_STATEMENT_KINDS.countedRecurrence, initializer: resolveForClause(node.initializer, sourceFile), condition: resolveForClause(node.condition, sourceFile), update: resolveForClause(node.update, sourceFile), body: relationProject(node.body.statements, item => resolveClosureStatement(item, sourceFile)) }),
    try_statement: node => ({ kind: 'try_statement', body: relationProject(node.body.statements, item => resolveClosureStatement(item, sourceFile)), catches: relationProject(node.catches, item => resolveCatch(item, sourceFile)), finallyBlock: resolveFinally(node.finallyBlock, sourceFile) }),
    throw_statement: node => ({ kind: 'throw_statement', expression: resolveAstValueToExpression(node.expression, sourceFile).expression })
  });
}

function resolveIfAlternative(alternative: import('../../lexer/phpAstStatementTypes').PhpIfAlternative, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureIfAlternative {
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureIfAlternative>(relationEqual(alternative.kind, 'none'),
    () => ({ kind: 'none' }),
    () => relationGate(relationEqual(alternative.kind, 'else_block'),
      () => { const value = relationVariantValue(alternative, 'else_block'); return { kind: 'else_block', block: relationProject(value.block.statements, item => resolveClosureStatement(item, sourceFile)) }; },
      () => { const value = relationVariantValue(alternative, 'else_if'); return { kind: 'else_if', statement: resolveClosureStatement(value.statement, sourceFile) }; }));
}

function resolveAssignmentTarget(target: import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureAssignmentTarget {
  const canonical = AssignmentMappings['resolveAssignmentTarget'](target, (value, file) => Upstream['mapResourcePhpAstToUpstream'](value, file), sourceFile);
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureAssignmentTarget>(relationEqual(target.kind, 'variable'),
    () => ({ kind: 'variable', name: variable(relationVariantValue(target, 'variable').name) }),
    () => relationGate(relationEqual(target.kind, 'variables'),
      () => ({ kind: 'variables', names: relationProject(relationVariantValue(target, 'variables').names, name => variable(name)) }),
      () => relationGate(relationEqual(target.kind, 'destructuring'),
        () => ({ kind: 'destructuring', pattern: relationVariantValue(canonical, 'destructuring').pattern }),
        () => relationGate(relationEqual(target.kind, 'property'),
          () => { const value = relationVariantValue(target, 'property'); return { kind: 'property', target: resolveAstValueToExpression(value.receiver, sourceFile).expression, property: property(value.property) }; },
          () => relationGate(relationEqual(target.kind, 'static_property'),
            () => { const value = relationVariantValue(target, 'static_property'); return { kind: 'static_property', owner: relationGate(relationEqual(value.owner.kind, 'named_class'), () => className(value.owner.name), () => ({ kind: value.owner.kind })), property: property(value.property) }; },
            () => relationGate(relationEqual(target.kind, 'array_element'),
              () => { const value = relationVariantValue(target, 'array_element'); return { kind: 'array_element', target: resolveAstValueToExpression(value.target, sourceFile).expression, index: resolveAstValueToExpression(value.index, sourceFile).expression }; },
              () => { const value = relationVariantValue(target, 'append'); return { kind: 'append', target: resolveAstValueToExpression(value.target, sourceFile).expression }; }))))));
}

function resolveForeachTarget(target: import('../../lexer/phpAstStatementTypes').PhpForeachTarget): import('../../../../types/domain/expressions').ResourceClosureForeachTarget {
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureForeachTarget>(relationEqual(target.kind, 'value'),
    () => { const value = relationVariantValue(target, 'value'); return { kind: 'value', variable: variable(value.variable) }; },
    () => { const value = relationVariantValue(target, 'key_value'); return { kind: 'key_value', key: variable(value.key), value: variable(value.value) }; });
}

function resolveForClause(clause: import('../../lexer/phpAstStatementTypes').PhpForClause, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureForClause {
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureForClause>(relationEqual(clause.kind, 'empty'),
    () => ({ kind: 'empty' }),
    () => relationGate(relationEqual(clause.kind, 'assignment'),
      () => { const value = relationVariantValue(clause, 'assignment'); const upstream = Closure.resolveClosureForAssignment(value, sourceFile, (expression, file) => Upstream['mapResourcePhpAstToUpstream'](expression, file)); return { kind: 'assignment', upstream, target: resolveAssignmentTarget(value.target, sourceFile), value: resolveAstValueToExpression(value.value, sourceFile).expression, operator: upstream.operator, reference: upstream.reference, source: upstream.source }; },
      () => { const value = relationVariantValue(clause, 'expression'); return { kind: 'expression', value: resolveAstValueToExpression(value.value, sourceFile).expression }; }));
}

function resolveCatch(clause: import('../../lexer/phpAstStatementTypes').PhpCatchClause, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureCatchClause {
  return { exceptionType: exceptionName(clause.exceptionType), variable: variable(clause.variable), body: relationProject(clause.body.statements, item => resolveClosureStatement(item, sourceFile)) };
}

function resolveFinally(clause: import('../../lexer/phpAstStatementTypes').PhpFinallyClause, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureFinallyClause {
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureFinallyClause>(relationEqual(clause.kind, 'absent'),
    () => ({ kind: 'absent' }),
    () => { const value = relationVariantValue(clause, 'present'); return { kind: 'present', block: relationProject(value.block.statements, item => resolveClosureStatement(item, sourceFile)) }; });
}

function resolveUnary(v: RelationVariant<PhpAstValue, 'unary_expression'>): DomainExpressionModel {
  const operand = resolveAstValueToExpression(v.operand);
  const operator = { kind: v.operator.kind } as import('../../../../types/domain/expressions').ResourceUnaryOperator;
  return { expression: ResourceFieldExpressionFactory.unary(operator, operand.expression), semantic: { kind: 'requires_binding', requirement: { kind: 'unary', operator, operand } } };
}
function resolveMatch(v: RelationVariant<PhpAstValue, 'match_expression'>): DomainExpressionModel {
  const subject = resolveAstValueToExpression(v.subject);
  const arms = relationProject(v.arms, arm => matchPhpMatchArm(arm, {
    conditional: node => ({ kind: 'conditional' as const, conditions: relationProject(node.conditions, item => resolveAstValueToExpression(item).expression), value: resolveAstValueToExpression(node.value).expression }),
    default: node => ({ kind: 'default' as const, value: resolveAstValueToExpression(node.value).expression })
  }));
  return { expression: ResourceFieldExpressionFactory.match(subject.expression, arms), semantic: { kind: 'requires_binding', requirement: { kind: 'match', subject, arms } } };
}
function resolveConstruct(v: RelationVariant<PhpAstValue, 'construct'>): DomainExpressionModel {
  const arguments_ = resolveArguments(v.arguments); const classReference = className(v.className);
  return { expression: ResourceFieldExpressionFactory.construct(classReference, relationProject(arguments_, item => item.expression)), semantic: { kind: 'requires_binding', requirement: { kind: 'construct', className: className(v.className), arguments: arguments_ } } };
}
function resolveInstanceOf(v: RelationVariant<PhpAstValue, 'instance_of'>): DomainExpressionModel {
  const expression = resolveAstValueToExpression(v.expression); const classReference = className(v.className);
  return { expression: ResourceFieldExpressionFactory.instanceOf(expression.expression, classReference), semantic: { kind: 'requires_binding', requirement: { kind: 'instance_of', expression, className: className(v.className) } } };
}

function resolveStatic(v: RelationVariant<PhpAstValue, 'static_call'>): DomainExpressionModel {
  const arguments_ = resolveArguments(v.arguments); const className = model(v.className); const methodName = method(v.method);
  return required(ResourceFieldExpressionFactory.staticMethodCall(className, methodName, relationProject(arguments_, item => item.expression)), { kind: 'static_method', model: className, method: methodName, arguments: arguments_ });
}
function resolveArrayAccess(v: RelationVariant<PhpAstValue, 'array_access'>): DomainExpressionModel {
  const target = resolveAstValueToExpression(v.target); const index = resolveAstValueToExpression(v.index);
  return required(ResourceFieldExpressionFactory.arrayAccess(target.expression, index.expression), { kind: 'array_access', target, index });
}
function resolveFunction(v: RelationVariant<PhpAstValue, 'function_call'>): DomainExpressionModel {
  const arguments_ = resolveArguments(v.arguments); const name = SemanticValueFactory.phpFunctionName(v.functionName);
  return required(ResourceFieldExpressionFactory.functionCall(name, relationProject(arguments_, item => item.expression)), { kind: 'function_call', functionName: name, arguments: arguments_ });
}
function resolveCast(v: RelationVariant<PhpAstValue, 'cast_expression'>): DomainExpressionModel {
  const operand = resolveAstValueToExpression(v.operand); const type = SemanticValueFactory.castTypeName(v.castType.kind);
  return required(ResourceFieldExpressionFactory.typeCast(type, operand.expression), { kind: 'cast', type, operand });
}
function resolveBinary(v: RelationVariant<PhpAstValue, 'binary_expression'>): DomainExpressionModel {
  const left = resolveAstValueToExpression(v.left); const right = resolveAstValueToExpression(v.right); const operator = SemanticValueFactory.semanticOperator(BinaryOperator['mapResourceBinaryOperator'](v.operator.kind));
  return required(ResourceFieldExpressionFactory.binary(operator, left.expression, right.expression), { kind: 'computation', operator, left, right });
}
function resolveTernary(v: RelationVariant<PhpAstValue, 'ternary_expression'>): DomainExpressionModel {
  const condition = resolveAstValueToExpression(v.condition); const truthy = resolveAstValueToExpression(v.trueBranch); const falsy = resolveAstValueToExpression(v.falseBranch);
  return required(ResourceFieldExpressionFactory.ternary(condition.expression, truthy.expression, falsy.expression), { kind: 'conditional', condition, truthy, falsy });
}
function resolveShortTernary(v: RelationVariant<PhpAstValue, 'short_ternary'>): DomainExpressionModel {
  const condition = resolveAstValueToExpression(v.condition); const falsy = resolveAstValueToExpression(v.falseBranch);
  return required(ResourceFieldExpressionFactory.shortTernary(condition.expression, falsy.expression), { kind: 'short_conditional', condition, falsy });
}
function resolveNullCoalesce(v: RelationVariant<PhpAstValue, 'null_coalesce'>): DomainExpressionModel {
  const left = resolveAstValueToExpression(v.left); const right = resolveAstValueToExpression(v.right);
  return required(ResourceFieldExpressionFactory.nullCoalesce(left.expression, right.expression), { kind: 'null_coalesce', left, right });
}
function resolveLiteral(v: RelationVariant<PhpAstValue, 'literal'>): DomainExpressionModel {
  const literal: import('../../lexer/phpAstExpressionTypes').PhpLiteralValue = v;
  const numberLiteral = relationFirstOption([literal], (value): value is RelationVariant<import('../../lexer/phpAstExpressionTypes').PhpLiteralValue, 'number'> => relationEqual(value.literalType, 'number'));
  return relationOptionFold(numberLiteral,
    () => {
      const booleanLiteral = relationFirstOption([literal], (value): value is RelationVariant<import('../../lexer/phpAstExpressionTypes').PhpLiteralValue, 'boolean'> => relationEqual(value.literalType, 'boolean'));
      return relationOptionFold(booleanLiteral,
        () => {
          const stringLiteral = relationFirstOption([literal], (value): value is RelationVariant<import('../../lexer/phpAstExpressionTypes').PhpLiteralValue, 'string'> => relationEqual(value.literalType, 'string'));
          return relationOptionFold(stringLiteral,
            () => rejected(ResourceFieldExpressionFactory.literal(resourceNullLiteralValue())),
            value => known(ResourceFieldExpressionFactory.literal({ kind: 'string', value: value.value }), primitiveType(PrimitiveKind.STRING)));
        },
        value => known(ResourceFieldExpressionFactory.literal({ kind: 'boolean', value: value.value }), primitiveType(PrimitiveKind.BOOLEAN)));
    },
    value => known(ResourceFieldExpressionFactory.literal({ kind: 'number', value: value.value }), primitiveType(PrimitiveKind.NUMBER)));
}

