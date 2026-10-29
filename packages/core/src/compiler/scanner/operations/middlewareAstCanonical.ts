import { sourceFileAcquisition } from '../sourceFiles';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../../frontend/php/phpAstTypes';
import type { MiddlewareAst } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import { sourceFileIdentityFactory, stringValue } from '../../../types/upstream/names';
import { laravelControllerInvocationSemanticJudgmentAuthority, laravelControllerInvocationSemanticInputFactory } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentAuthority';
import { middlewareProducer } from './middlewareProducer';
import { relationIndexOf, relationAdvanceIndex, relationAt, relationOptionFold, relationAsyncFold } from '../../../semantic/relations/relationalSequence';
import { relationEqual } from '../../../semantic/relations/semanticRelations';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const source = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue.create(file) },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

function className(tokens: readonly { readonly value: string }[]): string {
  const index = relationIndexOf(tokens, token => relationEqual(token.value, 'class'));
  return relationOptionFold(relationAt(tokens, relationAdvanceIndex(index, 1)), () => { throw Error('Middleware class declaration not found'); }, token => token.value);
}

const scanMiddlewareAstsImplementation = async (sourceProject: SourceProjectIdentity): Promise<readonly MiddlewareAst[]> => {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'Middleware');
  const files = await sourceFileAcquisition.collectPhpFiles(directory);
  const asts = await relationAsyncFold(files, [] as MiddlewareAst[], async (result, file) => {
    const text = await sourceFileAcquisition.readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const name = className(tokens);
    const invocationJudgment = laravelControllerInvocationSemanticJudgmentAuthority.judge(laravelControllerInvocationSemanticInputFactory.withoutPipeline(sourceFileIdentityFactory.create(stringValue.create(file))));
    const declaration = LaravelSourceLexer.parseControllerDeclaration(text, tokens, createAstIdentifier(name), { kind: 'invocation_semantic_judgment', judgment: invocationJudgment });
    const span = source(file, Number(declaration.source.line));
    return [...result, middlewareProducer.produce({ declaration, source: span })];
  });
  return Object.freeze(asts);
};


export interface MiddlewareAstScanningOperationInterface {
  readonly scan: (sourceProject: SourceProjectIdentity) => Promise<readonly MiddlewareAst[]>;
}

export const middlewareAstScanningOperation: MiddlewareAstScanningOperationInterface = Object.freeze({
  scan: scanMiddlewareAstsImplementation,
});
