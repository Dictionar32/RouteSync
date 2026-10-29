import { describe, expect, it } from 'vitest';
import { astSemanticStageTransitionAuthority } from '../astSemanticStageTransition';
import type { ScannerEvidenceContract } from '../astSemanticStageInterface';
import type { AstSemanticStageProof } from '../astSemanticStageProof';

const contract: ScannerEvidenceContract = Object.freeze({
  kind: 'scanner_evidence_contract',
  stage: 'scanner_evidence',
  input: 'source_syntax',
  output: 'scanner_evidence',
  relations: Object.freeze(['scanner_observes'] as const),
  closure: 'least_fixed_point',
  rewriteEngine: 'semantic_rewrite_engine',
  authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity'] as const),
  reasoning: 'declarative_relation_rewrite_fixed_point',
  closed: true,
});

const validProof: AstSemanticStageProof = Object.freeze({
  kind: 'scanner_to_mapping_proof',
  from: 'scanner_evidence',
  to: 'upstream_mapping',
  preservation: Object.freeze(['preserves_identity'] as const),
  status: 'obligation',
});

const wrongProof: AstSemanticStageProof = Object.freeze({
  kind: 'mapping_to_resolver_proof',
  from: 'upstream_mapping',
  to: 'resolver_graph',
  preservation: Object.freeze(['preserves_identity'] as const),
  status: 'obligation',
});

describe('AST semantic stage transition authority phase2860', () => {
  it('continues a valid stage transition through its domain operation', () => {
    const judgment = astSemanticStageTransitionAuthority.transition('scanner_evidence', 'upstream_mapping', contract, validProof);
    const result = judgment.continueWith({
      onTransition: transition => transition.kind,
      onRejected: rejection => rejection.reason,
    });
    expect(result).toBe('scanner_to_mapping_transition');
    expect(judgment.kind).toBe('ast_semantic_stage_transition_constructed');
  });

  it('returns an explicit rejection ADT for a proof from another transition', () => {
    const judgment = astSemanticStageTransitionAuthority.transition('scanner_evidence', 'upstream_mapping', contract, wrongProof);
    const result = judgment.continueWith({
      onTransition: transition => transition.kind,
      onRejected: rejection => rejection.reason,
    });
    expect(judgment.kind).toBe('ast_semantic_stage_transition_rejected');
    expect(result).toBe('proof_kind_mismatch');
  });

  it('rejects an unsupported stage pair with an actionable continuation', () => {
    const judgment = astSemanticStageTransitionAuthority.transition('scanner_evidence', 'analysis', contract, validProof);
    expect(judgment.continueWith({
      onTransition: transition => transition.kind,
      onRejected: rejection => `${rejection.from}:${rejection.to}:${rejection.reason}`,
    })).toBe('scanner_evidence:analysis:stage_pair_not_allowed');
  });
});
