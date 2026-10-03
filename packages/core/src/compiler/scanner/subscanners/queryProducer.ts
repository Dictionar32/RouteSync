import { queryRelation, semanticEvidenceFold } from '../../../semantic/kernel/semanticEvidenceRelations';
import type { ExpressionAst } from '../../../types/upstream/ast';
import type { QueryAst } from '../../../types/upstream/query';

export type QueryProducerInput = { readonly expressions: readonly ExpressionAst[] };
export interface QueryProducer { readonly produce: (input: QueryProducerInput) => readonly QueryAst[] }

/** Canonical query relation boundary. Evidence is lifted into a semantic relation before exposure. */
export const queryProducerRelation: QueryProducer = Object.freeze({
  produce: input => semanticEvidenceFold(queryRelation(input), () => [], value => value),
});

export const queryProducer = queryProducerRelation;
