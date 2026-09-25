import path from 'path';
import type { ResponseAst } from '../../../types/upstream/ast';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { ResponseDtoDeclarationAst } from '../lexer/responseDtoAstTypes';
import { responseProducer } from './responseProducer';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';

import { readSourceText } from './scannerUtils';
const span = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

function primitiveType(name: PhpPropertyTypeAst['name']): TypeExpression {
  switch (name) {
    case 'bool': return { kind: 'primitive', value: { kind: 'boolean' } };
    case 'int':
    case 'float': return { kind: 'primitive', value: { kind: 'number' } };
    case 'string': return { kind: 'primitive', value: { kind: 'string' } };
  }
}

function typeExpression(type: PhpPropertyTypeAst): TypeExpression {
  let value: TypeExpression;
  switch (type.kind) {
    case 'primitive': value = primitiveType(type.name); break;
    case 'mixed': value = { kind: 'mixed' }; break;
    case 'named': value = { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(type.name) } } }; break;
  }
  if (type.nullable) return { kind: 'nullable', value };
  return value;
}

const defaultResponseStatus: HttpStatusCode = {
  kind: 'http_status_code',
  value: { kind: 'number_value', value: 200 },
};

const emptyTransport = (): import('../../../types/upstream/response').ResponseTransport => ({
  kind: 'response_transport',
  headers: { kind: 'empty' },
  cookies: { kind: 'empty' },
});

function definition(ast: ResponseDtoDeclarationAst, file: string): ResponseAst {
  return responseProducer.produce({ kind: 'dto', declaration: ast, source: span(file, Number(ast.source.line)) });
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
  const controllerDirectory = path.join(sourceRoot, 'app', 'Http', 'Controllers');
  const files = await collectPhpFiles(directory);
  const controllerFiles = await collectPhpFiles(controllerDirectory);
  const asts: ResponseAst[] = [];
  for (const file of files) {
    const source = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(source);
    const ast = LaravelSourceLexer.parseResponseDtoDeclaration(tokens, createAstIdentifier(className(tokens)));
    asts.push(definition(ast, file));
  }
  for (const file of controllerFiles) {
    const source = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(source);
    const declaration = LaravelSourceLexer.parseControllerDeclaration(source, tokens, createAstIdentifier(path.basename(file, '.php')));
    for (const method of declaration.methods) {
      if (method.returns.length === 0) continue;
      const sourceSpan = span(file, Number(method.source.line));
      asts.push(responseProducer.produce({ kind: 'controller', method, source: sourceSpan }));
    }
  }
  return Object.freeze(asts);
}
