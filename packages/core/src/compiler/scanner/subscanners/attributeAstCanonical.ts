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
import { relationIndexOf, relationAdvanceIndex, relationAt, relationOptionFold, relationAsyncFold } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

function className(tokens: readonly { readonly value: string }[]): string {
  const index = relationIndexOf(tokens, token => relationEqual(token.value, 'class'));
  return relationOptionFold(relationAt(tokens, relationAdvanceIndex(index, 1)), () => { throw Error('Attribute class declaration not found'); }, token => token.value);
}

function scanAttribute(file: string, text: string): AttributeAst {
  const tokens = LaravelSourceLexer.tokenize(text);
  const name = className(tokens);
  const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name));
  const span = source(file, Number(declaration.source.line));
  const contextual = /implements[^\{]*\bContextualAttribute\b/.test(text);
  return attributeProducer.produce({ declaration, source: span, contextual });
}

export async function scanAttributeAsts(sourceProject: SourceProjectIdentity): Promise<readonly AttributeAst[]> {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Attributes');
  const files = await collectPhpFiles(directory);
  const asts = await relationAsyncFold(files, [] as AttributeAst[], async (result, file) => [...result, scanAttribute(file, await readSourceText(file))]);
  return Object.freeze(asts);
}
