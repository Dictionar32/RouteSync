import type { ServiceAst } from '../../../types/upstream/ast';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { ModelSymbolTable } from '../symbols/ModelSymbolTable';
import type { ServiceDeclarationAst } from '../lexer/serviceAstTypes';
import { buildServiceAstFromSource } from './serviceAstCanonical';

export type ServiceProducerInput = {
  readonly syntax: ServiceDeclarationAst;
  readonly source: SourceSpan;
  readonly models: ModelSymbolTable;
};

export interface ServiceProducer {
  readonly produce: (input: ServiceProducerInput) => ServiceAst;
}

export const serviceProducer: ServiceProducer = {
  produce: input => buildServiceAstFromSource(input.syntax, input.source, input.models),
};
