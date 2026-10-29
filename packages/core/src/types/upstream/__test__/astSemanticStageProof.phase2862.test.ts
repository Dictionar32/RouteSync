import { describe, expect, it } from 'vitest';
import {
  astSemanticStageProofOperations,
  type AstSemanticProofResultHandlers,
} from '../astSemanticStageProof';
import type { AstSemanticStageContract } from '../astSemanticStageInterface';

const contractFor = (stage: 'scanner_evidence' | 'upstream_mapping' | 'resolver_graph' | 'analysis' | 'semantic_type_lowering' | 'target_projection'): AstSemanticStageContract => ({
  kind: `${stage}_contract`,
  stage,
  input: stage === 'scanner_evidence' ? 'source_syntax' : 'scanner_evidence',
  output: stage,
  relations: [],
  closure: 'least_fixed_point',
  rewriteEngine: 'semantic_rewrite_engine',
  authority: 'ast_semantic_judgment',
  preservation: ['preserves_identity'],
  reasoning: 'declarative_relation_rewrite_fixed_point',
  closed: true,
} as unknown as AstSemanticStageContract);

describe('astSemanticStageProofOperations — Phase 2862 actionable proof ADT', () => {
  it('continues a proof result through its domain handler', () => {
    const result = astSemanticStageProofOperations.resolve('scanner_evidence', contractFor('scanner_evidence'));
    const continuation: AstSemanticProofResultHandlers<string> = {
      onProof: proof => `proof:${proof.kind}`,
      onTerminal: () => 'terminal',
    };
    expect(result.continueWith(continuation)).toBe('proof:scanner_to_mapping_proof');
  });

  it('continues terminal stage without a sentinel proof', () => {
    const result = astSemanticStageProofOperations.resolve('target_projection', contractFor('target_projection'));
    expect(result.continueWith({ onProof: proof => proof.kind, onTerminal: () => 'terminal' })).toBe('terminal');
  });

  it('routes proof obligations through the same actionable ADT', () => {
    expect(astSemanticStageProofOperations.obligations('upstream_mapping', contractFor('upstream_mapping')))
      .toMatchObject([{ kind: 'mapping_to_resolver_proof', status: 'obligation' }]);
    expect(astSemanticStageProofOperations.obligations('target_projection', contractFor('target_projection'))).toEqual([]);
  });
});
