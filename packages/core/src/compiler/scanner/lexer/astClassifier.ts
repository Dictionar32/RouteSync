import { astTokenRelation, astValueRelation, phpBlockRelation, semanticEvidenceFold } from '../semantic/semanticEvidenceRelations';
import * as astEvidence from './astClassifierEvidence';
import type { PhpAstValue, TokenDescriptor, PhpBlock } from './PhpAst';

/** Canonical AST classification relation boundary. Evidence is observed, then folded as a semantic relation. */
export const astClassificationRelation = Object.freeze({
  value: (raw: string): PhpAstValue => semanticEvidenceFold(astValueRelation(raw), () => astEvidence.classifyAstValue(raw), value => value),
  tokens: (tokens: readonly TokenDescriptor[]): PhpAstValue => semanticEvidenceFold(astTokenRelation(tokens), () => astEvidence.classifyAstTokens(tokens), value => value),
  block: (tokens: readonly TokenDescriptor[]): PhpBlock => semanticEvidenceFold(phpBlockRelation(tokens), () => astEvidence.classifyPhpBlock(tokens), value => value),
});

export const classifyAstValue = astClassificationRelation.value;
export const classifyAstTokens = astClassificationRelation.tokens;
export const classifyPhpBlock = astClassificationRelation.block;
export type { PhpAstValue, TokenDescriptor, PhpBlock };
