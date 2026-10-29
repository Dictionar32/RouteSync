/**
 * Upstream producer boundary for AST semantic-stage evidence.
 * Scanner owns tokenization and syntax classification; this interface owns
 * conversion of the resulting observation into the upstream stage judgment.
 */
import type { AstNodeIdentity } from './ast';
import type { SourceSpan } from './provenance';
import type { AstSemanticStagePort } from './astSemanticStageInterface';
import { astSemanticNodeTerm, astSemanticSourceTerm, astSemanticSyntaxTerm } from './astSemanticInterface';
import { createScannerEvidencePort, scannerEvidenceFact } from './astSemanticStageAuthority';

import type { PhpAstExpressionKind } from './phpAstSyntaxKind';

export type AstSemanticEvidenceObservation = Readonly<{
  readonly node: AstNodeIdentity;
  readonly source: SourceSpan;
  readonly syntax: PhpAstExpressionKind;
}>;

export interface AstSemanticEvidenceProducerInterface {
  readonly produce: (observation: AstSemanticEvidenceObservation) => AstSemanticStagePort;
}

const produce = (observation: AstSemanticEvidenceObservation): AstSemanticStagePort => createScannerEvidencePort([
  scannerEvidenceFact('scanner_observes', astSemanticNodeTerm(observation.node), astSemanticSourceTerm(observation.source)),
  scannerEvidenceFact('scanner_syntax', astSemanticNodeTerm(observation.node), astSemanticSyntaxTerm(observation.syntax)),
]);

export const astSemanticEvidenceProducerInterface: AstSemanticEvidenceProducerInterface = Object.freeze({ produce });
export const produceAstSemanticEvidence: AstSemanticEvidenceProducerInterface['produce'] = astSemanticEvidenceProducerInterface.produce;
