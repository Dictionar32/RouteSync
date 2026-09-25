import type { Expression, ArrayEntry, ReferenceCardinality, CastType, BinaryOperator, UnaryOperator, StaticReceiver, StaticMethodAction, ExpressionArgument } from '../../../../types/upstream/expression';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { PhpAccessMode, PhpArgument, PhpArrayEntry, PhpArrayKey, PhpAstValue, PhpPropertyPath } from '../../lexer/phpAstExpressionTypes';
const str = (value: string): import('../../../../types/upstream/valueObjects').StringValue => ({ kind: 'string_value', value });
import { createSourceFile } from '../../../../types/upstream/names';
import type { ClassName, FunctionName, MethodName, PropertyName, ResourceName, VariableName } from '../../../../types/upstream/names';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { AssignmentTarget, AssignmentOperator, AssignmentReferenceMode } from '../../../../types/upstream/assignment';

export type UpstreamExpressionMapper = (value: PhpAstValue, file: string) => Expression;
export const sourceSpan = (file: string, position = 0): SourceSpan => ({ kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: position }, end: { kind: 'number_value', value: position } });
export const sourceSpanFromRange = (file: import('../../../../types/upstream/names').SourceFile, range: import('../../lexer/phpAstCoreTypes').SourceRange): SourceSpan => ({ kind: 'source_span', file, start: { kind: 'number_value', value: range.startOffset }, end: { kind: 'number_value', value: range.endOffset } });
export const variable = (value: string): VariableName => ({ kind: 'variable_name', value: str(value) });
export const property = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
export const method = (value: string): MethodName => ({ kind: 'method_name', value: str(value) });
export const functionName = (value: string): FunctionName => ({ kind: 'function_name', value: str(value) });
export const className = (value: string): ClassName => ({ kind: 'class_name', value: str(value) });
export const resource = (value: string): ResourceName => ({ kind: 'resource_name', value: str(value) });
export const sequence = <T>(items: readonly T[]): import('../../../../types/upstream/collections').Sequence<T> => items.reduceRight<import('../../../../types/upstream/collections').Sequence<T>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });
export const cardinality = (kind: 'single' | 'collection'): ReferenceCardinality => ({ kind });
export const expressions = (items: readonly Expression[]) => ({ kind: 'expressions' as const, items: sequence(items) });
export const expressionArguments = (items: readonly ExpressionArgument[]) => ({ kind: 'expression_arguments' as const, items: sequence(items) });

export function mapStaticReceiver(classNameValue: string): StaticReceiver {
  if (classNameValue === 'DB') return { kind: 'framework', receiver: { kind: 'database', name: className(classNameValue) } };
  if (classNameValue === 'Attribute') return { kind: 'framework', receiver: { kind: 'attribute', name: className(classNameValue) } };
  return { kind: 'class', name: className(classNameValue) };
}

export function mapStaticAction(classNameValue: string, methodNameValue: string): StaticMethodAction {
  if (classNameValue === 'DB' && methodNameValue === 'raw') return { kind: 'database_raw' };
  return { kind: 'domain', name: method(methodNameValue) };
}

export function mapArguments(arguments_: readonly PhpArgument[], mapExpression: UpstreamExpressionMapper, file: string): readonly ExpressionArgument[] {
  return arguments_.map(argument => {
    switch (argument.kind) {
      case 'positional': return { kind: 'positional', value: mapExpression(argument.value, file) };
      case 'named': return { kind: 'named', name: { kind: 'expression_argument_name', value: str(argument.name) }, value: mapExpression(argument.value, file) };
      case 'unpacked': return { kind: 'unpacked', value: mapExpression(argument.value, file) };
    }
  });
}


export function mapLiteral(kind: 'string' | 'number' | 'boolean' | 'null', value: string | number | boolean | null, source: SourceSpan): Expression {
  switch (kind) {
    case 'string': return { kind: 'literal', value: { kind: 'string_literal', value: str(value as string) }, source };
    case 'number': return { kind: 'literal', value: { kind: 'number_literal', value: { kind: 'number_value', value: value as number } }, source };
    case 'boolean': return { kind: 'literal', value: { kind: 'boolean_literal', value: { kind: 'truth_value', value: value as boolean } }, source };
    case 'null': return { kind: 'literal', value: { kind: 'null_literal' }, source };
  }
}

export function memberExpression(receiver: PhpAstValue, target: PhpPropertyPath, name: string, access: PhpAccessMode, mapExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): Expression {
  const expression = mapExpression(receiver, file);
  const path = propertyPath(target);
  if (access.kind === 'direct') return { kind: 'property', receiver: expression, property: property(name), path, source };
  return { kind: 'nullsafe_property', receiver: expression, property: property(name), path, source };
}

export function methodExpression(receiver: PhpAstValue, target: PhpPropertyPath, name: string, args: readonly PhpArgument[], access: PhpAccessMode, mapExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): Expression {
  const expression = mapExpression(receiver, file);
  const path = propertyPath(target);
  const arguments_ = expressionArguments(mapArguments(args, mapExpression, file));
  if (access.kind === 'direct') return { kind: 'method', receiver: expression, operation: { kind: 'domain', name: method(name) }, arguments: arguments_, path, source };
  return { kind: 'nullsafe_method', receiver: expression, operation: { kind: 'domain', name: method(name) }, arguments: arguments_, path, source };
}

export function propertyPath(path: PhpPropertyPath): import('../../../../types/upstream/collections').PropertyPath {
  return { kind: 'property_path', segments: sequence([path.root, ...path.steps].map(step => property(step))) };
}

export function mapBinaryOperator(kind: import('../../lexer/phpAstExpressionTypes').PhpBinaryOperator['kind']): BinaryOperator {
  switch (kind) {
    case 'identical': return { kind: 'strict_equal' }; case 'equal': return { kind: 'equal' }; case 'not_identical': return { kind: 'strict_not_equal' }; case 'not_equal': return { kind: 'not_equal' };
    case 'greater_than': return { kind: 'greater' }; case 'greater_or_equal': return { kind: 'greater_equal' }; case 'less_than': return { kind: 'less' }; case 'less_or_equal': return { kind: 'less_equal' };
    case 'addition': return { kind: 'add' }; case 'subtraction': return { kind: 'subtract' }; case 'multiplication': return { kind: 'multiply' }; case 'division': return { kind: 'divide' }; case 'modulo': return { kind: 'modulo' };
    case 'logical_and': return { kind: 'and' }; case 'logical_or': return { kind: 'or' }; case 'bitwise_or': return { kind: 'bitwise_or' }; case 'concat': return { kind: 'concat' };
  }
}

export function mapUnaryOperator(kind: import('../../lexer/phpAstExpressionTypes').PhpUnaryOperator['kind']): UnaryOperator {
  switch (kind) { case 'negative': return { kind: 'negate' }; case 'positive': return { kind: 'positive' }; case 'bitwise_not': return { kind: 'bitwise_not' }; case 'not': return { kind: 'not' }; }
}

export function mapCastType(kind: import('../../lexer/phpAstExpressionTypes').PhpCastType['kind']): CastType {
  switch (kind) { case 'int': return { kind: 'integer' }; case 'float': return { kind: 'float' }; case 'string': return { kind: 'string' }; case 'bool': return { kind: 'boolean' }; case 'array': return { kind: 'array' }; case 'object': return { kind: 'json' }; }
}

export function mapArrayEntry(entry: PhpArrayEntry, index: number, mapExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): ArrayEntry {
  switch (entry.kind) {
    case 'positional': return { kind: 'implicit', index: { kind: 'number_value', value: index }, value: mapExpression(entry.value, file), source };
    case 'keyed': return { kind: 'keyed', key: mapArrayKey(entry.key, mapExpression, file, source), value: mapExpression(entry.value, file), source };
    case 'unpacked': return { kind: 'unpacked', value: mapExpression(entry.value, file), source };
  }
}

export function mapArrayKey(key: PhpArrayKey, mapExpression: UpstreamExpressionMapper, file: string, entrySource: SourceSpan): Expression {
  switch (key.kind) { case 'string': return { kind: 'literal', value: { kind: 'string_literal', value: str(key.value) }, source: entrySource }; case 'integer': return { kind: 'literal', value: { kind: 'number_literal', value: { kind: 'number_value', value: key.value } }, source: entrySource }; case 'expression': return mapExpression(key.value, file); }
}


export function mapAssignmentOperator(kind: import('../../lexer/phpAstStatementTypes').PhpAssignmentOperator['kind']): AssignmentOperator {
  switch (kind) {
    case 'set': return { kind: 'set' };
    case 'add': return { kind: 'add' };
    case 'subtract': return { kind: 'subtract' };
    case 'multiply': return { kind: 'multiply' };
    case 'divide': return { kind: 'divide' };
    case 'modulo': return { kind: 'modulo' };
    case 'concatenate': return { kind: 'concatenate' };
    case 'null_coalesce': return { kind: 'null_coalesce' };
    case 'power': return { kind: 'power' };
    case 'bitwise_and': return { kind: 'bitwise_and' };
    case 'bitwise_or': return { kind: 'bitwise_or' };
    case 'bitwise_xor': return { kind: 'bitwise_xor' };
    case 'shift_left': return { kind: 'shift_left' };
    case 'shift_right': return { kind: 'shift_right' };
  }
}

export function assignmentReferenceMode(kind: import('../../lexer/phpAstStatementTypes').PhpAssignmentReference['kind']): AssignmentReferenceMode {
  switch (kind) {
    case 'by_value': return { kind: 'by_value' };
    case 'by_reference': return { kind: 'by_reference' };
  }
}
export function mapAssignmentTarget(target: import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, mapExpression: UpstreamExpressionMapper, file: string): AssignmentTarget {
  switch (target.kind) {
    case 'variable': return { kind: 'variable', name: variable(target.name) };
    case 'variables': return { kind: 'variables', names: { kind: 'variable_names', items: target.names.map(name => variable(name)) } };
    case 'destructuring': return { kind: 'destructuring', pattern: mapDestructuringPattern(target.pattern, mapExpression, file) };
    case 'property': return { kind: 'property', receiver: mapExpression(target.receiver, file), name: property(target.property) };
    case 'static_property': return { kind: 'static_property', owner: mapStaticPropertyOwner(target.owner), name: property(target.property) };
    case 'array_element': return { kind: 'index', receiver: mapExpression(target.target, file), key: mapExpression(target.index, file) };
    case 'append': return { kind: 'append', receiver: mapExpression(target.target, file) };
  }
}

function mapDestructuringPattern(pattern: import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringPattern, mapExpression: UpstreamExpressionMapper, file: string): import('../../../../types/upstream/assignment').AssignmentDestructuringPattern {
  return { kind: 'list', entries: sequence(pattern.entries.map(entry => mapDestructuringEntry(entry, mapExpression, file))) };
}

function mapDestructuringEntry(entry: import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry, mapExpression: UpstreamExpressionMapper, file: string): import('../../../../types/upstream/assignment').AssignmentDestructuringEntry {
  switch (entry.kind) {
    case 'variable': return { kind: 'variable', name: variable(entry.name) };
    case 'reference_variable': return { kind: 'reference_variable', name: variable(entry.name) };
    case 'keyed': return { kind: 'keyed', key: mapExpression(entry.key, file), target: mapDestructuringEntry(entry.target, mapExpression, file) };
    case 'nested': return { kind: 'nested', pattern: mapDestructuringPattern(entry.pattern, mapExpression, file) };
    case 'skipped': return { kind: 'skipped' };
  }
}

function mapStaticPropertyOwner(owner: import('../../lexer/phpAstStatementTypes').PhpStaticPropertyOwner): import('../../../../types/upstream/assignment').StaticPropertyOwner {
  switch (owner.kind) {
    case 'named_class': return { kind: 'named_class', name: className(owner.name) };
    case 'self': return { kind: 'self' };
    case 'static': return { kind: 'static' };
    case 'parent': return { kind: 'parent' };
  }
}

export function mapClosureParameter(parameter: import('../../lexer/phpAstExpressionTypes').PhpParameter, mapExpression: UpstreamExpressionMapper, file: string): import('../../../../types/upstream/expression').ClosureParameter {
  return {
    kind: 'closure_parameter',
    name: variable(parameter.variable),
    type: parameter.type.kind === 'absent' ? { kind: 'absent' } : { kind: 'present', value: mapParameterType(parameter.type, mapExpression, file) },
    passing: { kind: parameter.passing.kind },
    variadic: { kind: parameter.variadic.kind },
    defaultValue: parameter.defaultValue.kind === 'absent' ? { kind: 'absent' } : { kind: 'present', value: mapExpression(parameter.defaultValue.value, file) },
  };
}

function mapParameterType(type: import('../../lexer/phpMethodAstTypes').PhpParameterTypeAst, _mapExpression: UpstreamExpressionMapper, _file: string): TypeExpression {
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
    case 'nullable': return { kind: 'nullable', value: mapParameterType(type.inner, _mapExpression, _file) };
  }
}


export const constantName = (value: string): import('../../../../types/upstream/names').ConstantName => Object.freeze({ kind: 'constant_name', value: str(value) });
