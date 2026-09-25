import type { ProviderAst } from '../../../types/upstream/ast';
import type { SourceFile, SourceSpan } from '../../../types/upstream/provenance';
import type { ProviderSourceAst } from '../../../types/upstream/application';
import { buildProviderAstFromSource } from './providerAstCanonical';

export type ProviderProducerInput = {
  readonly source: ProviderSourceAst;
  readonly file: SourceFile;
  readonly sourceSpan: SourceSpan;
};

export interface ProviderProducer {
  readonly produce: (input: ProviderProducerInput) => ProviderAst;
}

export const providerProducer: ProviderProducer = {
  produce: input => buildProviderAstFromSource(input.source, input.file, input.sourceSpan),
};
