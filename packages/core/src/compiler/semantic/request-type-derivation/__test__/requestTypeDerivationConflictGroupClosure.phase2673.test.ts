import { describe, expect, it } from 'vitest';
import type { RequestTypeDerivationInput, RequestTypeDerivationSemanticInferenceFor } from '../../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSemanticInputPreparation } from '../requestTypeDerivationSemanticInputPreparation';
import { requestTypeDerivationSemanticReasoning } from '../requestTypeDerivationSemanticReasoning';
import { requestTypeDerivationProofVerifier } from '../requestTypeDerivationProofVerifier';
import { RequestTypeDerivationSemanticProducerGapError } from '../requestTypeDerivationSemanticProducerGap';

const sourceSpan = (file: string, start: number, end: number) => Object.freeze({
  kind: 'source_span' as const,
  file: Object.freeze({ kind: 'source_file' as const, value: Object.freeze({ kind: 'string_value' as const, value: file }) }),
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

describe('Phase 2673 conflict group closure', () => {
  it('rejects a forged group attached to an otherwise valid duplicate-identity conflict', () => {
    const input = Object.freeze({
      routes: Object.freeze([]),
      requests: Object.freeze([]),
      resources: Object.freeze([resourceAst(1, 10), resourceAst(11, 20)]),
    }) as unknown as RequestTypeDerivationInput;
    const prepared = requestTypeDerivationSemanticInputPreparation.prepare(input);
    const inference = requestTypeDerivationSemanticReasoning.infer(prepared);
    expect(inference.judgment.kind).toBe('conflict');
    if (inference.judgment.kind !== 'conflict') throw new Error('fixture must produce a conflict judgment');

    const tampered = {
      ...inference,
      judgment: {
        ...inference.judgment,
        proof: {
          ...inference.judgment.proof,
          groupReceipts: [{ canonicalKey: 'resource:forged', contributions: [] }],
        },
      },
    } as unknown as RequestTypeDerivationSemanticInferenceFor;

    expect(() => requestTypeDerivationProofVerifier.verify(tampered)).toThrow(RequestTypeDerivationSemanticProducerGapError);
  });

  it('rejects a conflict proof that drops an inventory resource receipt', () => {
    const input = Object.freeze({
      routes: Object.freeze([]),
      requests: Object.freeze([]),
      resources: Object.freeze([resourceAst(1, 10), resourceAst(11, 20)]),
    }) as unknown as RequestTypeDerivationInput;
    const inference = requestTypeDerivationSemanticReasoning.infer(requestTypeDerivationSemanticInputPreparation.prepare(input));
    expect(inference.judgment.kind).toBe('conflict');
    if (inference.judgment.kind !== 'conflict') throw new Error('fixture must produce a conflict judgment');
    const tampered = {
      ...inference,
      judgment: {
        ...inference.judgment,
        proof: { ...inference.judgment.proof, resourceReceipts: inference.judgment.proof.resourceReceipts.slice(1) },
      },
    } as unknown as RequestTypeDerivationSemanticInferenceFor;
    expect(() => requestTypeDerivationProofVerifier.verify(tampered)).toThrow(RequestTypeDerivationSemanticProducerGapError);
  });

  it('rejects a conflict proof that duplicates a source resource receipt', () => {
    const input = Object.freeze({
      routes: Object.freeze([]),
      requests: Object.freeze([]),
      resources: Object.freeze([resourceAst(1, 10), resourceAst(11, 20)]),
    }) as unknown as RequestTypeDerivationInput;
    const inference = requestTypeDerivationSemanticReasoning.infer(requestTypeDerivationSemanticInputPreparation.prepare(input));
    expect(inference.judgment.kind).toBe('conflict');
    if (inference.judgment.kind !== 'conflict') throw new Error('fixture must produce a conflict judgment');
    const first = inference.judgment.proof.resourceReceipts[0]!;
    const tampered = {
      ...inference,
      judgment: {
        ...inference.judgment,
        proof: { ...inference.judgment.proof, resourceReceipts: [...inference.judgment.proof.resourceReceipts, first] },
      },
    } as unknown as RequestTypeDerivationSemanticInferenceFor;
    expect(() => requestTypeDerivationProofVerifier.verify(tampered)).toThrow(RequestTypeDerivationSemanticProducerGapError);
  });

  it('rejects a conflict whose canonical inventory resource identity is forged consistently with itself', () => {
    const input = Object.freeze({
      routes: Object.freeze([]),
      requests: Object.freeze([]),
      resources: Object.freeze([resourceAst(1, 10), resourceAst(11, 20)]),
    }) as unknown as RequestTypeDerivationInput;
    const inference = requestTypeDerivationSemanticReasoning.infer(requestTypeDerivationSemanticInputPreparation.prepare(input));
    expect(inference.judgment.kind).toBe('conflict');
    const prepared = inference.preparedInput;
    const first = prepared.inventory.resources[0]!;
    const forged = {
      ...first,
      semanticKey: 'resource:forged',
      canonicalIdentity: { ...first.canonicalIdentity, semanticKey: 'resource:forged' },
    };
    const tampered = {
      ...inference,
      preparedInput: {
        ...prepared,
        inventory: {
          ...prepared.inventory,
          resources: [forged, ...prepared.inventory.resources.slice(1)],
        },
      },
    } as unknown as RequestTypeDerivationSemanticInferenceFor;
    expect(() => requestTypeDerivationProofVerifier.verify(tampered)).toThrow(RequestTypeDerivationSemanticProducerGapError);
  });

  it('accepts a conflict with no groups only when no route claims a contribution', () => {
    const input = Object.freeze({
      routes: Object.freeze([]),
      requests: Object.freeze([]),
      resources: Object.freeze([resourceAst(1, 10), resourceAst(11, 20)]),
    }) as unknown as RequestTypeDerivationInput;
    const inference = requestTypeDerivationSemanticReasoning.infer(requestTypeDerivationSemanticInputPreparation.prepare(input));
    expect(inference.judgment.kind).toBe('conflict');
    expect(() => requestTypeDerivationProofVerifier.verify(inference)).not.toThrow();
  });
});
