import type { InvocationSemanticEvidence } from '../../src/types/upstream/invocationSemanticJudgmentInterface';
import type { SemanticSource } from '../../src/types/upstream/semanticDataflowKnowledge';

type EmptyEvidenceIsRejected = readonly [] extends InvocationSemanticEvidence ? true : false;
const emptyEvidenceIsRejected: EmptyEvidenceIsRejected = false;

// A concrete source record is the required minimum witness.
declare const source: SemanticSource;
const validEvidence: InvocationSemanticEvidence = [source];

void emptyEvidenceIsRejected;
void validEvidence;
