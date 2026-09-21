import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';
import { mapClosureBody } from './resource/resourceUpstreamExpressionClosure';
import type { ClosureStatement } from '../../../types/upstream/expression';
import type { ProviderAst } from '../../../types/upstream/ast';
import type { ProviderDefinition } from '../../../types/upstream/application';
import type { Expression } from '../../../types/upstream/expression';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import type { ControllerMethodAst } from '../lexer/controllerAstTypes';
import type { PhpStatement } from '../lexer/phpAstTypes';

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
  throw new Error('Provider class declaration not found');
}

function methodExpression(method: ControllerMethodAst, file: string): Expression {
  const methodSource = source(file, Number(method.source.line));
  return {
    kind: 'closure',
    value: {
      kind: 'closure',
      parameters: { kind: 'variable_names', items: { kind: 'empty' } },
      captures: { kind: 'closure_captures', items: { kind: 'empty' } },
      body: mapClosureBody(method.body.statements, file, mapResourcePhpAstToUpstream),
      source: methodSource,
    },
    source: methodSource,
  };
}

function scanProvider(file: string, text: string): ProviderAst {
  const tokens = LaravelSourceLexer.tokenize(text);
  const name = className(tokens);
  const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name));
  const register = declaration.methods.find(method => method.name === 'register');
  const boot = declaration.methods.find(method => method.name === 'boot');
  if (!register || !boot) throw new Error(`Provider register/boot methods not found: ${file}`);
  const span = source(file, Number(declaration.source.line));
  const definition: ProviderDefinition = {
    kind: 'provider',
    name: { kind: 'class_name', value: stringValue(name) },
    file: { kind: 'source_file', value: stringValue(file) },
    register: methodExpression(register, file),
    boot: methodExpression(boot, file),
    source: span,
  };
  return { kind: 'provider_ast', definition, source: span };
}

export async function scanProviderAsts(projectRoot: string): Promise<readonly ProviderAst[]> {
  const directory = path.join(projectRoot, 'app', 'Providers');
  const files = await collectPhpFiles(directory);
  const asts: ProviderAst[] = [];
  for (const file of files) asts.push(scanProvider(file, await readSourceText(file)));
  return Object.freeze(asts);
}
