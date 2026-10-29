import { describe, expect, it } from 'vitest';
import { buildSemanticCompilationArtifact } from './semanticCompilationArtifact';

describe('Phase 271 — construct-free semantic compilation artifact', () => {
  it('closes relational semantics without control ontology', () => {
    const artifact = buildSemanticCompilationArtifact([
      { relation: 'condition', arguments: ['scope', 'admin'] },
      { relation: 'candidate', arguments: ['scope', 'save'] },
      { relation: 'requires', arguments: ['save', 'admin'] },
      { relation: 'precedes', arguments: ['a', 'b'] },
      { relation: 'precedes', arguments: ['b', 'a'] },
    ]);

    const relations = artifact.closure.facts.map(fact => fact.relation);
    expect(relations).toContain('permits');
    expect(relations).toContain('reaches');
    expect(relations).toContain('recurs');
    expect(relations.some(relation => ['if', 'for', 'while', 'switch', 'choice', 'decision', 'branch', 'loop', 'repetition'].includes(relation))).toBe(false);
    expect(artifact.closure.saturated).toBe(true);
  });

  it('rejects a source/control construct at the lowering boundary', () => {
    expect(() => buildSemanticCompilationArtifact([
      { relation: 'while' as never, arguments: ['x'] },
    ])).toThrow();
  });
});
