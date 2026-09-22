import path from 'path';
import * as fs from 'node:fs';
import type { ResponseAst } from '../../../types/upstream/ast';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { ResponseDtoDeclarationAst, PhpPropertyTypeAst } from '../lexer/responseDtoAstTypes';
import type { Sequence } from '../../../types/upstream/collections';
import type { TypeExpression, TypeProperty } from '../../../types/upstream/typeVocabulary';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';
import { createPropertyName, createResponseTypeName } from '../../../types/upstream/names';

import { readSourceText } from './scannerUtils';
const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const span = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>(
  (tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' }
);

function typeExpression(type: PhpPropertyTypeAst, file: string): TypeExpression {
  let value: TypeExpression;
  switch (type.kind) {
    case 'primitive':
      value = { kind: 'primitive', value: type.name === 'bool' ? { kind: 'boolean' } : type.name === 'int' || type.name === 'float' ? { kind: 'number' } : { kind: 'string' } };
      break;
    case 'mixed': value = { kind: 'mixed' }; break;
    case 'named': value = { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(type.name) } } }; break;
  }
  return type.nullable ? { kind: 'nullable', value } : value;
}

function definition(ast: ResponseDtoDeclarationAst, file: string): ResponseAst {
  const properties: readonly TypeProperty[] = ast.properties.map(property => ({
    kind: 'type_property',
    name: createPropertyName(property.name),
    type: typeExpression(property.type, file),
    source: span(file, Number(property.source.line)),
  }));
  const output: TypeExpression = { kind: 'object', properties: { kind: 'type_properties', items: sequence(properties) } };
  const source = span(file, Number(ast.source.line));
  return {
    kind: 'response_ast',
    definition: { kind: 'response', typeName: createResponseTypeName(ast.className), output, source },
    source,
  };
}

function className(tokens: readonly { readonly value: string }[]): string {
  for (let index = 0; index + 1 < tokens.length; index += 1) {
    if (tokens[index].value === 'class') return tokens[index + 1].value;
  }
  throw new Error('Response DTO class declaration not found');
}

export async function scanResponseAsts(sourceProject: SourceProjectIdentity): Promise<readonly ResponseAst[]> {
  const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'DTOs');
  const files = await collectPhpFiles(directory);
  const asts: ResponseAst[] = [];
  for (const file of files) {
    const source = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(source);
    const ast = LaravelSourceLexer.parseResponseDtoDeclaration(tokens, createAstIdentifier(className(tokens)));
    asts.push(definition(ast, file));
  }
  return Object.freeze(asts);
}
