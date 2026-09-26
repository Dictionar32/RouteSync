import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { parseResponseDtoDeclaration } from '../lexer/responseDtoDeclarationParser';
import { collectPhpFiles } from './scannerUtils';
import type { DtoAst } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import { dtoProducer } from './dtoProducer';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

export async function scanDtoAsts(sourceProject: SourceProjectIdentity): Promise<readonly DtoAst[]> {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'DTOs');
  const files = await collectPhpFiles(directory);
  const asts: DtoAst[] = [];
  for (const file of files) {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const classToken = tokens.find((token, index) => token.value === 'class' && tokens[index + 1]);
    if (!classToken) throw new Error(`DTO class declaration not found: ${file}`);
    const className = createAstIdentifier(tokens[tokens.indexOf(classToken) + 1].value);
    const declaration = parseResponseDtoDeclaration(tokens, className);
    const span = source(file, Number(declaration.source.line));
    asts.push(dtoProducer.produce({ declaration, source: span }));
  }
  return Object.freeze(asts);
}
