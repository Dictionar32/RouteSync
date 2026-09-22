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
import { parsePhpMethod } from '../lexer/phpMethodParser';
import type { ServiceAst } from '../../../types/upstream/ast';
import type { ServiceDefinition, ServiceMethod, ServiceParameter, ServiceDependencyFact, ServiceMethodResultIndex, ServiceMethodResultEntry } from '../../../types/upstream/service';
import type { DeclaredType, TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { SemanticValue } from '../../../types/upstream/primitiveVocabulary';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { Option, Sequence } from '../../../types/upstream/collections';
import type { StringValue } from '../../../types/upstream/valueObjects';
import type { ModelSymbolTable } from '../symbols/ModelSymbolTable';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

function typeExpression(type: PhpParameterTypeAst): TypeExpression {
  switch (type.kind) {
    case 'primitive':
      switch (type.name) {
        case 'bool': return { kind: 'primitive', value: { kind: 'boolean' } };
        case 'string': return { kind: 'primitive', value: { kind: 'string' } };
        case 'float':
        case 'int': return { kind: 'primitive', value: { kind: 'number' } };
        case 'mixed': return { kind: 'mixed' };
        case 'array': return { kind: 'primitive', value: { kind: 'unspecified' } };
      }
    case 'named':
      return { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(type.name) } } };
    case 'nullable':
      return { kind: 'nullable', value: typeExpression(type.inner) };
  }
}

function declaredType(type: PhpParameterTypeAst): DeclaredType {
  const nullable = type.kind === 'nullable';
  return { kind: 'declared_type', value: typeExpression(type), nullability: nullable ? { kind: 'nullable' } : { kind: 'non_nullable' } };
}


function parameterModelTypes(method: PhpMethodAst): Map<import('../../../types/upstream/names').VariableName, import('../../../types/upstream/names').ClassName> {
  const models = new Map<import('../../../types/upstream/names').VariableName, import('../../../types/upstream/names').ClassName>();
  for (const parameter of method.parameters) {
    const type = parameter.type.kind === 'nullable' ? parameter.type.inner : parameter.type;
    if (type.kind === 'named') models.set({ kind: 'variable_name', value: stringValue(parameter.name) }, { kind: 'class_name', value: stringValue(type.name) });
  }
  return models;
}

function collectTypedParameterModels(expression: import('../../../types/upstream/expression').Expression, parameterModels: Map<import('../../../types/upstream/names').VariableName, import('../../../types/upstream/names').ClassName>, targets: import('../../../types/upstream/names').ClassName[]): void {
  const visit = (value: import('../../../types/upstream/expression').Expression): void => {
    switch (value.kind) {
      case 'variable':
        for (const [name, model] of parameterModels) if (name.value.value === value.name.value.value) targets.push(model);
        return;
      case 'property': case 'relation': case 'nullsafe_property': case 'method': case 'nullsafe_method':
        visit(value.receiver);
        if ('arguments' in value) { let args = value.arguments.items; while (args.kind === 'cons') { visit(args.head); args = args.tail; } }
        return;
      case 'binary': visit(value.left); visit(value.right); return;
      case 'unary': visit(value.operand); return;
      case 'conditional': visit(value.condition); visit(value.branches.whenTrue); if (value.branches.kind === 'then_else') visit(value.branches.whenFalse); return;
      case 'coalesce': visit(value.left); visit(value.right); return;
      case 'index': visit(value.receiver); visit(value.key); return;
      case 'array': for (const entry of value.entries) { visit(entry.value); if (entry.kind === 'keyed') visit(entry.key); } return;
      case 'object': { let properties = value.properties.items; while (properties.kind === 'cons') { visit(properties.head.value); properties = properties.tail; } return; }
      case 'match': visit(value.subject); let arms = value.arms.items; while (arms.kind === 'cons') { const arm = arms.head; if (arm.kind === 'conditional') { let conditions = arm.conditions.items; while (conditions.kind === 'cons') { visit(conditions.head); conditions = conditions.tail; } } visit(arm.result); arms = arms.tail; } return;
      case 'builtin': case 'call': case 'static_method': { let args = value.arguments.items; while (args.kind === 'cons') { visit(args.head); args = args.tail; } return; }
      case 'cast': visit(value.expression); return;
      default: return;
    }
  };
  visit(expression);
}

function assignmentTargetExpressions(target: import('../lexer/phpAstStatementTypes').PhpAssignmentTarget): readonly import('../lexer/phpAstExpressionTypes').PhpAstValue[] {
  switch (target.kind) {
    case 'variable': case 'variables': return [];
    case 'property': return [target.receiver];
    case 'array_element': return [target.target, target.index];
  }
}

function bodyExpressions(statement: import('../lexer/phpAstStatementTypes').PhpStatement): readonly import('../lexer/phpAstExpressionTypes').PhpAstValue[] {
  switch (statement.kind) {
    case 'expression_statement': return [statement.expression];
    case 'return_with_value': return [statement.expression];
    case 'return_void': return [];
    case 'assignment': return [statement.value, ...assignmentTargetExpressions(statement.target)];
    case 'if_statement': return [statement.condition, ...statement.thenBlock.statements.flatMap(bodyExpressions), ...(statement.alternative.kind === 'else_block' ? statement.alternative.block.statements.flatMap(bodyExpressions) : statement.alternative.kind === 'else_if' ? bodyExpressions(statement.alternative.statement) : [])];
    case 'foreach_statement': return [statement.iterable, ...statement.body.statements.flatMap(bodyExpressions)];
    case 'for_statement': return [...phpForClauseExpressions(statement.initializer), ...phpForClauseExpressions(statement.condition), ...phpForClauseExpressions(statement.update), ...statement.body.statements.flatMap(bodyExpressions)];
    case 'try_statement': return [...statement.body.statements.flatMap(bodyExpressions), ...statement.catches.flatMap(item => item.body.statements.flatMap(bodyExpressions)), ...(statement.finallyBlock.kind === 'present' ? statement.finallyBlock.block.statements.flatMap(bodyExpressions) : [])];
    case 'throw_statement': return [statement.expression];
  }
}

function phpForClauseExpressions(clause: import('../lexer/phpAstStatementTypes').PhpForClause): readonly import('../lexer/phpAstExpressionTypes').PhpAstValue[] {
  switch (clause.kind) {
    case 'empty': return [];
    case 'expression': return [clause.value];
    case 'assignment': return [clause.value];
  }
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
    defaultValue: parameter.defaultValue.kind === 'absent'
      ? { kind: 'absent' }
      : { kind: 'present', value: mapResourcePhpAstToUpstream(parameter.defaultValue.value, file) },
    source: span,
  };
}

type ReturnFlow = {
  readonly returns: readonly import('../../../types/upstream/expression').ResolvedExpression[];
  readonly canFallThrough: boolean;
};

function returnFlow(statements: import('../../../types/upstream/sourceStatements').SourceStatements): ReturnFlow {
  const returns: import('../../../types/upstream/expression').ResolvedExpression[] = [];
  let canFallThrough = true;
  let items = statements.items;
  while (items.kind === 'cons' && canFallThrough) {
    const statement = items.head;
    switch (statement.kind) {
      case 'return':
        returns.push(statement.expression);
        canFallThrough = false;
        break;
      case 'return_void':
        canFallThrough = false;
        break;
      case 'conditional': {
        const whenTrue = returnFlow(statement.branches.whenTrue);
        returns.push(...whenTrue.returns);
        if (statement.branches.kind === 'then_only') {
          canFallThrough = true;
          break;
        }
        const whenFalse = returnFlow(statement.branches.whenFalse);
        returns.push(...whenFalse.returns);
        canFallThrough = whenTrue.canFallThrough || whenFalse.canFallThrough;
        break;
      }
      case 'for_each': {
        const nested = returnFlow(statement.body);
        returns.push(...nested.returns);
        canFallThrough = true;
        break;
      }
      case 'for_loop': {
        const nested = returnFlow(statement.body);
        returns.push(...nested.returns);
        canFallThrough = true;
        break;
      }
      case 'transaction': {
        const nested = returnFlow(statement.body);
        returns.push(...nested.returns);
        canFallThrough = nested.canFallThrough;
        break;
      }
      case 'try': {
        const body = returnFlow(statement.body);
        returns.push(...body.returns);
        let catches = statement.catches.items;
        let catchesCanFallThrough = false;
        while (catches.kind === 'cons') {
          const caught = returnFlow(catches.head.body);
          returns.push(...caught.returns);
          catchesCanFallThrough = catchesCanFallThrough || caught.canFallThrough;
          catches = catches.tail;
        }
        canFallThrough = body.canFallThrough || catchesCanFallThrough;
        break;
      }
      case 'throw':
      case 'abort':
        canFallThrough = false;
        break;
      default:
        break;
    }
    items = items.tail;
  }
  return { returns, canFallThrough };
}

function resolvedReturnExpressions(statements: import('../../../types/upstream/sourceStatements').SourceStatements): readonly import('../../../types/upstream/expression').ResolvedExpression[] {
  return returnFlow(statements).returns;
}

function semanticResultSummary(result: ServiceMethod['result']): Option<SemanticValue> {
  if (result.kind === 'void') return { kind: 'none' };
  let items = result.items;
  const values: SemanticValue[] = [];
  while (items.kind === 'cons') {
    values.push(items.head.result);
    items = items.tail;
  }
  if (values.length === 0) return { kind: 'none' };
  let summary = values[0];
  for (let index = 1; index < values.length; index += 1) summary = unionSemanticValues(summary, values[index]);
  return { kind: 'some', value: summary };
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

function method(method: PhpMethodAst, file: string, models: ModelSymbolTable, methodResults: ServiceMethodResultIndex): ServiceMethod {
  const body = serviceSourceStatements(
    method.body,
    file,
    new Map(method.parameters.map(parameter => [{ kind: 'variable_name', value: stringValue(parameter.name) }, declaredType(parameter.type)])),
    models,
    methodResults,
  );
  const returned = resolvedReturnExpressions(body);
  const result = returned.length === 0
    ? { kind: 'void' as const }
    : {
        kind: 'expressions' as const,
        items: sequence(returned),
      };
  return {
    kind: 'service_method',
    name: { kind: 'action_name', value: stringValue(method.name) },
    parameters: { kind: 'service_parameters', items: sequence(method.parameters.map(item => parameter(item, file))) },
    declaredReturnType: method.declaredReturnType.kind === 'absent'
      ? { kind: 'absent' }
      : { kind: 'declared', type: declaredType(method.declaredReturnType.type) },
    body,
    result,
    source: source(file, Number(method.source.line)),
  };
}

function className(tokens: readonly { readonly value: string }[]): string {
  for (let i = 0; i + 1 < tokens.length; i += 1) if (tokens[i].value === 'class') return tokens[i + 1].value;
  throw new Error('Service class declaration not found');
}

export async function scanServiceAsts(sourceProject: SourceProjectIdentity, models: ModelSymbolTable): Promise<readonly ServiceAst[]> {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Services');
  const files = await collectPhpFiles(directory);
  const asts: ServiceAst[] = [];
  for (const file of files) {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const parsedMethods: PhpMethodAst[] = [];
    for (let index = 0; index < tokens.length; index += 1) {
      if (tokens[index].value !== 'function') continue;
      const parsed = parsePhpMethod(text, tokens, index);
      if (parsed === undefined) {
        throw new Error(`Service method parse gap in ${file}:${tokens[index].line}: function declaration could not be parsed`);
      }
      parsedMethods.push(parsed);
    }
    const declaration = { className: createAstIdentifier(className(tokens)), methods: parsedMethods, source: tokens[0] };
    const span = source(file, Number(declaration.source.line));
    let methodResults: ServiceMethodResultIndex = { kind: 'service_method_result_index', items: { kind: 'empty' } };
    let methods = declaration.methods.map(item => method(item, file, models, methodResults));
    let changed = true;
    while (changed) {
      const nextEntries: ServiceMethodResultEntry[] = [];
      for (const serviceMethod of methods) {
        const summary = semanticResultSummary(serviceMethod.result);
        if (summary.kind === 'some') nextEntries.push({ kind: 'service_method_result_entry', method: serviceMethod.name, result: summary.value });
      }
      const nextResults: ServiceMethodResultIndex = { kind: 'service_method_result_index', items: sequence(nextEntries) };
      changed = false;
      changed = !isDeepStrictEqual(methodResults, nextResults);
      methodResults = nextResults;
      if (changed) methods = declaration.methods.map(item => method(item, file, models, methodResults));
    }
    const dependencyFacts: ServiceDependencyFact[] = declaration.methods.flatMap(methodItem =>
      methodItem.parameters.flatMap(item => {
        const type = item.type;
        const expression = type.kind === 'nullable' ? type.inner : type;
        if (expression.kind !== 'named') return [];
        if (classNameEquals({ kind: 'class_name', value: stringValue(expression.name) }, { kind: 'class_name', value: stringValue(declaration.className) })) return [];
        return [{
          kind: 'service_dependency_fact' as const,
          target: { kind: 'class_name', value: stringValue(expression.name) },
          originMethod: { kind: 'action_name' as const, value: stringValue(methodItem.name) },
          source: {
            kind: 'source_span' as const,
            file: { kind: 'source_file' as const, value: stringValue(file) },
            start: { kind: 'number_value' as const, value: Number(item.source.line) },
            end: { kind: 'number_value' as const, value: Number(item.source.line) },
          }
        }];
      })
    );
    const bodyFacts: ServiceDependencyFact[] = declaration.methods.flatMap(methodItem => {
      const parameterModels = parameterModelTypes(methodItem);
      return methodItem.body.statements.flatMap(statement =>
        bodyExpressions(statement).flatMap(rawExpression => {
          const upstream = mapResourcePhpAstToUpstream(rawExpression, file);
          const targets: import('../../../types/upstream/names').ClassName[] = [];
          collectTypedParameterModels(upstream, parameterModels, targets);
          return targets.map(target => ({
            kind: 'service_dependency_fact' as const,
            target,
            originMethod: { kind: 'action_name' as const, value: stringValue(methodItem.name) },
            source: upstream.source,
          }));
        })
      );
    });
    const allDependencyFacts = [...dependencyFacts, ...bodyFacts];

    const definition: ServiceDefinition = {
      kind: 'service_definition',
      name: { kind: 'class_name', value: stringValue(declaration.className) },
      file: { kind: 'source_file', value: stringValue(file) },
      methods: { kind: 'service_methods', items: sequence(methods) },
      dependencies: { kind: 'service_dependency_facts', items: sequence(allDependencyFacts) },
      source: span,
    };
    asts.push({ kind: 'service_ast', definition, source: span });
  }
  return Object.freeze(asts);
}
