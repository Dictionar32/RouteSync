import { describe, expect, it } from 'vitest';
import type { RequestTypeDerivationInput } from '../../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationContract } from '../../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSemanticInputPreparation } from '../requestTypeDerivationSemanticInputPreparation';
import { requestTypeDerivationSemanticReasoning } from '../requestTypeDerivationSemanticReasoning';
import { requestTypeDerivationProofVerifier } from '../requestTypeDerivationProofVerifier';
import { createRequestTypeDerivationAuthorityCoverage } from '../requestTypeDerivationCoverage';

const sourceSpan = (file: string, start: number, end: number) => Object.freeze({
  kind: 'source_span' as const,
  file: Object.freeze({ kind: 'source_file' as const, value: Object.freeze({ kind: 'string_value' as const, value: file }) }),
  start: Object.freeze({ kind: 'number_value' as const, value: start }),
  end: Object.freeze({ kind: 'number_value' as const, value: end }),
});

const resourceAst = (file: string, start: number, end: number) => Object.freeze({
  kind: 'resource_ast' as const,
  definition: Object.freeze({
    name: Object.freeze({
      kind: 'resource_name' as const,
      value: Object.freeze({ kind: 'string_value' as const, value: 'Post' }),
    }),
  }),
  source: sourceSpan(file, start, end),
});

describe('Phase 2659 duplicate canonical resource identity', () => {
  it('produces a source-grounded conflict and keeps partial verification incomplete', () => {
    const input = Object.freeze({
      routes: Object.freeze([]),
      requests: Object.freeze([]),
      resources: Object.freeze([
        resourceAst('app/Resources/Post.php', 1, 10),
        resourceAst('app/Resources/Post.php', 11, 20),
      ]),
    }) as unknown as RequestTypeDerivationInput;

    const prepared = requestTypeDerivationSemanticInputPreparation.prepare(input);
    const inference = requestTypeDerivationSemanticReasoning.infer(prepared);
    expect(inference.judgment.kind).toBe('conflict');
    if (inference.judgment.kind !== 'conflict') throw new Error('duplicate resource identity must be a conflict judgment');
    expect(inference.judgment.conflicts.map(conflict => conflict.kind)).toContain('duplicate_resource_identity');
    expect(inference.judgment.proof.resourceReceipts).toHaveLength(2);
    expect(inference.judgment.proof.resourceReceipts.every(receipt => receipt.disposition.kind === 'conflicted')).toBe(true);

    const verification = requestTypeDerivationProofVerifier.verify(inference);
    expect(verification.result.kind).toBe('verification_incomplete');
    if (verification.result.kind !== 'verification_incomplete') throw new Error('partial verification must not be promoted to valid');
    expect(verification.result.missingLaws).toHaveLength(Object.keys(requestTypeDerivationContract.laws).length);

    const coverage = createRequestTypeDerivationAuthorityCoverage(requestTypeDerivationContract).assess(verification.result);
    expect(coverage.kind).toBe('verification_incomplete');
  });
});
