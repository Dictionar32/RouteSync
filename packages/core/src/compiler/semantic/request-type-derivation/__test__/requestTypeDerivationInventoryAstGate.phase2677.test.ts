import { describe, expect, it } from 'vitest';
import type {
  RequestTypeDerivationInput,
  RequestTypeDerivationSemanticInferenceFor,
} from '../../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSemanticInputPreparation } from '../requestTypeDerivationSemanticInputPreparation';
import { requestTypeDerivationSemanticReasoning } from '../requestTypeDerivationSemanticReasoning';
import { requestTypeDerivationProofVerifier } from '../requestTypeDerivationProofVerifier';
import { RequestTypeDerivationSemanticProducerGapError } from '../requestTypeDerivationSemanticProducerGap';

const sourceSpan = (file: string, start: number, end: number) => Object.freeze({
  kind: 'source_span' as const,
  file: Object.freeze({
    kind: 'source_file' as const,
    value: Object.freeze({ kind: 'string_value' as const, value: file }),
  }),
  start: Object.freeze({ kind: 'number_value' as const, value: start }),
  end: Object.freeze({ kind: 'number_value' as const, value: end }),
});

const resourceAst = (start: number, end: number) => Object.freeze({
  kind: 'resource_ast' as const,
  definition: Object.freeze({
    name: Object.freeze({
      kind: 'resource_name' as const,
      value: Object.freeze({ kind: 'string_value' as const, value: 'Post' }),
    }),
  }),
  source: sourceSpan('app/Resources/Post.php', start, end),
});

describe('Phase 2677 inventory-to-AST gate on non-conflict judgments', () => {
  it('rejects forged inventory before dispatching a non-conflict judgment', () => {
    const input = Object.freeze({
      routes: Object.freeze([]),
      requests: Object.freeze([]),
      resources: Object.freeze([resourceAst(1, 10)]),
    }) as unknown as RequestTypeDerivationInput;
    const inference = requestTypeDerivationSemanticReasoning.infer(
      requestTypeDerivationSemanticInputPreparation.prepare(input),
    );
    // Use a genuine producer-created successful judgment: the regression must
    // not forge the discriminator to reach the verifier's common gate.
    expect(inference.judgment.kind).toBe('derived');

    const prepared = inference.preparedInput;
    const first = prepared.inventory.resources[0]!;
    const forgedResource = {
      ...first,
      semanticKey: 'resource:forged',
      canonicalIdentity: {
        ...first.canonicalIdentity,
        semanticKey: 'resource:forged',
      },
    };
    // Keep the inventory internally self-consistent but inconsistent with the
    // raw AST. Preserve the producer-created derived judgment so the test covers
    // the real successful path, not a manually forged discriminator.
    const tampered = {
      ...inference,
      preparedInput: {
        ...prepared,
        inventory: {
          ...prepared.inventory,
          resources: [forgedResource, ...prepared.inventory.resources.slice(1)],
        },
      },
    } as unknown as RequestTypeDerivationSemanticInferenceFor;

    try {
      requestTypeDerivationProofVerifier.verify(tampered);
      throw new Error('expected forged inventory to be rejected');
    } catch (error) {
      expect(error).toBeInstanceOf(RequestTypeDerivationSemanticProducerGapError);
      expect(error).toMatchObject({
        stage: 'verification',
        capability: 'prepared inventory identity does not match raw AST occurrences and provenance',
      });
    }
  });
});
