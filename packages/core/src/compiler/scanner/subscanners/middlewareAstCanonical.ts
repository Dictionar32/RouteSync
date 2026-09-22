import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';
import { controllerAstFromMethod } from './controller/controllerAstCanonical';
import type { MiddlewareAst } from '../../../types/upstream/ast';
import type { MiddlewareDefinition } from '../../../types/upstream/application';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

function className(tokens: readonly { readonly value: string }[]): string {
  for (let index = 0; index + 1 < tokens.length; index += 1) {
    if (tokens[index].value === 'class') return tokens[index + 1].value;
  }
  throw new Error('Middleware class declaration not found');
}

export async function scanMiddlewareAsts(sourceProject: SourceProjectIdentity): Promise<readonly MiddlewareAst[]> {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'Middleware');
  const files = await collectPhpFiles(directory);
  const asts: MiddlewareAst[] = [];

  for (const file of files) {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const name = className(tokens);
    const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name));
    const handle = declaration.methods.find(method => method.name === 'handle');
    if (!handle) throw new Error(`Middleware handle method not found: ${file}`);
    const action = controllerAstFromMethod(handle, name, file, { kind: 'response_absent' }).action;
    const span = source(file, Number(declaration.source.line));
    const definition: MiddlewareDefinition = {
      kind: 'middleware',
      name: { kind: 'class_name', value: stringValue(name) },
      file: { kind: 'source_file', value: stringValue(file) },
      handle: action,
      source: span,
    };
    asts.push({ kind: 'middleware_ast', definition, source: span });
  }

  return Object.freeze(asts);
}
