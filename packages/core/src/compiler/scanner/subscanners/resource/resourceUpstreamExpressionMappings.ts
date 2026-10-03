import type { Expression, ArrayEntry, ReferenceCardinality, CastType, BinaryOperator, UnaryOperator, StaticReceiver, StaticMethodAction, ExpressionArgument } from '../../../../types/upstream/expression';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { PhpAccessMode, PhpArgument, PhpArrayEntry, PhpArrayKey, PhpAstValue, PhpLiteralValue, PhpPropertyPath } from '../../lexer/phpAstExpressionTypes';
const str = (value: string): import('../../../../types/upstream/valueObjects').StringValue => ({ kind: 'string_value', value });
import { createSourceFile } from '../../../../types/upstream/names';
import type { ClassName, FunctionName, MethodName, PropertyName, ResourceName, VariableName } from '../../../../types/upstream/names';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { AssignmentTarget, AssignmentOperator, AssignmentReferenceMode } from '../../../../types/upstream/assignment';
import { resolveResourceMappingConstructor, resolveResourceSemanticKind, RESOURCE_ALL_MAPPING_RULES } from './resourceSemanticMappingRelations';
import { solveSemanticRelations } from '../../lexer/routeAst/semanticRelationSolver';
import { relationAny, relationEqual, relationGate, relationFirstOption, relationOptionFold, relationProject } from '../../../../semantic/kernel/semanticRelations';

export type UpstreamExpressionMapper = (value: PhpAstValue, file: string) => Expression;

const resolveStructuralKind = (prefix: string, kind: string): string => {
  const solved = solveSemanticRelations([{ relation: 'source_kind', arguments: [`${prefix}_${kind}`] }], RESOURCE_ALL_MAPPING_RULES);
  const fact = relationFirstOption(solved, item => relationEqual(item.relation, 'semantic_kind'));
  return relationOptionFold(fact, () => { throw Error(`No declarative structural mapping for ${prefix}_${kind}`); }, resolved => String(resolved.arguments[0]));
};
export const sourceSpan = (file: string, position = 0): SourceSpan => ({ kind: 'source_span', file: createSourceFile(file), start: { kind: 'number_value', value: position }, end: { kind: 'number_value', value: position } });
export const sourceSpanFromRange = (file: import('../../../../types/upstream/names').SourceFile, range: import('../../lexer/phpAstCoreTypes').SourceRange): SourceSpan => ({ kind: 'source_span', file, start: { kind: 'number_value', value: range.startOffset }, end: { kind: 'number_value', value: range.endOffset } });
export const variable = (value: string): VariableName => ({ kind: 'variable_name', value: str(value) });
export const property = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
export const method = (value: string): MethodName => ({ kind: 'method_name', value: str(value) });
export const functionName = (value: string): FunctionName => ({ kind: 'function_name', value: str(value) });
export const className = (value: string): ClassName => ({ kind: 'class_name', value: str(value) });
export const resource = (value: string): ResourceName => ({ kind: 'resource_name', value: str(value) });
export const sequence = <T>(items: readonly T[], index = 0): import('../../../../types/upstream/collections').Sequence<T> => relationGate(index < items.length, () => ({ kind: 'cons', head: items[index], tail: sequence(items, index + 1) }), () => ({ kind: 'empty' }));
export const cardinality = (kind: ReferenceCardinality): ReferenceCardinality => kind;
export const expressions = (items: readonly Expression[]) => ({ kind: 'expressions' as const, items: sequence(items) });
export const expressionArguments = (items: readonly ExpressionArgument[]) => ({ kind: 'expression_arguments' as const, items: sequence(items) });

export function resolveStaticReceiver(classNameValue: string): StaticReceiver {
  const frameworkReceiver = relationAny([relationEqual(classNameValue, 'DB'), relationEqual(classNameValue, 'Attribute')]);
  const semantic = relationGate(frameworkReceiver, () => resolveResourceSemanticKind(`static_receiver_${classNameValue}`), () => resolveResourceSemanticKind('static_receiver_class'));
  const constructors: Record<string, () => StaticReceiver> = {
    framework_database: () => ({ kind: 'framework', receiver: { kind: 'database', name: className(classNameValue) } }),
    framework_attribute: () => ({ kind: 'framework', receiver: { kind: 'attribute', name: className(classNameValue) } }),
    class: () => ({ kind: 'class', name: className(classNameValue) }),
  };
  return constructors[semantic]!();
}

export function resolveStaticAction(classNameValue: string, methodNameValue: string): StaticMethodAction {
  const rawAction = relationAny([relationEqual(classNameValue, 'DB'), relationEqual(methodNameValue, 'raw')]);
  const semantic = relationGate(rawAction, () => resolveResourceSemanticKind('static_action_DB_raw'), () => resolveResourceSemanticKind('static_action_domain'));
  const constructors: Record<string, () => StaticMethodAction> = {
    database_raw: () => ({ kind: 'database_raw' }),
    domain: () => ({ kind: 'domain', name: method(methodNameValue) }),
  };
  return constructors[semantic]!();
}

export function resolveArguments(arguments_: readonly PhpArgument[], resolveExpression: UpstreamExpressionMapper, file: string): readonly ExpressionArgument[] {
  const handlers: Record<string, (argument: PhpArgument) => ExpressionArgument> = {
    positional: argument => ({ kind: 'positional', value: resolveExpression(argument.value, file) }),
    named: argument => ({ kind: 'named', name: { kind: 'expression_argument_name', value: str((argument as Extract<PhpArgument, { readonly kind: 'named' }>).name) }, value: resolveExpression(argument.value, file) }),
    unpacked: argument => ({ kind: 'unpacked', value: resolveExpression(argument.value, file) }),
  };
  return relationProject(arguments_, argument => handlers[resolveStructuralKind('argument', argument.kind)](argument));
}


export function resolveLiteral(value: PhpLiteralValue, source: SourceSpan): Expression {
  const stringLiteral = relationFirstOption([value], (candidate): candidate is Extract<PhpLiteralValue, { readonly literalType: 'string' }> => relationEqual(candidate.literalType, 'string'));
  return relationOptionFold(stringLiteral,
    () => {
      const numberLiteral = relationFirstOption([value], (candidate): candidate is Extract<PhpLiteralValue, { readonly literalType: 'number' }> => relationEqual(candidate.literalType, 'number'));
      return relationOptionFold(numberLiteral,
        () => {
          const booleanLiteral = relationFirstOption([value], (candidate): candidate is Extract<PhpLiteralValue, { readonly literalType: 'boolean' }> => relationEqual(candidate.literalType, 'boolean'));
          return relationOptionFold(booleanLiteral,
            () => ({ kind: 'literal', value: { kind: 'null_literal' }, source }),
            literal => ({ kind: 'literal', value: { kind: 'boolean_literal', value: { kind: 'truth_value', value: literal.value } }, source }),
          );
        },
        literal => ({ kind: 'literal', value: { kind: 'number_literal', value: { kind: 'number_value', value: literal.value } }, source }),
      );
    },
    literal => ({ kind: 'literal', value: { kind: 'string_literal', value: str(literal.value) }, source }),
  );
}


export function memberExpression(receiver: PhpAstValue, target: PhpPropertyPath, name: string, access: PhpAccessMode, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): Expression {
  const expression = resolveExpression(receiver, file);
  const path = propertyPath(target);
  const constructors: Record<string, () => Expression> = {
    direct: () => ({ kind: 'property', receiver: expression, property: property(name), path, source }),
    nullsafe: () => ({ kind: 'nullsafe_property', receiver: expression, property: property(name), path, source }),
  };
  return constructors[resolveStructuralKind('access', access.kind)]!();
}

export function methodExpression(receiver: PhpAstValue, target: PhpPropertyPath, name: string, args: readonly PhpArgument[], access: PhpAccessMode, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): Expression {
  const expression = resolveExpression(receiver, file);
  const path = propertyPath(target);
  const arguments_ = expressionArguments(resolveArguments(args, resolveExpression, file));
  const constructors: Record<string, () => Expression> = {
    direct: () => ({ kind: 'method', receiver: expression, operation: { kind: 'domain', name: method(name) }, arguments: arguments_, path, source }),
    nullsafe: () => ({ kind: 'nullsafe_method', receiver: expression, operation: { kind: 'domain', name: method(name) }, arguments: arguments_, path, source }),
  };
  return constructors[resolveStructuralKind('access', access.kind)]!();
}

export function propertyPath(path: PhpPropertyPath): import('../../../../types/upstream/collections').PropertyPath {
  return { kind: 'property_path', segments: sequence(relationProject([path.root, ...path.steps], step => property(step))) };
}

export function resolveBinaryOperator(kind: import('../../lexer/phpAstExpressionTypes').PhpBinaryOperator['kind']): BinaryOperator {
  return resolveResourceMappingConstructor(`binary_${kind}`) as BinaryOperator;
}

export function resolveUnaryOperator(kind: import('../../lexer/phpAstExpressionTypes').PhpUnaryOperator['kind']): UnaryOperator {
  return resolveResourceMappingConstructor(`unary_${kind}`) as UnaryOperator;
}

export function resolveCastType(kind: import('../../lexer/phpAstExpressionTypes').PhpCastType['kind']): CastType {
  return resolveResourceMappingConstructor(`cast_${kind}`) as CastType;
}

export function resolveArrayEntry(entry: PhpArrayEntry, index: number, resolveExpression: UpstreamExpressionMapper, file: string, source: SourceSpan): ArrayEntry {
  const handlers: Record<string, (entry: PhpArrayEntry) => ArrayEntry> = {
    implicit: entry => ({ kind: 'implicit', index: { kind: 'number_value', value: index }, value: resolveExpression(entry.value, file), source }),
    keyed: entry => ({ kind: 'keyed', key: resolveArrayKey((entry as Extract<PhpArrayEntry, { readonly kind: 'keyed' }>).key, resolveExpression, file, source), value: resolveExpression(entry.value, file), source }),
    unpacked: entry => ({ kind: 'unpacked', value: resolveExpression(entry.value, file), source }),
  };
  return handlers[resolveStructuralKind('array_entry', entry.kind)](entry);
}


export function resolveArrayKey(key: PhpArrayKey, resolveExpression: UpstreamExpressionMapper, file: string, entrySource: SourceSpan): Expression {
  const handlers: Record<string, (key: PhpArrayKey) => Expression> = {
    string_literal: key => ({ kind: 'literal', value: { kind: 'string_literal', value: str((key as Extract<PhpArrayKey, { readonly kind: 'string' }>).value) }, source: entrySource }),
    number_literal: key => ({ kind: 'literal', value: { kind: 'number_literal', value: { kind: 'number_value', value: (key as Extract<PhpArrayKey, { readonly kind: 'integer' }>).value } }, source: entrySource }),
    expression: key => resolveExpression(key.value, file),
  };
  return handlers[resolveStructuralKind('array_key', key.kind)](key);
}


export function resolveAssignmentOperator(kind: import('../../lexer/phpAstStatementTypes').PhpAssignmentOperator['kind']): AssignmentOperator {
  return resolveResourceMappingConstructor(`assignment_${kind}`) as AssignmentOperator;
}

export function assignmentReferenceMode(kind: import('../../lexer/phpAstStatementTypes').PhpAssignmentReference['kind']): AssignmentReferenceMode {
  return resolveResourceMappingConstructor(`reference_${kind}`) as AssignmentReferenceMode;
}
export function resolveAssignmentTarget(target: import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, resolveExpression: UpstreamExpressionMapper, file: string): AssignmentTarget {
  const handlers: Record<string, (target: import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget) => AssignmentTarget> = {
    variable: target => ({ kind: 'variable', name: variable((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'variable' }>).name) }),
    variables: target => ({ kind: 'variables', names: { kind: 'variable_names', items: relationProject((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'variables' }>).names, name => variable(name)) } }),
    destructuring: target => ({ kind: 'destructuring', pattern: resolveDestructuringPattern((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'destructuring' }>).pattern, resolveExpression, file) }),
    property: target => ({ kind: 'property', receiver: resolveExpression((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'property' }>).receiver, file), name: property((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'property' }>).property) }),
    static_property: target => ({ kind: 'static_property', owner: resolveStaticPropertyOwner((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'static_property' }>).owner), name: property((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'static_property' }>).property) }),
    index: target => ({ kind: 'index', receiver: resolveExpression((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'index' }>).target, file), key: resolveExpression((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'index' }>).index, file) }),
    append: target => ({ kind: 'append', receiver: resolveExpression((target as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentTarget, { readonly kind: 'append' }>).target, file) }),
  };
  return handlers[resolveStructuralKind('assignment_target', target.kind)](target);
}


function resolveDestructuringPattern(pattern: import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringPattern, resolveExpression: UpstreamExpressionMapper, file: string): import('../../../../types/upstream/assignment').AssignmentDestructuringPattern {
  return { kind: 'list', entries: sequence(relationProject(pattern.entries, entry => resolveDestructuringEntry(entry, resolveExpression, file))) };
}

function resolveDestructuringEntry(entry: import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry, resolveExpression: UpstreamExpressionMapper, file: string): import('../../../../types/upstream/assignment').AssignmentDestructuringEntry {
  const handlers: Record<string, (entry: import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry) => import('../../../../types/upstream/assignment').AssignmentDestructuringEntry> = {
    variable: entry => ({ kind: 'variable', name: variable((entry as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry, { readonly kind: 'variable' }>).name) }),
    reference_variable: entry => ({ kind: 'reference_variable', name: variable((entry as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry, { readonly kind: 'variable' }>).name) }),
    keyed: entry => ({ kind: 'keyed', key: resolveExpression((entry as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry, { readonly kind: 'keyed' }>).key, file), target: resolveDestructuringEntry((entry as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry, { readonly kind: 'keyed' }>).target, resolveExpression, file) }),
    nested: entry => ({ kind: 'nested', pattern: resolveDestructuringPattern((entry as Extract<import('../../lexer/phpAstStatementTypes').PhpAssignmentDestructuringEntry, { readonly kind: 'nested' }>).pattern, resolveExpression, file) }),
    skipped: () => ({ kind: 'skipped' }),
  };
  return handlers[resolveStructuralKind('destructuring', entry.kind)](entry);
}


function resolveStaticPropertyOwner(owner: import('../../lexer/phpAstStatementTypes').PhpStaticPropertyOwner): import('../../../../types/upstream/assignment').StaticPropertyOwner {
  const handlers: Record<string, (owner: import('../../lexer/phpAstStatementTypes').PhpStaticPropertyOwner) => import('../../../../types/upstream/assignment').StaticPropertyOwner> = {
    named_class: owner => ({ kind: 'named_class', name: className((owner as Extract<import('../../lexer/phpAstStatementTypes').PhpStaticPropertyOwner, { readonly kind: 'named_class' }>)) }),
    self: () => ({ kind: 'self' }),
    static: () => ({ kind: 'static' }),
    parent: () => ({ kind: 'parent' }),
  };
  return handlers[resolveStructuralKind('static_property_owner', owner.kind)](owner);
}


export function resolveClosureParameter(parameter: import('../../lexer/phpAstExpressionTypes').PhpParameter, resolveExpression: UpstreamExpressionMapper, file: string): import('../../../../types/upstream/expression').ClosureParameter {
  return {
    kind: 'closure_parameter',
    name: variable(parameter.variable),
    type: relationGate(relationEqual(parameter.type.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveParameterType(parameter.type, resolveExpression, file) })),
    passing: { kind: parameter.passing.kind },
    variadic: { kind: parameter.variadic.kind },
    defaultValue: relationGate(relationEqual(parameter.defaultValue.kind, 'absent'), () => ({ kind: 'absent' }), () => ({ kind: 'present', value: resolveExpression(parameter.defaultValue.value, file) })),
  };
}

function resolveParameterType(type: import('../../lexer/phpMethodAstTypes').PhpParameterTypeAst, _resolveExpression: UpstreamExpressionMapper, _file: string): TypeExpression {
  const handlers: Record<string, (type: import('../../lexer/phpMethodAstTypes').PhpParameterTypeAst) => TypeExpression> = {
    primitive: type => {
      const primitiveKind = resolveStructuralKind('primitive', (type as Extract<import('../../lexer/phpMethodAstTypes').PhpParameterTypeAst, { readonly kind: 'primitive' }>).name);
      const constructors: Record<string, () => TypeExpression> = {
        boolean: () => ({ kind: 'primitive', value: { kind: 'boolean' } }),
        string: () => ({ kind: 'primitive', value: { kind: 'string' } }),
        number: () => ({ kind: 'primitive', value: { kind: 'number' } }),
        mixed: () => ({ kind: 'mixed' }),
        unspecified: () => ({ kind: 'primitive', value: { kind: 'unspecified' } }),
      };
      return constructors[primitiveKind]!();
    },
    named: type => ({ kind: 'reference', value: { kind: 'class', name: className((type as Extract<import('../../lexer/phpMethodAstTypes').PhpParameterTypeAst, { readonly kind: 'named' }>).name) } }),
    nullable: type => ({ kind: 'nullable', value: resolveParameterType((type as Extract<import('../../lexer/phpMethodAstTypes').PhpParameterTypeAst, { readonly kind: 'nullable' }>).inner, _resolveExpression, _file) }),
  };
  return handlers[resolveStructuralKind('parameter_type', type.kind)](type);
}



export const constantName = (value: string): import('../../../../types/upstream/names').ConstantName => Object.freeze({ kind: 'constant_name', value: str(value) });
