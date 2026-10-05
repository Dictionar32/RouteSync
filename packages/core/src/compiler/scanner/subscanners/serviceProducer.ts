import type { ServiceAst } from '../../../types/upstream/ast';
import type { ServiceDefinition } from '../../../types/upstream/service';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { ModelSymbolTable } from '../symbols/ModelSymbolTable';
import type { ServiceDeclarationAst } from '../lexer/serviceAstTypes';
import { buildServiceProducerResult } from './serviceAstCanonical';

export type ServiceProducerInput = {
  readonly syntax: ServiceDeclarationAst;
  readonly source: SourceSpan;
  readonly models: ModelSymbolTable;
};

export interface ServiceProducerResult {
  readonly definition: ServiceDefinition;
  readonly ast: ServiceAst;
}

export interface ServiceProducer {
  readonly produceResult: (input: ServiceProducerInput) => ServiceProducerResult;
  readonly produce: (input: ServiceProducerInput) => ServiceAst;
}

export const serviceProducer: ServiceProducer = {
  produceResult: input => buildServiceProducerResult(input.syntax, input.source, input.models),
  produce: input => serviceProducer.produceResult(input).ast,
};
