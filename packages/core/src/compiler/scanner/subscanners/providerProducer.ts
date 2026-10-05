import type { ProviderAst } from '../../../types/upstream/ast';
import type { SourceFile, SourceSpan } from '../../../types/upstream/provenance';
import type { ProviderDefinition } from '../../../types/upstream/application';
import type { ProviderSourceEvidence } from '../../../types/upstream/providerEvidence';
import { buildProviderSemanticResultFromSource } from './providerAstCanonical';

export type ProviderProducerInput = {
  readonly source: ProviderSourceEvidence;
  readonly file: SourceFile;
  readonly sourceSpan: SourceSpan;
};

export interface ProviderProducerResult {
  readonly definition: ProviderDefinition;
  readonly ast: ProviderAst;
}

export interface ProviderProducer {
  readonly produceResult: (input: ProviderProducerInput) => ProviderProducerResult;
  readonly produce: (input: ProviderProducerInput) => ProviderAst;
}

export const providerProducer: ProviderProducer = {
  produceResult: input => buildProviderSemanticResultFromSource(input.source, input.file, input.sourceSpan),
  produce: input => providerProducer.produceResult(input).ast,
};
