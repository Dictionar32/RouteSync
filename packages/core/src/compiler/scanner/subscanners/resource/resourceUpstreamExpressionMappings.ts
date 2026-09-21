import type { Expression, ArrayEntry, ReferenceCardinality, CastType, BinaryOperator, UnaryOperator } from '../../../../types/upstream/expression';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { PhpAccessMode, PhpArgument, PhpArrayEntry, PhpArrayKey, PhpAstValue, PhpPropertyPath } from '../../lexer/phpAstExpressionTypes';
import { matchPhpAccessMode } from '../../lexer/phpAstAlgebra';
const str = (value: string): import('../../../../types/upstream/valueObjects').StringValue => ({ kind: 'string_value', value });
import type { ClassName, FunctionName, MethodName, PropertyName, ResourceName, VariableName } from '../../../../types/upstream/names';
import type { AssignmentTarget } from '../../../../types/upstream/assignment';

export type UpstreamExpressionMapper = (value: PhpAstValue, file: string) => Expression;
export const sourceSpan = (file: string): SourceSpan => ({ kind: 'source_span', file, start: { line: 0, column: 0 }, end: { line: 0, column: 0 } });
export const variable = (value: string): VariableName => ({ kind: 'variable_name', value: str(value) });
export const property = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
export const method = (value: string): MethodName => ({ kind: 'method_name', value: str(value) });
export const functionName = (value: string): FunctionName => ({ kind: 'function_name', value: str(value) });
export const className = (value: string): ClassName => ({ kind: 'class_name', value: str(value) });
export const resource = (value: string): ResourceName => ({ kind: 'resource_name', value: str(value) });
export const sequence = <T>(items: readonly T[]): import('../../../../types/upstream/collections').Sequence<T> => items.reduceRight((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });
export const cardinality = (kind: 'single' | 'collection'): ReferenceCardinality => ({ kind });
export const expressions = (items: readonly Expression[]) => ({ kind: 'expressions' as const, items: sequence(items) });

export function mapArguments(arguments_: readonly PhpArgument[], mapExpression: UpstreamExpressionMapper, file: string): readonly Expression[] {
  return arguments_.map(argument => mapExpression(argument.value, file));
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
  return matchPhpAccessMode(access, {
    direct: () => ({ kind: 'property', receiver: expression, property: property(name), path, source }),
    nullsafe: () => ({ kind: 'nullsafe_property', receiver: expression, property: property(name), path, source }),
  });
}

export function methodExpression(receiver: PhpAstValue, target: PhpPropertyPath, name: string, args: readonly PhpArgument[], access: PhpAccessMode, mapExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): Expression {
  const expression = mapExpression(receiver, file);
  const path = propertyPath(target);
  const arguments_ = expressions(mapArguments(args, mapExpression, file));
  return matchPhpAccessMode(access, {
    direct: () => ({ kind: 'method', receiver: expression, operation: { kind: 'domain', name: method(name) }, arguments: arguments_, path, source }),
    nullsafe: () => ({ kind: 'nullsafe_method', receiver: expression, operation: { kind: 'domain', name: method(name) }, arguments: arguments_, path, source }),
  });
}

export function propertyPath(path: PhpPropertyPath): import('../../../../types/upstream/collections').PropertyPath {
  return { kind: 'property_path', segments: sequence([path.root, ...path.steps].map(step => property(step.value))) };
}

export function mapBinaryOperator(kind: import('../../lexer/phpAstExpressionTypes').PhpBinaryOperator['kind']): BinaryOperator {
  switch (kind) {
    case 'identical': case 'equal': return { kind: 'equal' }; case 'not_identical': case 'not_equal': return { kind: 'not_equal' };
    case 'greater_than': return { kind: 'greater' }; case 'greater_or_equal': return { kind: 'greater_equal' }; case 'less_than': return { kind: 'less' }; case 'less_or_equal': return { kind: 'less_equal' };
    case 'addition': return { kind: 'add' }; case 'subtraction': return { kind: 'subtract' }; case 'multiplication': return { kind: 'multiply' }; case 'division': return { kind: 'divide' }; case 'modulo': return { kind: 'modulo' };
    case 'logical_and': return { kind: 'and' }; case 'logical_or': return { kind: 'or' }; case 'concat': return { kind: 'concat' };
  }
}

export function mapUnaryOperator(kind: import('../../lexer/phpAstExpressionTypes').PhpUnaryOperator['kind']): UnaryOperator {
  switch (kind) { case 'negative': return { kind: 'negate' }; case 'positive': return { kind: 'positive' }; case 'bitwise_not': return { kind: 'bitwise_not' }; case 'not': return { kind: 'not' }; }
}

export function mapCastType(kind: import('../../lexer/phpAstExpressionTypes').PhpCastType['kind']): CastType {
  switch (kind) { case 'int': return { kind: 'integer' }; case 'float': return { kind: 'float' }; case 'string': return { kind: 'string' }; case 'bool': return { kind: 'boolean' }; case 'array': return { kind: 'array' }; case 'object': return { kind: 'json' }; }
}

export function mapArrayEntry(entry: PhpArrayEntry, index: number, mapExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): ArrayEntry {
  if (entry.kind === 'positional') return { kind: 'implicit', index: { kind: 'number_value', value: index }, value: mapExpression(entry.value, file), source };
  return { kind: 'keyed', key: mapArrayKey(entry.key, mapExpression, file), value: mapExpression(entry.value, file), source };
}

export function mapArrayKey(key: PhpArrayKey, mapExpression: UpstreamExpressionMapper, file: string): Expression {
  switch (key.kind) { case 'string': return { kind: 'literal', value: { kind: 'string_literal', value: str(key.value) }, source: sourceSpan(file) }; case 'integer': return { kind: 'literal', value: { kind: 'number_literal', value: { kind: 'number_value', value: key.value } }, source: sourceSpan(file) }; case 'expression': return mapExpression(key.value, file); }
}

export function mapAssignmentTarget(target: import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, mapExpression: UpstreamExpressionMapper, file: string): AssignmentTarget {
  switch (target.kind) {
    case 'variable': return { kind: 'variable', name: variable(target.name) };
    case 'variables': return { kind: 'variables', names: { kind: 'variable_names', items: sequence(target.names.map(item => variable(item))) } };
    case 'property': return { kind: 'property', receiver: mapExpression(target.receiver, file), name: property(target.property) };
    case 'array_element': return { kind: 'index', receiver: mapExpression(target.target, file), key: mapExpression(target.index, file) };
  }
}

