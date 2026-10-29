import type { Expression, ArrayEntry, ReferenceCardinality, CastType, BinaryOperator, UnaryOperator, ExpressionArgument } from '../../../../types/upstream/expression';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { PhpAccessMode, PhpArgument, PhpArrayEntry, PhpArrayKey, PhpAstValue, PhpLiteralValue, PhpPropertyPath } from '../phpAstExpressionTypes';
const str = (value: string): import('../../../../types/upstream/valueObjects').StringValue => ({ kind: 'string_value', value });
import { sourceFileIdentityFactory, stringValue } from '../../../../types/upstream/names';
import type { ClassName, FunctionName, MethodName, PropertyName, ResourceName, VariableName } from '../../../../types/upstream/names';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import { phpParameterTypeAlgebra, type PhpParameterTypeEvidence } from '../../../../types/upstream/phpParameterTypeAlgebra';
import type { AssignmentTarget, AssignmentOperator, AssignmentReferenceMode } from '../../../../types/upstream/assignment';
import {
  resolveResourceStaticReceiverThroughAuthority,
  resolveResourceStaticActionThroughAuthority,
} from '../../../../types/upstream/resourceSemanticMappingAuthority';

export type UpstreamExpressionMapper = (value: PhpAstValue, file: string) => Expression;

export interface PhpAstExpressionMappingOperationsInterface {
  readonly resolveArguments: (arguments_: readonly PhpArgument[], resolveExpression: UpstreamExpressionMapper, file: string) => readonly ExpressionArgument[];
  readonly resolveLiteral: (value: PhpLiteralValue, source: SourceSpan) => Expression;
  readonly memberExpression: (receiver: PhpAstValue, target: PhpPropertyPath, name: string, access: PhpAccessMode, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan) => Expression;
  readonly methodExpression: (receiver: PhpAstValue, target: PhpPropertyPath, name: string, args: readonly PhpArgument[], access: PhpAccessMode, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan) => Expression;
  readonly propertyPath: (path: PhpPropertyPath) => import('../../../../types/upstream/collections').PropertyPath;
  readonly resolveBinaryOperator: (kind: import('../phpAstExpressionTypes').PhpBinaryOperator['kind']) => BinaryOperator;
  readonly resolveUnaryOperator: (kind: import('../phpAstExpressionTypes').PhpUnaryOperator['kind']) => UnaryOperator;
  readonly resolveCastType: (kind: import('../phpAstExpressionTypes').PhpCastType['kind']) => CastType;
  readonly resolveArrayEntry: (entry: PhpArrayEntry, index: number, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan) => ArrayEntry;
  readonly resolveArrayKey: (key: PhpArrayKey, resolveExpression: UpstreamExpressionMapper, file: string, entrySource: SourceSpan) => Expression;
  readonly resolveAssignmentOperator: (kind: import('../phpAstStatementTypes').PhpAssignmentOperator['kind']) => AssignmentOperator;
  readonly assignmentReferenceMode: (kind: import('../phpAstStatementTypes').PhpAssignmentReference['kind']) => AssignmentReferenceMode;
  readonly resolveAssignmentTarget: (target: import('../phpAstStatementTypes').PhpAssignmentTarget, resolveExpression: UpstreamExpressionMapper, file: string) => AssignmentTarget;
  readonly resolveClosureParameter: (parameter: import('../phpAstExpressionTypes').PhpParameter, resolveExpression: UpstreamExpressionMapper, file: string, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext) => import('../../../../types/upstream/expression').ClosureParameter;
  readonly resolveParameterType: (type: import('../phpMethodAstTypes').PhpParameterTypeAst, resolveExpression?: UpstreamExpressionMapper, file?: string, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext) => TypeExpression;
}


export const sourceSpan = (file: string, position = 0): SourceSpan => ({ kind: 'source_span', file: sourceFileIdentityFactory.create(stringValue.create(file)), start: { kind: 'number_value', value: position }, end: { kind: 'number_value', value: position } });
export const sourceSpanFromRange = (file: import('../../../../types/upstream/names').SourceFile, range: import('../phpAstCoreTypes').SourceRange): SourceSpan => ({ kind: 'source_span', file, start: { kind: 'number_value', value: range.startOffset }, end: { kind: 'number_value', value: range.endOffset } });
export const variable = (value: string): VariableName => ({ kind: 'variable_name', value: str(value) });
export const property = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
export const method = (value: string): MethodName => ({ kind: 'method_name', value: str(value) });
export const functionName = (value: string): FunctionName => ({ kind: 'function_name', value: str(value) });
export const className = (value: string): ClassName => ({ kind: 'class_name', value: str(value) });
export const resource = (value: string): ResourceName => ({ kind: 'resource_name', value: str(value) });
export const sequence = <T>(items: readonly T[], index = 0): import('../../../../types/upstream/collections').Sequence<T> => index < items.length
  ? { kind: 'cons', head: items[index], tail: sequence(items, index + 1) }
  : { kind: 'empty' };
export const cardinality = (kind: ReferenceCardinality): ReferenceCardinality => kind;
export const expressions = (items: readonly Expression[]) => ({ kind: 'expressions' as const, items: sequence(items) });
export const expressionArguments = (items: readonly ExpressionArgument[]) => ({ kind: 'expression_arguments' as const, items: sequence(items) });

/** The scanner delegates completed static receiver semantics to the upstream authority. */
export const resolveStaticReceiver = resolveResourceStaticReceiverThroughAuthority;

/** The scanner delegates completed static action semantics to the upstream authority. */
export const resolveStaticAction = resolveResourceStaticActionThroughAuthority;

function resolveArguments(arguments_: readonly PhpArgument[], resolveExpression: UpstreamExpressionMapper, file: string): readonly ExpressionArgument[] {
  return arguments_.map(argument => {
    switch (argument.kind) {
      case 'positional': return { kind: 'positional', value: resolveExpression(argument.value, file) };
      case 'named': return { kind: 'named', name: { kind: 'expression_argument_name', value: str(argument.name) }, value: resolveExpression(argument.value, file) };
      case 'unpacked': return { kind: 'unpacked', value: resolveExpression(argument.value, file) };
    }
  });
}


function resolveLiteral(value: PhpLiteralValue, source: SourceSpan): Expression {
  switch (value.literalType) {
    case 'string': return { kind: 'literal', value: { kind: 'string_literal', value: str(value.value) }, source };
    case 'number': return { kind: 'literal', value: { kind: 'number_literal', value: { kind: 'number_value', value: value.value } }, source };
    case 'boolean': return { kind: 'literal', value: { kind: 'boolean_literal', value: { kind: 'truth_value', value: value.value } }, source };
    case 'null': return { kind: 'literal', value: { kind: 'null_literal' }, source };
  }
}


function memberExpression(receiver: PhpAstValue, target: PhpPropertyPath, name: string, access: PhpAccessMode, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): Expression {
  const expression = resolveExpression(receiver, file);
  const path = propertyPath(target);
  switch (access.kind) {
    case 'direct': return { kind: 'property', receiver: expression, property: property(name), path, source };
    case 'nullsafe': return { kind: 'nullsafe_property', receiver: expression, property: property(name), path, source };
  }
}

function methodExpression(receiver: PhpAstValue, target: PhpPropertyPath, name: string, args: readonly PhpArgument[], access: PhpAccessMode, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): Expression {
  const expression = resolveExpression(receiver, file);
  const path = propertyPath(target);
  const arguments_ = expressionArguments(resolveArguments(args, resolveExpression, file));
  switch (access.kind) {
    case 'direct': return { kind: 'method', receiver: expression, operation: { kind: 'domain', name: method(name) }, arguments: arguments_, path, source };
    case 'nullsafe': return { kind: 'nullsafe_method', receiver: expression, operation: { kind: 'domain', name: method(name) }, arguments: arguments_, path, source };
  }
}

function propertyPath(path: PhpPropertyPath): import('../../../../types/upstream/collections').PropertyPath {
  return { kind: 'property_path', segments: sequence([path.root, ...path.steps].map(step => property(step))) };
}

const binaryOperatorConstructors: readonly (readonly [string, () => BinaryOperator])[] = Object.freeze([
  ['binary_identical', () => ({ kind: 'strict_equal' })], ['binary_equal', () => ({ kind: 'equal' })],
  ['binary_not_identical', () => ({ kind: 'strict_not_equal' })], ['binary_not_equal', () => ({ kind: 'not_equal' })],
  ['binary_greater_than', () => ({ kind: 'greater' })], ['binary_greater_or_equal', () => ({ kind: 'greater_equal' })],
  ['binary_less_than', () => ({ kind: 'less' })], ['binary_less_or_equal', () => ({ kind: 'less_equal' })],
  ['binary_addition', () => ({ kind: 'add' })], ['binary_subtraction', () => ({ kind: 'subtract' })],
  ['binary_multiplication', () => ({ kind: 'multiply' })], ['binary_division', () => ({ kind: 'divide' })],
  ['binary_modulo', () => ({ kind: 'modulo' })], ['binary_logical_and', () => ({ kind: 'and' })],
  ['binary_logical_or', () => ({ kind: 'or' })], ['binary_bitwise_or', () => ({ kind: 'bitwise_or' })],
  ['binary_concat', () => ({ kind: 'concat' })],
]);
const unaryOperatorConstructors: readonly (readonly [string, () => UnaryOperator])[] = Object.freeze([
  ['unary_negative', () => ({ kind: 'negate' })], ['unary_positive', () => ({ kind: 'positive' })],
  ['unary_bitwise_not', () => ({ kind: 'bitwise_not' })], ['unary_not', () => ({ kind: 'not' })],
]);
const castTypeConstructors: readonly (readonly [string, () => CastType])[] = Object.freeze([
  ['cast_int', () => ({ kind: 'integer' })], ['cast_float', () => ({ kind: 'float' })],
  ['cast_string', () => ({ kind: 'string' })], ['cast_bool', () => ({ kind: 'boolean' })],
  ['cast_array', () => ({ kind: 'array' })], ['cast_object', () => ({ kind: 'json' })],
]);

const construct = <T>(table: readonly (readonly [string, () => T])[], key: string): T => {
  const entry = table.find(([candidate]) => candidate === key);
  if (entry === undefined) throw Error(`No declarative constructor for ${key}`);
  return entry[1]();
};

function resolveBinaryOperator(kind: import('../phpAstExpressionTypes').PhpBinaryOperator['kind']): BinaryOperator {
  return construct(binaryOperatorConstructors, `binary_${kind}`);
}

function resolveUnaryOperator(kind: import('../phpAstExpressionTypes').PhpUnaryOperator['kind']): UnaryOperator {
  return construct(unaryOperatorConstructors, `unary_${kind}`);
}

function resolveCastType(kind: import('../phpAstExpressionTypes').PhpCastType['kind']): CastType {
  return construct(castTypeConstructors, `cast_${kind}`);
}

function resolveArrayEntry(entry: PhpArrayEntry, index: number, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): ArrayEntry {
  switch (entry.kind) {
    case 'positional': return { kind: 'implicit', index: { kind: 'number_value', value: index }, value: resolveExpression(entry.value, file), source };
    case 'keyed': return { kind: 'keyed', key: resolveArrayKey(entry.key, resolveExpression, file, source), value: resolveExpression(entry.value, file), source };
    case 'unpacked': return { kind: 'unpacked', value: resolveExpression(entry.value, file), source };
  }
}

function resolveArrayKey(key: PhpArrayKey, resolveExpression: UpstreamExpressionMapper, file: string, entrySource: SourceSpan): Expression {
  switch (key.kind) {
    case 'string': return { kind: 'literal', value: { kind: 'string_literal', value: str(key.value) }, source: entrySource };
    case 'integer': return { kind: 'literal', value: { kind: 'number_literal', value: { kind: 'number_value', value: key.value } }, source: entrySource };
    case 'expression': return resolveExpression(key.value, file);
  }
}


const assignmentOperatorConstructors: readonly (readonly [string, () => AssignmentOperator])[] = Object.freeze([
  ['assignment_set', () => ({ kind: 'set' })], ['assignment_add', () => ({ kind: 'add' })],
  ['assignment_subtract', () => ({ kind: 'subtract' })], ['assignment_multiply', () => ({ kind: 'multiply' })],
  ['assignment_divide', () => ({ kind: 'divide' })], ['assignment_modulo', () => ({ kind: 'modulo' })],
  ['assignment_concatenate', () => ({ kind: 'concatenate' })], ['assignment_null_coalesce', () => ({ kind: 'null_coalesce' })],
  ['assignment_power', () => ({ kind: 'power' })], ['assignment_bitwise_and', () => ({ kind: 'bitwise_and' })],
  ['assignment_bitwise_or', () => ({ kind: 'bitwise_or' })], ['assignment_bitwise_xor', () => ({ kind: 'bitwise_xor' })],
  ['assignment_shift_left', () => ({ kind: 'shift_left' })], ['assignment_shift_right', () => ({ kind: 'shift_right' })],
]);
const assignmentReferenceConstructors: readonly (readonly [string, () => AssignmentReferenceMode])[] = Object.freeze([
  ['reference_by_value', () => ({ kind: 'by_value' })], ['reference_by_reference', () => ({ kind: 'by_reference' })],
]);

function resolveAssignmentOperator(kind: import('../phpAstStatementTypes').PhpAssignmentOperator['kind']): AssignmentOperator {
  return construct(assignmentOperatorConstructors, `assignment_${kind}`);
}

function assignmentReferenceMode(kind: import('../phpAstStatementTypes').PhpAssignmentReference['kind']): AssignmentReferenceMode {
  return construct(assignmentReferenceConstructors, `reference_${kind}`);
}
function resolveAssignmentTarget(target: import('../phpAstStatementTypes').PhpAssignmentTarget, resolveExpression: UpstreamExpressionMapper, file: string): AssignmentTarget {
  switch (target.kind) {
    case 'variable': return { kind: 'variable', name: variable(target.name) };
    case 'variables': return { kind: 'variables', names: { kind: 'variable_names', items: target.names.map(name => variable(name)) } };
    case 'destructuring': return { kind: 'destructuring', pattern: resolveDestructuringPattern(target.pattern, resolveExpression, file) };
    case 'property': return { kind: 'property', receiver: resolveExpression(target.receiver, file), name: property(target.property) };
    case 'static_property': return { kind: 'static_property', owner: resolveStaticPropertyOwner(target.owner), name: property(target.property) };
    case 'array_element': return { kind: 'index', receiver: resolveExpression(target.target, file), key: resolveExpression(target.index, file) };
    case 'append': return { kind: 'append', receiver: resolveExpression(target.target, file) };
  }
}

function resolveDestructuringPattern(pattern: import('../phpAstStatementTypes').PhpAssignmentDestructuringPattern, resolveExpression: UpstreamExpressionMapper, file: string): import('../../../../types/upstream/assignment').AssignmentDestructuringPattern {
  return { kind: 'list', entries: sequence(pattern.entries.map(entry => resolveDestructuringEntry(entry, resolveExpression, file))) };
}

function resolveDestructuringEntry(entry: import('../phpAstStatementTypes').PhpAssignmentDestructuringEntry, resolveExpression: UpstreamExpressionMapper, file: string): import('../../../../types/upstream/assignment').AssignmentDestructuringEntry {
  switch (entry.kind) {
    case 'variable': return { kind: 'variable', name: variable(entry.name) };
    case 'reference_variable': return { kind: 'reference_variable', name: variable(entry.name) };
    case 'keyed': return { kind: 'keyed', key: resolveExpression(entry.key, file), target: resolveDestructuringEntry(entry.target, resolveExpression, file) };
    case 'nested': return { kind: 'nested', pattern: resolveDestructuringPattern(entry.pattern, resolveExpression, file) };
    case 'skipped': return { kind: 'skipped' };
  }
}

function resolveStaticPropertyOwner(owner: import('../phpAstStatementTypes').PhpStaticPropertyOwner): import('../../../../types/upstream/assignment').StaticPropertyOwner {
  switch (owner.kind) {
    case 'named_class': return { kind: 'named_class', name: className(owner.name) };
    case 'self': return { kind: 'self' };
    case 'static': return { kind: 'static' };
    case 'parent': return { kind: 'parent' };
  }
}

function resolveClosureParameter(parameter: import('../phpAstExpressionTypes').PhpParameter, resolveExpression: UpstreamExpressionMapper, file: string, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext): import('../../../../types/upstream/expression').ClosureParameter {
  const type = parameter.type.kind === 'absent'
    ? { kind: 'absent' as const }
    : { kind: 'present' as const, value: resolveParameterType(parameter.type, resolveExpression, file, classContext) };
  const defaultValue = parameter.defaultValue.kind === 'absent'
    ? { kind: 'absent' as const }
    : { kind: 'present' as const, value: resolveExpression(parameter.defaultValue.value, file) };
  return { kind: 'closure_parameter', name: variable(parameter.variable), type, passing: { kind: parameter.passing.kind }, variadic: { kind: parameter.variadic.kind }, defaultValue };
}

function resolveParameterType(type: import('../phpMethodAstTypes').PhpParameterTypeAst, _resolveExpression?: UpstreamExpressionMapper, _file?: string, classContext?: import('../../../../types/upstream/phpTypeAtomInterface').PhpTypeClassContext): TypeExpression {
  const toEvidence = (value: import('../phpMethodAstTypes').PhpParameterTypeAst): PhpParameterTypeEvidence => {
    switch (value.kind) {
      case 'primitive': return { kind: 'primitive', name: value.name, classContext };
      case 'named': return { kind: 'named', name: value.name, classContext };
      case 'nullable': return { kind: 'nullable', inner: toEvidence(value.inner), classContext };
    }
  };
  const judgment = phpParameterTypeAlgebra.resolve(toEvidence(type));
  return judgment.kind === 'resolved'
    ? judgment.expression
    : { kind: 'error', diagnostic: str(judgment.diagnostic) };
}



export const constantName = (value: string): import('../../../../types/upstream/names').ConstantName => Object.freeze({ kind: 'constant_name', value: str(value) });


/** Explicit interface-first operations for translating PHP AST evidence into upstream ADTs. */
export const phpAstExpressionMappingOperations: PhpAstExpressionMappingOperationsInterface = Object.freeze({
  resolveArguments,
  resolveLiteral,
  memberExpression,
  methodExpression,
  propertyPath,
  resolveBinaryOperator,
  resolveUnaryOperator,
  resolveCastType,
  resolveArrayEntry,
  resolveArrayKey,
  resolveAssignmentOperator,
  assignmentReferenceMode,
  resolveAssignmentTarget,
  resolveClosureParameter,
  resolveParameterType,
});
