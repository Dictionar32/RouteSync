import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { PHP_STATEMENT_KINDS } from '../lexer/phpAstStatementKinds';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { classNameEquals } from '../../../types/upstream/names';
import { collectPhpFiles } from './scannerUtils';
import { serviceSourceStatements } from './serviceSourceStatements';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';
import type { PhpMethodAst } from '../lexer/phpMethodAstTypes';
import type { PhpParameterTypeAst } from '../lexer/phpMethodAstTypes';
import { parsePhpMethodOrThrow } from '../lexer/phpMethodParser';
import { createDomainAstJudgment, type ServiceAst } from '../../../types/upstream/ast';
import type { ServiceDefinition, ServiceMethod, ServiceParameter, ServiceDependencyFact, ServiceMethodResultIndex, ServiceMethodResultEntry } from '../../../types/upstream/service';
import type { ServiceDeclarationAst } from '../lexer/serviceAstTypes';
import type { DeclaredType, TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { SemanticValue } from '../../../types/upstream/primitiveVocabulary';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { Option, Sequence } from '../../../types/upstream/collections';
import type { StringValue } from '../../../types/upstream/valueObjects';
import type { ModelSymbolTable } from '../symbols/ModelSymbolTable';
import { relationGate, relationFold, relationAsyncFold, relationIndexOf, relationOptionFold, relationFixedPoint, relationProject, relationExpand, relationAll, relationAny, relationAdvanceIndex, relationLookup } from '../../../semantic/kernel/relationalSequence';
import { solveCandidate, requirement } from '../../../semantic/kernel/semanticDecisionRewriteEngine';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const sequence = <T>(items: readonly T[]): Sequence<T> => relationFold([...items].reverse(), { kind: 'empty' } as Sequence<T>, (tail, head) => ({ kind: 'cons', head, tail }));
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

function typeExpression(type: PhpParameterTypeAst): TypeExpression {
  const candidates = [
    { id: 'bool', value: { kind: 'primitive', value: { kind: 'boolean' } } as TypeExpression, requirements: [requirement('primitive-bool', relationAll([Object.is(type.kind, 'primitive'), Object.is(type.name, 'bool')]))] },
    { id: 'string', value: { kind: 'primitive', value: { kind: 'string' } } as TypeExpression, requirements: [requirement('primitive-string', relationAll([Object.is(type.kind, 'primitive'), Object.is(type.name, 'string')]))] },
    { id: 'number', value: { kind: 'primitive', value: { kind: 'number' } } as TypeExpression, requirements: [requirement('primitive-number', relationAll([Object.is(type.kind, 'primitive'), relationAny([Object.is(type.name, 'float'), Object.is(type.name, 'int')])]))] },
    { id: 'mixed', value: { kind: 'mixed' } as TypeExpression, requirements: [requirement('primitive-mixed', relationAll([Object.is(type.kind, 'primitive'), Object.is(type.name, 'mixed')]))] },
    { id: 'array', value: { kind: 'primitive', value: { kind: 'unspecified' } } as TypeExpression, requirements: [requirement('primitive-array', relationAll([Object.is(type.kind, 'primitive'), Object.is(type.name, 'array')]))] },
    { id: 'named', value: { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(relationGate(Object.is(type.kind, 'named'), () => type.name, () => '')) } } } as TypeExpression, requirements: [requirement('named', Object.is(type.kind, 'named'))] },
    { id: 'nullable', value: { kind: 'nullable', value: typeExpression(relationGate(Object.is(type.kind, 'nullable'), () => type.inner, () => type)) } as TypeExpression, requirements: [requirement('nullable', Object.is(type.kind, 'nullable'))] },
  ];
  return relationOptionFold(solveCandidate(candidates), () => ({ kind: 'mixed' }), value => value);
}

function declaredType(type: PhpParameterTypeAst): DeclaredType {
  return {
    kind: 'declared_type',
    value: typeExpression(type),
    nullability: relationGate(Object.is(type.kind, 'nullable'), () => ({ kind: 'nullable' }), () => ({ kind: 'non_nullable' })),
  };
}

type ExpressionChildResolver = (expression: import('../../../types/upstream/expression').Expression) => readonly import('../../../types/upstream/expression').Expression[];

const expressionChildCatalog: readonly (readonly [string, ExpressionChildResolver])[] = [
  ['property', expression => [expression.receiver]],
  ['relation', expression => [expression.receiver]],
  ['nullsafe_property', expression => [expression.receiver]],
  ['method', expression => [expression.receiver, ...sequenceArgumentExpressions(expression.arguments.items)]],
  ['nullsafe_method', expression => [expression.receiver, ...sequenceArgumentExpressions(expression.arguments.items)]],
  ['binary', expression => [expression.left, expression.right]],
  ['unary', expression => [expression.operand]],
  ['conditional', expression => [expression.condition, expression.branches.whenTrue, ...relationGate(Object.is(expression.branches.kind, 'then_else'), () => [expression.branches.whenFalse], () => [])]],
  ['coalesce', expression => [expression.left, expression.right]],
  ['index', expression => [expression.receiver, expression.key]],
  ['array', expression => relationExpand(relationProject(expression.entries, entry => relationGate(Object.is(entry.kind, 'keyed'), () => [entry.key, entry.value], () => [entry.value])), nested => nested)],
  ['object', expression => sequenceObjectExpressions(expression.properties)],
  ['match', expression => sequenceMatchExpressions(expression.arms)],
  ['builtin', expression => sequenceArgumentExpressions(expression.arguments.items)],
  ['call', expression => sequenceArgumentExpressions(expression.arguments.items)],
  ['static_method', expression => sequenceArgumentExpressions(expression.arguments.items)],
  ['cast', expression => [expression.expression]],
];

function expressionChildren(expression: import('../../../types/upstream/expression').Expression): readonly import('../../../types/upstream/expression').Expression[] {
  return relationOptionFold(relationLookup(expressionChildCatalog, expression.kind), () => [], resolver => resolver(expression));
}

function sequenceArgumentExpressions(items: import('../../../types/upstream/collections').ExpressionArguments['items']): readonly import('../../../types/upstream/expression').Expression[] {
  return relationGate(Object.is(items.kind, 'empty'), () => [], () => [items.head, ...sequenceArgumentExpressions(items.tail)]);
}

function sequenceObjectExpressions(properties: import('../../../types/upstream/collections').ObjectProperties): readonly import('../../../types/upstream/expression').Expression[] {
  return relationGate(Object.is(properties.items.kind, 'empty'), () => [], () => [properties.items.head.value, ...sequenceObjectExpressions({ ...properties, items: properties.items.tail })]);
}

function sequenceMatchExpressions(arms: import('../../../types/upstream/collections').MatchArms): readonly import('../../../types/upstream/expression').Expression[] {
  return relationGate(Object.is(arms.items.kind, 'empty'), () => [], () => {
    const conditions = relationGate(Object.is(arms.items.head.kind, 'conditional'), () => {
      const visit = (items: typeof arms.items.head.conditions.items): readonly import('../../../types/upstream/expression').Expression[] => relationGate(Object.is(items.kind, 'empty'), () => [], () => [items.head, ...visit(items.tail)]);
      return visit(arms.items.head.conditions.items);
    }, () => []);
    return [...conditions, arms.items.head.result, ...sequenceMatchExpressions({ ...arms, items: arms.items.tail })];
  });
}

function parameterModelTypes(methodItem: PhpMethodAst): RelationIndex<import('../../../types/upstream/names').VariableName, import('../../../types/upstream/names').ClassName> {
  return relationFold(methodItem.parameters, [] as RelationIndex<import('../../../types/upstream/names').VariableName, import('../../../types/upstream/names').ClassName>, (output, item) => {
    const type = relationGate(Object.is(item.type.kind, 'nullable'), () => item.type.inner, () => item.type);
    return relationGate(Object.is(type.kind, 'named'), () => relationIndexAdd(output, { kind: 'variable_name', value: stringValue(item.name) }, { kind: 'class_name', value: stringValue(type.name) }), () => output);
  });
}

function collectTypedParameterModels(expression: import('../../../types/upstream/expression').Expression, parameterModels: RelationIndex<import('../../../types/upstream/names').VariableName, import('../../../types/upstream/names').ClassName>, targets: import('../../../types/upstream/names').ClassName[]): readonly import('../../../types/upstream/names').ClassName[] {
  relationGate(Object.is(expression.kind, 'variable'), () => {
    const model = relationIndexLookup(parameterModels, expression.name);
    relationOptionFold(model, () => targets, value => [...targets, value]);
  }, () => targets);
  return relationFold(expressionChildren(expression), targets, (output, child) => collectTypedParameterModels(child, parameterModels, output));
}

function assignmentTargetExpressions(target: import('../lexer/phpAstStatementTypes').PhpAssignmentTarget): readonly import('../lexer/phpAstExpressionTypes').PhpAstValue[] {
  return relationOptionFold(solveCandidate([
    { id: 'variable', value: Object.freeze([]), requirements: [requirement('variable', relationAny([Object.is(target.kind, 'variable'), Object.is(target.kind, 'variables')]))] },
    { id: 'property', value: [target.receiver], requirements: [requirement('property', Object.is(target.kind, 'property'))] },
    { id: 'array-element', value: [target.target, target.index], requirements: [requirement('array-element', Object.is(target.kind, 'array_element'))] },
  ]), () => Object.freeze([]), value => value);
}

const statementExpressionCatalog: readonly (readonly [string, (statement: import('../lexer/phpAstStatementTypes').PhpStatement) => readonly import('../lexer/phpAstExpressionTypes').PhpAstValue[]])[] = [
  ['expression_statement', statement => [statement.expression]],
  ['return_with_value', statement => [statement.expression]],
  ['return_void', () => []],
  ['assignment', statement => [statement.value, ...assignmentTargetExpressions(statement.target)]],
  [PHP_STATEMENT_KINDS.conditional, statement => [statement.condition, ...bodyExpressionSequence(statement.thenBlock.statements), ...relationGate(Object.is(statement.alternative.kind, 'else_block'), () => bodyExpressionSequence(statement.alternative.block.statements), () => relationGate(Object.is(statement.alternative.kind, 'else_if'), () => bodyExpressions(statement.alternative.statement), () => []))]],
  [PHP_STATEMENT_KINDS.collectionRecurrence, statement => [statement.iterable, ...bodyExpressionSequence(statement.body.statements)]],
  [PHP_STATEMENT_KINDS.countedRecurrence, statement => [...phpForClauseExpressions(statement.initializer), ...phpForClauseExpressions(statement.condition), ...phpForClauseExpressions(statement.update), ...bodyExpressionSequence(statement.body.statements)]],
  ['try_statement', statement => [...bodyExpressionSequence(statement.body.statements), ...relationExpand(relationProject(statement.catches, item => bodyExpressionSequence(item.body.statements)), nested => nested), ...relationGate(Object.is(statement.finallyBlock.kind, 'present'), () => bodyExpressionSequence(statement.finallyBlock.block.statements), () => [])]],
  ['throw_statement', statement => [statement.expression]],
];

function bodyExpressions(statement: import('../lexer/phpAstStatementTypes').PhpStatement): readonly import('../lexer/phpAstExpressionTypes').PhpAstValue[] {
  return relationOptionFold(relationLookup(statementExpressionCatalog, statement.kind), () => [], resolver => resolver(statement));
}

function bodyExpressionSequence(statements: readonly import('../lexer/phpAstStatementTypes').PhpStatement[]): readonly import('../lexer/phpAstExpressionTypes').PhpAstValue[] {
  return relationExpand(statements, statement => bodyExpressions(statement));
}

function phpForClauseExpressions(clause: import('../lexer/phpAstStatementTypes').PhpForClause): readonly import('../../../types/upstream/phpAstExpressionTypes').PhpAstValue[] {
  return relationOptionFold(solveCandidate([
    { id: 'empty', value: Object.freeze([]), requirements: [requirement('empty', Object.is(clause.kind, 'empty'))] },
    { id: 'expression', value: [clause.value], requirements: [requirement('expression', Object.is(clause.kind, 'expression'))] },
    { id: 'assignment', value: [clause.value], requirements: [requirement('assignment', Object.is(clause.kind, 'assignment'))] },
  ]), () => Object.freeze([]), value => value);
}

function parameter(parameter: PhpMethodAst['parameters'][number], file: string): ServiceParameter {
  const span: SourceSpan = {
    kind: 'source_span',
    file: { kind: 'source_file', value: stringValue(file) },
    start: { kind: 'number_value', value: Number(parameter.source.line) },
    end: { kind: 'number_value', value: Number(parameter.source.line) },
  };
  return {
    kind: 'service_parameter',
    name: { kind: 'variable_name', value: stringValue(parameter.name) },
    type: declaredType(parameter.type),
    defaultValue: relationGate(Object.is(parameter.defaultValue.kind, 'absent'), () => ({ kind: 'absent' as const }), () => ({ kind: 'present' as const, value: mapResourcePhpAstToUpstream(parameter.defaultValue.value, file) })),
    source: span,
  };
}

type ReturnFlow = {
  readonly returns: readonly import('../../../types/upstream/expression').ResolvedExpression[];
  readonly canFallThrough: boolean;
};

function returnFlow(statements: import('../../../types/upstream/sourceStatements').SourceStatements): ReturnFlow {
  return returnFlowItems(statements.items);
}

function returnFlowItems(items: import('../../../types/upstream/collections').Sequence<import('../../../types/upstream/sourceStatements').SourceStatement>): ReturnFlow {
  return relationGate(Object.is(items.kind, 'empty'), () => ({ returns: [], canFallThrough: true }), () => {
    const current = returnFlowStatement(items.head);
    return relationGate(current.canFallThrough, () => {
      const rest = returnFlowItems(items.tail);
      return { returns: [...current.returns, ...rest.returns], canFallThrough: rest.canFallThrough };
    }, () => current);
  });
}

function returnFlowCatchItems(items: import('../../../types/upstream/collections').Sequence<import('../../../types/upstream/sourceStatements').SourceStatement['catches']['items']['head']>): ReturnFlow {
  return relationGate(Object.is(items.kind, 'empty'), () => ({ returns: [], canFallThrough: false }), () => {
    const current = returnFlow(items.head.body);
    const rest = returnFlowCatchItems(items.tail);
    return { returns: [...current.returns, ...rest.returns], canFallThrough: relationAny([current.canFallThrough, rest.canFallThrough]) };
  });
}

const returnFlowCatalog: readonly (readonly [string, (statement: import('../../../types/upstream/sourceStatements').SourceStatement) => ReturnFlow])[] = [
  ['return', statement => ({ returns: [statement.expression], canFallThrough: false })],
  ['return_void', () => ({ returns: [], canFallThrough: false })],
  ['conditional', statement => {
    const whenTrue = returnFlow(statement.branches.whenTrue);
    return relationGate(Object.is(statement.branches.kind, 'then_only'), () => ({ returns: whenTrue.returns, canFallThrough: true }), () => {
      const whenFalse = returnFlow(statement.branches.whenFalse);
      return { returns: [...whenTrue.returns, ...whenFalse.returns], canFallThrough: relationAny([whenTrue.canFallThrough, whenFalse.canFallThrough]) };
    });
  }],
  ['for_each', statement => { const nested = returnFlow(statement.body); return { returns: nested.returns, canFallThrough: true }; }],
  ['for_loop', statement => { const nested = returnFlow(statement.body); return { returns: nested.returns, canFallThrough: true }; }],
  ['transaction', statement => returnFlow(statement.body)],
  ['try', statement => {
    const body = returnFlow(statement.body);
    const catches = returnFlowCatchItems(statement.catches.items);
    return { returns: [...body.returns, ...catches.returns], canFallThrough: relationAny([body.canFallThrough, catches.canFallThrough]) };
  }],
  ['throw', () => ({ returns: [], canFallThrough: false })],
  ['abort', () => ({ returns: [], canFallThrough: false })],
];

function returnFlowStatement(statement: import('../../../types/upstream/sourceStatements').SourceStatement): ReturnFlow {
  return relationOptionFold(relationLookup(returnFlowCatalog, statement.kind), () => ({ returns: [], canFallThrough: true }), resolver => resolver(statement));
}

function resolvedReturnExpressions(statements: import('../../../types/upstream/sourceStatements').SourceStatements): readonly import('../../../types/upstream/expression').ResolvedExpression[] {
  return returnFlow(statements).returns;
}

function semanticResultSummary(result: ServiceMethod['result']): Option<SemanticValue> {
  return relationGate(Object.is(result.kind, 'void'), () => ({ kind: 'none' }), () => semanticResultSummaryItems(result.items));
}

function semanticResultSummaryItems(items: import('../../../types/upstream/collections').Sequence<{ readonly result: SemanticValue }>): Option<SemanticValue> {
  return relationGate(Object.is(items.kind, 'empty'), () => ({ kind: 'none' }), () => ({ kind: 'some', value: unionSemanticValueSequence(items.head.result, items.tail) }));
}

function unionSemanticValueSequence(current: SemanticValue, items: import('../../../types/upstream/collections').Sequence<{ readonly result: SemanticValue }>): SemanticValue {
  return relationGate(Object.is(items.kind, 'empty'), () => current, () => unionSemanticValueSequence(unionSemanticValues(current, items.head.result), items.tail));
}

function unionSemanticValues(left: SemanticValue, right: SemanticValue): SemanticValue {
  return {
    kind: 'union',
    members: {
      kind: 'semantic_values',
      items: sequence([left, right]),
    },
  };
}

function method(methodAst: PhpMethodAst, file: string, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): ServiceMethod {
  const parameterTypes = relationFold(methodAst.parameters, [] as RelationIndex<import('../../../types/upstream/names').VariableName, DeclaredType>, (current, item) => relationIndexAdd(
    current,
    { kind: 'variable_name', value: stringValue(item.name) },
    declaredType(item.type),
  ));
  const body = serviceSourceStatements(methodAst.body, file, parameterTypes, models, methodResults);
  const returned = resolvedReturnExpressions(body);
  const result = relationGate(Object.is(returned.length, 0), () => ({ kind: 'void' as const }), () => ({ kind: 'expressions' as const, items: sequence(returned) }));
  const declaredReturnType = relationGate(Object.is(methodAst.declaredReturnType.kind, 'absent'), () => ({ kind: 'absent' as const }), () => ({ kind: 'declared' as const, type: declaredType(methodAst.declaredReturnType.type) }));
  return {
    kind: 'service_method',
    name: { kind: 'action_name', value: stringValue(methodAst.name) },
    parameters: { kind: 'service_parameters', items: sequence(relationProject(methodAst.parameters, item => parameter(item, file))) },
    declaredReturnType,
    body,
    result,
    source: source(file, Number(methodAst.source.line)),
  };
}

function className(tokens: readonly { readonly value: string }[]): string {
  const index = relationIndexOf(tokens, token => Object.is(token.value, 'class'));
  const next = relationAdvanceIndex(index, 1);
  return relationGate(relationAll([index >= 0, next < tokens.length]), () => tokens[next].value, () => { throw Error('Service class declaration not found'); });
}

function parameterDependencyFact(methodItem: PhpMethodAst, item: PhpMethodAst['parameters'][number], syntax: ServiceDeclarationAst, span: SourceSpan): readonly ServiceDependencyFact[] {
  const expression = relationGate(Object.is(item.type.kind, 'nullable'), () => item.type.inner, () => item.type);
  return relationGate(Object.is(expression.kind, 'named'), () => {
    const self = classNameEquals({ kind: 'class_name', value: stringValue(expression.name) }, { kind: 'class_name', value: stringValue(syntax.className) });
    return relationGate(self, () => [], () => [{
      kind: 'service_dependency_fact' as const,
      target: { kind: 'class_name' as const, value: stringValue(expression.name) },
      originMethod: { kind: 'action_name' as const, value: stringValue(methodItem.name) },
      source: { kind: 'source_span' as const, file: span.file, start: { kind: 'number_value' as const, value: Number(item.source.line) }, end: { kind: 'number_value' as const, value: Number(item.source.line) } },
    }]);
  }, () => []);
}

function dependencyFactsForMethods(methods: readonly PhpMethodAst[], syntax: ServiceDeclarationAst, span: SourceSpan): readonly ServiceDependencyFact[] {
  return relationExpand(methods, methodItem => relationProject(methodItem.parameters, item => parameterDependencyFact(methodItem, item, syntax, span)));
}

function bodyDependencyFactsForMethod(methodItem: PhpMethodAst, span: SourceSpan): readonly ServiceDependencyFact[] {
  const parameterModels = parameterModelTypes(methodItem);
  return relationExpand(methodItem.body, statement => relationExpand(serviceSourceStatements(statement), rawExpression => {
    const upstream = mapResourcePhpAstToUpstream(rawExpression, span.file.value.value);
    const targets = collectTypedParameterModels(upstream, parameterModels, []);
    return relationProject(targets, target => ({
      kind: 'service_dependency_fact' as const,
      target,
      originMethod: { kind: 'action_name' as const, value: stringValue(methodItem.name) },
      source: upstream.source,
    }));
  }));
}

export function buildServiceAstFromSource(syntax: ServiceDeclarationAst, span: SourceSpan, models: ModelSymbolTable): ServiceAst {
  const seed: { readonly methods: readonly ServiceMethod[]; readonly results: ServiceMethodResultIndex } = {
    methods: Object.freeze([]),
    results: { kind: 'service_method_result_index', items: { kind: 'empty' } },
  };
  const settled = relationFixedPoint(seed, state => {
    const methods = relationProject(syntax.methods, item => method(item, span.file.value.value, models, state.results));
    const entries = relationExpand(methods, serviceMethod => relationOptionFold(semanticResultSummary(serviceMethod.result), () => [], summary => [{ kind: 'service_method_result_entry' as const, method: serviceMethod.name, result: summary }]));
    return { methods, results: { kind: 'service_method_result_index', items: sequence(entries) } };
  }, (left, right) => isDeepStrictEqual(left.results, right.results));
  const methods = settled.value.methods;
  const dependencyFacts = dependencyFactsForMethods(syntax.methods, syntax, span);
  const bodyFacts = relationExpand(syntax.methods, methodItem => bodyDependencyFactsForMethod(methodItem, span));
  const definition: ServiceDefinition = {
    kind: 'service_definition', name: { kind: 'class_name', value: stringValue(syntax.className) }, file: span.file,
    methods: { kind: 'service_methods', items: sequence(methods) }, dependencies: { kind: 'service_dependency_facts', items: sequence([...dependencyFacts, ...bodyFacts]) }, source: span,
  };
  return createDomainAstJudgment({ kind: 'service_ast', semantic: definition, source: span });
}

export async function scanServiceAsts(sourceProject: SourceProjectIdentity, models: ModelSymbolTable): Promise<readonly ServiceAst[]> {
  const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Services');
  const files = await collectPhpFiles(directory);
  const { serviceProducer } = await import('./serviceProducer');
  const asts = await relationAsyncFold(files, Object.freeze([]) as readonly ServiceAst[], async (current, file) => {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const parsedMethods = relationFold(tokens, Object.freeze([]) as readonly PhpMethodAst[], (parsed, token, index) =>
      relationGate(Object.is(token.value, 'function'), () => [...parsed, parsePhpMethodOrThrow(text, tokens, index)], () => parsed),
    );
    const syntax: ServiceDeclarationAst = { kind: 'service_declaration_ast', className: createAstIdentifier(className(tokens)), methods: parsedMethods };
    const firstLine = relationGate(tokens.length > 0, () => tokens[0].line, () => 1);
    const span = source(file, Number(firstLine));
    return [...current, serviceProducer.produce({ syntax, source: span, models })];
  });
  return Object.freeze(asts);
}
