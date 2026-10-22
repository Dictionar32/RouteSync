import { CollectionKind, PrimitiveKind, ReadonlyCollectionType, ReferenceType, primitiveType } from '../../../../types/domain/semanticType';
import { ResourceFieldExpressionFactory, resourceNullLiteralValue, type ResourceFieldExpression } from '../../../../types/domain/expressions';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { PhpAstValue } from '../PhpAst';
import { matchPhpAstValue } from '../../LaravelSourceLexer';
import { matchPhpAccessMode, matchPhpArrayKey, matchPhpStaticPropertyOwner } from '../phpAstAlgebra';
import type { PhpAccessMode } from '../phpAstExpressionTypes';
import { matchPhpMatchArm, matchPhpStatement } from '../phpAstAlgebra';
import { relationEqual } from '../../../../semantic/relations/semanticRelations';
import { relationEvery, relationFirstOption, relationGate, relationOptionFold, relationProject, relationVariantValue, type RelationVariant } from '../../../../semantic/relations/relationalSequence';
import type { ResourceExpressionModel, ResourceExpressionBindingRequirement, ResourceAccessMode } from '../../../../types/domain/resourceExpressionModel';
import type { ResourceAstExpressionMappingAuthorityInterface, ResourceAstExpressionMappingInput } from '../../../../types/upstream/resourceAstExpressionMappingInterface';
import type { ResourceArrayEntry, ResourceArrayKey, ResourceMatchArm } from '../../../../types/domain/expressions';
import { resourceBinaryOperatorMapping } from '../../../semantic/resourceBinaryOperatorAuthority';
import * as Upstream from './phpAstExpressionSemanticAuthority';
import * as Closure from './phpAstExpressionClosure';
import * as AssignmentMappings from './phpAstExpressionMappings';

type DomainExpressionModel = Omit<ResourceExpressionModel, 'upstream'>;
type ResourceStaticPropertyOwner = Extract<import('../../../../types/domain/expressions').ResourceClosureAssignmentTarget, { readonly kind: 'static_property' }>['owner'];
const known = (expression: ResourceFieldExpression, type: import('../../../../types/domain/semanticType').SemanticType): DomainExpressionModel => ({ expression, semantic: { kind: 'known', type } });
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

function resolveArguments(args: readonly import('../phpAstTypes').PhpArgument[], sourceFile: string): readonly ResourceExpressionModel[] {
  return Object.freeze(relationProject(args, argument => mapAstValueToExpression(argument.value, sourceFile)));
}

function resolveProperty(receiver: PhpAstValue, name: string, access: PhpAccessMode, sourceFile: string): DomainExpressionModel {
  const target = mapAstValueToExpression(receiver, sourceFile);
  const expression: ResourceFieldExpression = matchPhpAccessMode<ResourceFieldExpression>(access, {
    direct: () => ResourceFieldExpressionFactory.propertyAccess(target.expression, property(name)),
    nullsafe: () => ResourceFieldExpressionFactory.nullsafePropertyAccess(target.expression, property(name)),
  });
  return required(expression, { kind: 'property', receiver: target, property: property(name), access });
}

function resolveMethod(receiver: PhpAstValue, name: string, args: readonly import('../phpAstTypes').PhpArgument[], access: PhpAccessMode, sourceFile: string): DomainExpressionModel {
  const target = mapAstValueToExpression(receiver, sourceFile);
  const arguments_ = resolveArguments(args, sourceFile);
  const expression: ResourceFieldExpression = matchPhpAccessMode<ResourceFieldExpression>(access, {
    direct: () => ResourceFieldExpressionFactory.methodCall(target.expression, method(name), relationProject(arguments_, item => item.expression)),
    nullsafe: () => ResourceFieldExpressionFactory.nullsafeMethodCall(target.expression, method(name), relationProject(arguments_, item => item.expression)),
  });
  return required(expression, { kind: 'method', receiver: target, method: method(name), arguments: arguments_, access });
}

function resolveNested(value: RelationVariant<PhpAstValue, 'nested_array'>, sourceFile: string): DomainExpressionModel {
  const entries = relationProject(value.entries, (entry, index): ResourceArrayEntry => {
    const key = relationGate<ResourceArrayKey>(relationEqual(entry.kind, 'keyed'),
      () => {
        const keyed = relationVariantValue(entry, 'keyed');
        return matchPhpArrayKey<ResourceArrayKey>(keyed.key, {
          string: key => ({ kind: 'string', value: key.value }),
          integer: key => ({ kind: 'integer', value: key.value }),
          expression: key => ({ kind: 'expression', value: mapAstValueToExpression(key.value, sourceFile) }),
        });
      },
      () => ({ kind: 'implicit', index }));
    return Object.freeze({ key, value: mapAstValueToExpression(entry.value, sourceFile) });
  });
  const cardinality = relationGate<'map' | 'sequence'>(relationEvery(entries, entry => relationEqual(entry.key.kind, 'string')), () => 'map', () => 'sequence');
  const expression = ResourceFieldExpressionFactory.array(relationProject(entries, entry => entry.value), cardinality);
  return required(expression, { kind: 'nested_array', entries });
}

const mapAstValueToExpression = (value: PhpAstValue, sourceFile: string): ResourceExpressionModel => {
  const upstream = Upstream.projectPhpAstExpressionToUpstream(value, sourceFile);
  const model = resolveAstValueToDomainExpression(value, sourceFile);
  return { ...model, upstream };
};

/** The semantic owner consumes named syntax evidence and preserves source identity at its boundary. */
export const resourceAstExpressionMappingAuthority: ResourceAstExpressionMappingAuthorityInterface<PhpAstValue> = Object.freeze({
  kind: 'resource_ast_expression_mapping_authority',
  contractVersion: 1,
  map(input: ResourceAstExpressionMappingInput<PhpAstValue>) {
    return mapAstValueToExpression(input.value, input.sourceFile.value.value);
  },
});

function resolveAstValueToDomainExpression(value: PhpAstValue, sourceFile: string): DomainExpressionModel {
  const model = matchPhpAstValue<DomainExpressionModel>(value, {
    interpolatedString: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    callableCall: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    magicConstant: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    constantReference: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    classConstant: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    assignmentExpression: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    dynamicConstruct: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    anonymousClassConstruct: () => rejected(ResourceFieldExpressionFactory.unsupported('unsupported_syntax')),
    resourceCollection: v => known(ResourceFieldExpressionFactory.resource(resource(v.resourceName), { kind: 'collection' }), ReadonlyCollectionType(CollectionKind.ARRAY, ReferenceType.resource('', v.resourceName))),
    resourceSingle: v => known(ResourceFieldExpressionFactory.resource(resource(v.resourceName)), ReferenceType.resource('', v.resourceName)),
    nestedArray: v => resolveNested(v, sourceFile),
    propertyAccess: v => resolveProperty(v.receiver, v.property, v.access, sourceFile),
    methodChain: v => resolveMethod(v.receiver, v.property, v.arguments, v.access, sourceFile),
    variableReference: v => required(ResourceFieldExpressionFactory.variable(variable(v.name)), { kind: 'variable', name: variable(v.name) }),
    staticCall: v => resolveStatic(v, sourceFile),
    arrayAccess: v => resolveArrayAccess(v, sourceFile),
    functionCall: v => resolveFunction(v, sourceFile),
    castExpression: v => resolveCast(v, sourceFile),
    binaryExpression: v => resolveBinary(v, sourceFile),
    ternaryExpression: v => resolveTernary(v, sourceFile),
    shortTernary: v => resolveShortTernary(v, sourceFile),
    nullCoalesce: v => resolveNullCoalesce(v, sourceFile),
    literal: resolveLiteral,
    unaryExpression: v => resolveUnary(v, sourceFile),
    matchExpression: v => resolveMatch(v, sourceFile),
    classReference: v => ({ expression: ResourceFieldExpressionFactory.classReference(className(v.className)), semantic: { kind: 'requires_binding', requirement: { kind: 'class_reference', className: className(v.className) } } }),
    construct: v => resolveConstruct(v, sourceFile),
    instanceOf: v => resolveInstanceOf(v, sourceFile),
    closure: v => resolveClosure(v, sourceFile),
    arrowFunction: v => resolveArrowFunction(v, sourceFile),
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

function resolveArrowFunction(v: RelationVariant<PhpAstValue, 'arrow_function'>, sourceFile: string): DomainExpressionModel {
  const parameters = relationProject(v.parameters, parameter => variable(parameter.variable));
  const body = mapAstValueToExpression(v.body, sourceFile);
  const expression = ResourceFieldExpressionFactory.arrowFunction(parameters, body.expression);
  return required(expression, { kind: 'arrow_function', parameters, body });
}

function resolveClosureStatement(statement: import('../phpAstStatementTypes').PhpStatement, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureStatement {
  return matchPhpStatement<import('../../../../types/domain/expressions').ResourceClosureStatement>(statement, {
    expression_statement: node => ({ kind: 'expression_statement', expression: mapAstValueToExpression(node.expression, sourceFile).expression }),
    return_with_value: node => ({ kind: 'return_with_value', expression: mapAstValueToExpression(node.expression, sourceFile).expression }),
    return_void: () => ({ kind: 'return_void' }),
    assignment: node => { const upstream = Closure.resolveClosureAssignment(node, sourceFile, (value, file) => Upstream.projectPhpAstExpressionToUpstream(value, file)); return { kind: 'assignment', upstream, target: resolveAssignmentTarget(node.target, sourceFile), value: mapAstValueToExpression(node.value, sourceFile).expression, operator: upstream.operator, reference: upstream.reference, source: upstream.source }; },
    if_statement: node => resolveIfStatement(node, sourceFile),
    foreach_statement: node => ({ kind: 'foreach_statement', iterable: mapAstValueToExpression(node.iterable, sourceFile).expression, target: resolveForeachTarget(node.target), body: relationProject(node.body.statements, item => resolveClosureStatement(item, sourceFile)) }),
    while_statement: () => ({ kind: 'unsupported_statement', statementKind: 'while_statement' }),
    switch_statement: () => ({ kind: 'unsupported_statement', statementKind: 'switch_statement' }),
    unset_statement: () => ({ kind: 'unsupported_statement', statementKind: 'unset_statement' }),
    include_statement: () => ({ kind: 'unsupported_statement', statementKind: 'include_statement' }),
    for_statement: node => ({ kind: 'for_statement', initializer: resolveForClause(node.initializer, sourceFile), condition: resolveForClause(node.condition, sourceFile), update: resolveForClause(node.update, sourceFile), body: relationProject(node.body.statements, item => resolveClosureStatement(item, sourceFile)) }),
    try_statement: node => ({ kind: 'try_statement', body: relationProject(node.body.statements, item => resolveClosureStatement(item, sourceFile)), catches: relationProject(node.catches, item => resolveCatch(item, sourceFile)), finallyBlock: resolveFinally(node.finallyBlock, sourceFile) }),
    throw_statement: node => ({ kind: 'throw_statement', expression: mapAstValueToExpression(node.expression, sourceFile).expression })
  });
}

function resolveIfStatement(node: Extract<import('../phpAstStatementTypes').PhpStatement, { readonly kind: 'if_statement' }>, sourceFile: string): Extract<import('../../../../types/domain/expressions').ResourceClosureStatement, { readonly kind: 'if_statement' }> {
  return { kind: 'if_statement', condition: mapAstValueToExpression(node.condition, sourceFile).expression, thenBlock: relationProject(node.thenBlock.statements, item => resolveClosureStatement(item, sourceFile)), alternative: resolveIfAlternative(node.alternative, sourceFile) };
}

function resolveIfAlternative(alternative: import('../phpAstStatementTypes').PhpIfAlternative, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureIfAlternative {
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureIfAlternative>(relationEqual(alternative.kind, 'none'),
    () => ({ kind: 'none' }),
    () => relationGate(relationEqual(alternative.kind, 'else_block'),
      () => { const value = relationVariantValue(alternative, 'else_block'); return { kind: 'else_block', block: relationProject(value.block.statements, item => resolveClosureStatement(item, sourceFile)) }; },
      () => { const value = relationVariantValue(alternative, 'else_if'); return { kind: 'else_if', statement: resolveIfStatement(value.statement, sourceFile) }; }));
}

function resolveAssignmentTarget(target: import('../phpAstStatementTypes').PhpAssignmentTarget, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureAssignmentTarget {
  const canonical = AssignmentMappings['resolveAssignmentTarget'](target, (value, file) => Upstream.projectPhpAstExpressionToUpstream(value, file), sourceFile);
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureAssignmentTarget>(relationEqual(target.kind, 'variable'),
    () => ({ kind: 'variable', name: variable(relationVariantValue(target, 'variable').name) }),
    () => relationGate(relationEqual(target.kind, 'variables'),
      () => ({ kind: 'variables', names: relationProject(relationVariantValue(target, 'variables').names, name => variable(name)) }),
      () => relationGate(relationEqual(target.kind, 'destructuring'),
        () => ({ kind: 'destructuring', pattern: relationVariantValue(canonical, 'destructuring').pattern }),
        () => relationGate(relationEqual(target.kind, 'property'),
          () => { const value = relationVariantValue(target, 'property'); return { kind: 'property', target: mapAstValueToExpression(value.receiver, sourceFile).expression, property: property(value.property) }; },
          () => relationGate(relationEqual(target.kind, 'static_property'),
            () => { const value = relationVariantValue(target, 'static_property'); return { kind: 'static_property', owner: matchPhpStaticPropertyOwner<ResourceStaticPropertyOwner>(value.owner, { named_class: owner => className(owner.name), self: () => ({ kind: 'self' }), static: () => ({ kind: 'static' }), parent: () => ({ kind: 'parent' }) }), property: property(value.property) }; },
            () => relationGate(relationEqual(target.kind, 'array_element'),
              () => { const value = relationVariantValue(target, 'array_element'); return { kind: 'array_element', target: mapAstValueToExpression(value.target, sourceFile).expression, index: mapAstValueToExpression(value.index, sourceFile).expression }; },
              () => { const value = relationVariantValue(target, 'append'); return { kind: 'append', target: mapAstValueToExpression(value.target, sourceFile).expression }; }))))));
}

function resolveForeachTarget(target: import('../phpAstStatementTypes').PhpForeachTarget): import('../../../../types/domain/expressions').ResourceClosureForeachTarget {
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureForeachTarget>(relationEqual(target.kind, 'value'),
    () => { const value = relationVariantValue(target, 'value'); return { kind: 'value', variable: variable(value.variable) }; },
    () => { const value = relationVariantValue(target, 'key_value'); return { kind: 'key_value', key: variable(value.key), value: variable(value.value) }; });
}

function resolveForClause(clause: import('../phpAstStatementTypes').PhpForClause, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureForClause {
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureForClause>(relationEqual(clause.kind, 'empty'),
    () => ({ kind: 'empty' }),
    () => relationGate(relationEqual(clause.kind, 'assignment'),
      () => { const value = relationVariantValue(clause, 'assignment'); const upstream = Closure.resolveClosureForAssignment(value, sourceFile, (expression, file) => Upstream.projectPhpAstExpressionToUpstream(expression, file)); return { kind: 'assignment', upstream, target: resolveAssignmentTarget(value.target, sourceFile), value: mapAstValueToExpression(value.value, sourceFile).expression, operator: upstream.operator, reference: upstream.reference, source: upstream.source }; },
      () => { const value = relationVariantValue(clause, 'expression'); return { kind: 'expression', value: mapAstValueToExpression(value.value, sourceFile).expression }; }));
}

function resolveCatch(clause: import('../phpAstStatementTypes').PhpCatchClause, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureCatchClause {
  return { exceptionType: exceptionName(clause.exceptionType), variable: variable(clause.variable), body: relationProject(clause.body.statements, item => resolveClosureStatement(item, sourceFile)) };
}

function resolveFinally(clause: import('../phpAstStatementTypes').PhpFinallyClause, sourceFile: string): import('../../../../types/domain/expressions').ResourceClosureFinallyClause {
  return relationGate<import('../../../../types/domain/expressions').ResourceClosureFinallyClause>(relationEqual(clause.kind, 'absent'),
    () => ({ kind: 'absent' }),
    () => { const value = relationVariantValue(clause, 'present'); return { kind: 'present', block: relationProject(value.block.statements, item => resolveClosureStatement(item, sourceFile)) }; });
}

function resolveUnary(v: RelationVariant<PhpAstValue, 'unary_expression'>, sourceFile: string): DomainExpressionModel {
  const operand = mapAstValueToExpression(v.operand, sourceFile);
  const operator = { kind: v.operator.kind } as import('../../../../types/domain/expressions').ResourceUnaryOperator;
  return { expression: ResourceFieldExpressionFactory.unary(operator, operand.expression), semantic: { kind: 'requires_binding', requirement: { kind: 'unary', operator, operand } } };
}
function resolveMatch(v: RelationVariant<PhpAstValue, 'match_expression'>, sourceFile: string): DomainExpressionModel {
  const subject = mapAstValueToExpression(v.subject, sourceFile);
  const arms: readonly ResourceMatchArm[] = relationProject(v.arms, arm => matchPhpMatchArm<ResourceMatchArm>(arm, {
    conditional: node => ({ kind: 'conditional', conditions: relationProject(node.conditions, item => mapAstValueToExpression(item, sourceFile).expression), value: mapAstValueToExpression(node.value, sourceFile).expression }),
    default: node => ({ kind: 'default', value: mapAstValueToExpression(node.value, sourceFile).expression })
  }));
  return { expression: ResourceFieldExpressionFactory.match(subject.expression, arms), semantic: { kind: 'requires_binding', requirement: { kind: 'match', subject, arms } } };
}
function resolveConstruct(v: RelationVariant<PhpAstValue, 'construct'>, sourceFile: string): DomainExpressionModel {
  const arguments_ = resolveArguments(v.arguments, sourceFile); const classReference = className(v.className);
  return { expression: ResourceFieldExpressionFactory.construct(classReference, relationProject(arguments_, item => item.expression)), semantic: { kind: 'requires_binding', requirement: { kind: 'construct', className: className(v.className), arguments: arguments_ } } };
}
function resolveInstanceOf(v: RelationVariant<PhpAstValue, 'instance_of'>, sourceFile: string): DomainExpressionModel {
  const expression = mapAstValueToExpression(v.expression, sourceFile); const classReference = className(v.className);
  return { expression: ResourceFieldExpressionFactory.instanceOf(expression.expression, classReference), semantic: { kind: 'requires_binding', requirement: { kind: 'instance_of', expression, className: className(v.className) } } };
}

function resolveStatic(v: RelationVariant<PhpAstValue, 'static_call'>, sourceFile: string): DomainExpressionModel {
  const arguments_ = resolveArguments(v.arguments, sourceFile); const className = model(v.classReference.sourceName); const methodName = method(v.method);
  return required(ResourceFieldExpressionFactory.staticMethodCall(className, methodName, relationProject(arguments_, item => item.expression)), { kind: 'static_method', model: className, method: methodName, arguments: arguments_ });
}
function resolveArrayAccess(v: RelationVariant<PhpAstValue, 'array_access'>, sourceFile: string): DomainExpressionModel {
  const target = mapAstValueToExpression(v.target, sourceFile); const index = mapAstValueToExpression(v.index, sourceFile);
  return required(ResourceFieldExpressionFactory.arrayAccess(target.expression, index.expression), { kind: 'array_access', target, index });
}
function resolveFunction(v: RelationVariant<PhpAstValue, 'function_call'>, sourceFile: string): DomainExpressionModel {
  const arguments_ = resolveArguments(v.arguments, sourceFile); const name = SemanticValueFactory.phpFunctionName(v.functionName);
  return required(ResourceFieldExpressionFactory.functionCall(name, relationProject(arguments_, item => item.expression)), { kind: 'function_call', functionName: name, arguments: arguments_ });
}
function resolveCast(v: RelationVariant<PhpAstValue, 'cast_expression'>, sourceFile: string): DomainExpressionModel {
  const operand = mapAstValueToExpression(v.operand, sourceFile); const type = SemanticValueFactory.castTypeName(v.castType.kind);
  return required(ResourceFieldExpressionFactory.typeCast(type, operand.expression), { kind: 'cast', type, operand });
}
function resolveBinary(v: RelationVariant<PhpAstValue, 'binary_expression'>, sourceFile: string): DomainExpressionModel {
  const left = mapAstValueToExpression(v.left, sourceFile); const right = mapAstValueToExpression(v.right, sourceFile); const operator = SemanticValueFactory.semanticOperator(resourceBinaryOperatorMapping.map(v.operator.kind));
  return required(ResourceFieldExpressionFactory.binary(operator, left.expression, right.expression), { kind: 'computation', operator, left, right });
}
function resolveTernary(v: RelationVariant<PhpAstValue, 'ternary_expression'>, sourceFile: string): DomainExpressionModel {
  const condition = mapAstValueToExpression(v.condition, sourceFile); const truthy = mapAstValueToExpression(v.trueBranch, sourceFile); const falsy = mapAstValueToExpression(v.falseBranch, sourceFile);
  return required(ResourceFieldExpressionFactory.ternary(condition.expression, truthy.expression, falsy.expression), { kind: 'conditional', condition, branches: { kind: 'then_else', whenTrue: truthy, whenFalse: falsy } });
}
function resolveShortTernary(v: RelationVariant<PhpAstValue, 'short_ternary'>, sourceFile: string): DomainExpressionModel {
  const condition = mapAstValueToExpression(v.condition, sourceFile); const falsy = mapAstValueToExpression(v.falseBranch, sourceFile);
  return required(ResourceFieldExpressionFactory.shortTernary(condition.expression, falsy.expression), { kind: 'short_conditional', condition, whenFalse: falsy });
}
function resolveNullCoalesce(v: RelationVariant<PhpAstValue, 'null_coalesce'>, sourceFile: string): DomainExpressionModel {
  const left = mapAstValueToExpression(v.left, sourceFile); const right = mapAstValueToExpression(v.right, sourceFile);
  return required(ResourceFieldExpressionFactory.nullCoalesce(left.expression, right.expression), { kind: 'null_coalesce', left, right });
}
function resolveLiteral(v: RelationVariant<PhpAstValue, 'literal'>): DomainExpressionModel {
  const literal: import('../phpAstExpressionTypes').PhpLiteralValue = v;
  const numberLiteral = relationFirstOption([literal], (value): value is Extract<import('../phpAstExpressionTypes').PhpLiteralValue, { readonly literalType: 'number' }> => relationEqual(value.literalType, 'number'));
  return relationOptionFold(numberLiteral,
    () => {
      const booleanLiteral = relationFirstOption([literal], (value): value is Extract<import('../phpAstExpressionTypes').PhpLiteralValue, { readonly literalType: 'boolean' }> => relationEqual(value.literalType, 'boolean'));
      return relationOptionFold(booleanLiteral,
        () => {
          const stringLiteral = relationFirstOption([literal], (value): value is Extract<import('../phpAstExpressionTypes').PhpLiteralValue, { readonly literalType: 'string' }> => relationEqual(value.literalType, 'string'));
          return relationOptionFold(stringLiteral,
            () => rejected(ResourceFieldExpressionFactory.literal(resourceNullLiteralValue())),
            value => known(ResourceFieldExpressionFactory.literal({ kind: 'string', value: value.value }), primitiveType(PrimitiveKind.STRING)));
        },
        value => known(ResourceFieldExpressionFactory.literal({ kind: 'boolean', value: value.value }), primitiveType(PrimitiveKind.BOOLEAN)));
    },
    value => known(ResourceFieldExpressionFactory.literal({ kind: 'number', value: value.value }), primitiveType(PrimitiveKind.NUMBER)));
}

