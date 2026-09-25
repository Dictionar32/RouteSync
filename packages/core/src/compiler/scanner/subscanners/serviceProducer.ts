import type { ServiceAst } from '../../../types/upstream/ast';
import type { SourceFile, SourceSpan } from '../../../types/upstream/provenance';
import type { ModelSymbolTable } from '../symbols/ModelSymbolTable';
import type { ServiceSourceAst } from '../../../types/upstream/service';
import { buildServiceAstFromSource } from './serviceAstCanonical';

export type ServiceProducerInput = {
  readonly source: ServiceSourceAst;
  readonly file: SourceFile;
  readonly sourceSpan: SourceSpan;
  readonly models: ModelSymbolTable;
};

export interface ServiceProducer {
  readonly produce: (input: ServiceProducerInput) => ServiceAst;
}

export const serviceProducer: ServiceProducer = {
  produce: input => buildServiceAstFromSource(input.source, input.file, input.sourceSpan, input.models),
};
