import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';
import { controllerStatements, resolvedExpression } from './controller/controllerAstCanonical';
import type { ControllerMethodAst, PhpParameterTypeAst } from '../lexer/controllerAstTypes';
import type { ServiceAst } from '../../../types/upstream/ast';
import type { ServiceDefinition, ServiceMethod, ServiceParameter } from '../../../types/upstream/service';
import type { DeclaredType, TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { Sequence } from '../../../types/upstream/collections';
import type { StringValue } from '../../../types/upstream/valueObjects';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

function typeExpression(type: PhpParameterTypeAst): TypeExpression {
  switch (type.kind) {
    case 'primitive':
      return { kind: 'primitive', value: type.name === 'bool' ? { kind: 'boolean' } : type.name === 'string' ? { kind: 'string' } : type.name === 'float' || type.name === 'int' ? { kind: 'number' } : { kind: 'json' } };
    case 'named':
      return { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(type.name) } } };
    case 'nullable':
      return { kind: 'nullable', value: typeExpression(type.inner) };
  }
}

function declaredType(type: PhpParameterTypeAst): DeclaredType {
  const nullable = type.kind === 'nullable';
  return { kind: 'declared_type', value: typeExpression(type), nullability: nullable ? { kind: 'nullable' } : { kind: 'non_null' } };
}

function parameter(parameter: ControllerMethodAst['parameters'][number], file: string): ServiceParameter {
  return { kind: 'service_parameter', name: { kind: 'variable_name', value: stringValue(parameter.name) }, type: declaredType(parameter.type), source: source(file, 0) };
}

function method(method: ControllerMethodAst, file: string): ServiceMethod {
  const result = method.returns.length === 0
    ? { kind: 'void' as const }
    : { kind: 'expression' as const, expression: resolvedExpression(method.returns[method.returns.length - 1].expression, method, file, method.returns.length - 1) };
  return {
    kind: 'service_method',
    name: { kind: 'action_name', value: stringValue(method.name) },
    parameters: { kind: 'service_parameters', items: sequence(method.parameters.map(item => parameter(item, file))) },
    body: controllerStatements(method.body.statements, file, method),
    result,
    source: source(file, Number(method.source.line)),
  };
}

function className(tokens: readonly { readonly value: string }[]): string {
  for (let i = 0; i + 1 < tokens.length; i += 1) if (tokens[i].value === 'class') return tokens[i + 1].value;
  throw new Error('Service class declaration not found');
}

export async function scanServiceAsts(projectRoot: string): Promise<readonly ServiceAst[]> {
  const directory = path.join(projectRoot, 'app', 'Services');
  const files = await collectPhpFiles(directory);
  const asts: ServiceAst[] = [];
  for (const file of files) {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(className(tokens)));
    const span = source(file, Number(declaration.source.line));
    const definition: ServiceDefinition = {
      kind: 'service_definition',
      name: { kind: 'class_name', value: stringValue(declaration.className) },
      file: { kind: 'source_file', value: stringValue(file) },
      methods: { kind: 'service_methods', items: sequence(declaration.methods.map(item => method(item, file))) },
      source: span,
    };
    asts.push({ kind: 'service_ast', definition, source: span });
  }
  return Object.freeze(asts);
}
