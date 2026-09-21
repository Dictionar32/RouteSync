import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';
import { mapClosureBody } from './resource/resourceUpstreamExpressionClosure';
import type { AttributeAst } from '../../../types/upstream/ast';
import type { AttributeDefinition } from '../../../types/upstream/application';
import type { Expression } from '../../../types/upstream/expression';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import type { Sequence } from '../../../types/upstream/collections';
import type { ControllerMethodAst } from '../lexer/controllerAstTypes';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

function className(tokens: readonly { readonly value: string }[]): string {
  for (let index = 0; index + 1 < tokens.length; index += 1) if (tokens[index].value === 'class') return tokens[index + 1].value;
  throw new Error('Attribute class declaration not found');
}

function constructorExpression(method: ControllerMethodAst, file: string): Expression {
  const methodSource = source(file, Number(method.source.line));
  return {
    kind: 'closure',
    value: {
      kind: 'closure',
      parameters: {
        kind: 'variable_names',
        items: sequence(method.parameters.map(parameter => ({ kind: 'variable_name' as const, value: stringValue(parameter.name) }))),
      },
      captures: { kind: 'closure_captures', items: { kind: 'empty' } },
      body: mapClosureBody(method.body.statements, file, mapResourcePhpAstToUpstream),
      source: methodSource,
    },
    source: methodSource,
  };
}

function scanAttribute(file: string, text: string): AttributeAst {
  const tokens = LaravelSourceLexer.tokenize(text);
  const name = className(tokens);
  const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name));
  const constructor = declaration.methods.find(method => method.name === '__construct');
  if (!constructor) throw new Error(`Attribute constructor not found: ${file}`);
  const span = source(file, Number(declaration.source.line));
  const definition: AttributeDefinition = {
    kind: 'attribute',
    name: { kind: 'class_name', value: stringValue(name) },
    file: { kind: 'source_file', value: stringValue(file) },
    constructor: constructorExpression(constructor, file),
    source: span,
  };
  return { kind: 'attribute_ast', definition, source: span };
}

export async function scanAttributeAsts(projectRoot: string): Promise<readonly AttributeAst[]> {
  const directory = path.join(projectRoot, 'app', 'Attributes');
  const files = await collectPhpFiles(directory);
  const asts: AttributeAst[] = [];
  for (const file of files) asts.push(scanAttribute(file, await readSourceText(file)));
  return Object.freeze(asts);
}
