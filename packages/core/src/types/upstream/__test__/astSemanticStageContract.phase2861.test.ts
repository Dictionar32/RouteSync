import { describe, expect, it } from 'vitest';
import { astSemanticStageTopologyAuthority } from '../astSemanticStageContract';

describe('upstream AST semantic stage topology authority phase2861', () => {
  it('continues declared stages through the declared handler', () => {
    const membership = astSemanticStageTopologyAuthority.classifyMembership('scanner_evidence');
    expect(membership.kind).toBe('ast_semantic_stage_undeclared');
    expect(membership.continueWith({
      onDeclared: stage => `declared:${stage}`,
      onUndeclared: stage => `undeclared:${stage}`,
    })).toBe('declared:scanner_evidence');
  });

  it('continues an undeclared runtime stage through the rejection handler', () => {
    const membership = astSemanticStageTopologyAuthority.classifyMembership('unknown_stage');
    expect(membership.kind).toBe('ast_semantic_stage_undeclared');
    expect(membership.continueWith({
      onDeclared: stage => `declared:${stage}`,
      onUndeclared: stage => `undeclared:${stage}`,
    })).toBe('undeclared:unknown_stage');
  });

  it('derives ordered stages from the single upstream graph', () => {
    expect(astSemanticStageTopologyAuthority.order()).toEqual([
      'scanner_evidence', 'upstream_mapping', 'resolver_graph', 'analysis',
      'semantic_type_lowering', 'target_projection',
    ]);
  });
});
