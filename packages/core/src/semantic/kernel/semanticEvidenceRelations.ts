/**
 * Canonical evidence-to-semantic relation bridge.
 *
 * Evidence producers may know syntax. They do not decide semantic authority.
 * Their observations are lifted into Presence relations and then exposed to
 * the semantic solver/rewrite layer.
 */
import { absent, present, presenceFold, type Presence } from './syntax/presenceRelations';
import { relationGate, relationProject } from './relationalSequence';
import * as astEvidence from '../../compiler/scanner/lexer/astClassifierEvidence';
import { queryEvidenceProducer, type QueryProducerInput } from '../../compiler/scanner/subscanners/queryEvidenceProducer';
import type { PhpAstValue, PhpBlock, TokenDescriptor } from '../../compiler/scanner/lexer/PhpAst';
import type { QueryAst } from '../../types/upstream/query';

export type SemanticEvidence<T> = Readonly<{
  readonly relation: 'evidence';
  readonly value: T;
}>;

const evidence = <T>(value: T): SemanticEvidence<T> => Object.freeze({ relation: 'evidence', value });

export const astValueRelation = (raw: string): Presence<SemanticEvidence<PhpAstValue>> =>
  present(evidence(astEvidence.classifyAstValue(raw)));

export const astTokenRelation = (tokens: readonly TokenDescriptor[]): Presence<SemanticEvidence<PhpAstValue>> =>
  present(evidence(astEvidence.classifyAstTokens(tokens)));

export const phpBlockRelation = (tokens: readonly TokenDescriptor[]): Presence<SemanticEvidence<PhpBlock>> =>
  present(evidence(astEvidence.classifyPhpBlock(tokens)));

export const queryRelation = (input: QueryProducerInput): Presence<readonly QueryAst[]> =>
  relationGate(input.expressions.length > 0, () => present(queryEvidenceProducer.produce(input)), absent);

export const semanticEvidenceFold = <T, R>(
  value: Presence<SemanticEvidence<T>>,
  onAbsent: () => R,
  onPresent: (entry: T) => R,
): R => presenceFold(value, onAbsent, entry => onPresent(entry.value));

export const evidenceProject = <T, R>(
  values: readonly T[],
  project: (value: T) => R,
): readonly R[] => relationProject(values, project);
