/**
 * Canonical evidence-to-semantic relation bridge.
 *
 * Evidence producers may know syntax. They do not decide semantic authority.
 * Their observations are lifted into Presence relations and then exposed to
 * the semantic solver/rewrite layer.
 */
import { absent, present, presenceFold, type Presence } from '../../semantic/relations/presenceRelations';
import { relationGate, relationProject } from '../../semantic/relations/relationalSequence';
import { classifyAstTokens, classifyAstValue, classifyPhpBlock } from '../frontend/php/astClassifierEvidence';
import { queryEvidenceProducer, type QueryProducerInput } from './query/queryEvidenceProducer';
import type { PhpAstValue, PhpBlock, TokenDescriptor } from '../frontend/php/PhpAst';
import type { QueryAst } from '../../types/upstream/query';

export type SemanticEvidence<T> = Readonly<{
  readonly relation: 'evidence';
  readonly value: T;
}>;

const evidence = <T>(value: T): SemanticEvidence<T> => Object.freeze({ relation: 'evidence', value });

const astValueRelationImplementation = (raw: string): Presence<SemanticEvidence<PhpAstValue>> =>
  present(evidence(classifyAstValue(raw)));

const astTokenRelationImplementation = (tokens: readonly TokenDescriptor[]): Presence<SemanticEvidence<PhpAstValue>> =>
  present(evidence(classifyAstTokens(tokens)));

const phpBlockRelationImplementation = (tokens: readonly TokenDescriptor[]): Presence<SemanticEvidence<PhpBlock>> =>
  present(evidence(classifyPhpBlock(tokens)));

const queryRelationImplementation = (input: QueryProducerInput): Presence<readonly QueryAst[]> =>
  relationGate(input.expressions.length > 0, () => present(queryEvidenceProducer.produce(input)), absent);

const semanticEvidenceFoldImplementation = <T, R>(
  value: Presence<SemanticEvidence<T>>,
  onAbsent: () => R,
  onPresent: (entry: T) => R,
): R => presenceFold(value, onAbsent, entry => onPresent(entry.value));

const evidenceProjectImplementation = <T, R>(
  values: readonly T[],
  project: (value: T) => R,
): readonly R[] => relationProject(values, project);


export interface SemanticEvidenceRelationsInterface {
  readonly astValue: (raw: string) => Presence<SemanticEvidence<PhpAstValue>>;
  readonly astTokens: (tokens: readonly TokenDescriptor[]) => Presence<SemanticEvidence<PhpAstValue>>;
  readonly phpBlock: (tokens: readonly TokenDescriptor[]) => Presence<SemanticEvidence<PhpBlock>>;
  readonly query: (input: QueryProducerInput) => Presence<readonly QueryAst[]>;
  readonly fold: <T, R>(
    value: Presence<SemanticEvidence<T>>,
    onAbsent: () => R,
    onPresent: (entry: T) => R,
  ) => R;
  readonly project: <T, R>(values: readonly T[], project: (value: T) => R) => readonly R[];
}

export const semanticEvidenceRelations: SemanticEvidenceRelationsInterface = Object.freeze({
  astValue: astValueRelationImplementation,
  astTokens: astTokenRelationImplementation,
  phpBlock: phpBlockRelationImplementation,
  query: queryRelationImplementation,
  fold: semanticEvidenceFoldImplementation,
  project: evidenceProjectImplementation,
});
