import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { collectPhpFiles } from './scannerUtils';
import type { AttributeAst } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import { attributeProducer } from './attributeProducer';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

function className(tokens: readonly { readonly value: string }[]): string {
  for (let index = 0; index + 1 < tokens.length; index += 1) if (tokens[index].value === 'class') return tokens[index + 1].value;
  throw new Error('Attribute class declaration not found');
}

function scanAttribute(file: string, text: string): AttributeAst {
  const tokens = LaravelSourceLexer.tokenize(text);
  const name = className(tokens);
  const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name));
  const span = source(file, Number(declaration.source.line));
  return attributeProducer.produce({ declaration, source: span });
}

export async function scanAttributeAsts(sourceProject: SourceProjectIdentity): Promise<readonly AttributeAst[]> {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Attributes');
  const files = await collectPhpFiles(directory);
  const asts: AttributeAst[] = [];
  for (const file of files) asts.push(scanAttribute(file, await readSourceText(file)));
  return Object.freeze(asts);
}
