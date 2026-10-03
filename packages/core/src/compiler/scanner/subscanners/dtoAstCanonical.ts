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
import { relationFirst, relationOptionFold, relationProject, relationAsyncFold, relationAt, relationAdvanceIndex } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

export async function scanDtoAsts(sourceProject: SourceProjectIdentity): Promise<readonly DtoAst[]> {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'DTOs');
  const files = await collectPhpFiles(directory);
  const asts = await relationAsyncFold(files, [] as DtoAst[], async (result, file) => {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const classToken = relationOptionFold(relationFirst(tokens, token => relationEqual(token.value, 'class')), () => { throw Error(`DTO class declaration not found: ${file}`); }, value => value);
    const classIndex = tokens.indexOf(classToken);
    const className = createAstIdentifier(relationOptionFold(relationAt(tokens, relationAdvanceIndex(classIndex, 1)), () => { throw Error(`DTO class name not found: ${file}`); }, token => token.value));
    const declaration = parseResponseDtoDeclaration(tokens, className);
    const span = source(file, Number(declaration.source.line));
    return [...result, dtoProducer.produce({ declaration, source: span })];
  });
  return Object.freeze(asts);
}
