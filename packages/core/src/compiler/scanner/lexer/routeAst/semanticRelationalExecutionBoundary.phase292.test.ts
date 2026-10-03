import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = dirname(new URL(import.meta.url).pathname);
const EXECUTION_FILES = [
  'phpAstSemanticKnowledgeDataFlowAdapter.ts',
  'semanticRelationSolver.ts',
  'semanticConstraintCalculus.ts',
  'semanticRewriteEngine.ts',
  'semanticRelationalCollections.ts',
] as const;

const PROHIBITED = /\b(if|for|while|switch|map|filter|reduce|flatMap)\b|\.(map|filter|reduce|flatMap)\s*\(/g;

describe('Phase 292 relational execution boundary', () => {
  it('keeps semantic adapter and execution substrate free of source dispatch and host collection combinators', () => {
    const violations = EXECUTION_FILES.flatMap(file => {
      const source = readFileSync(join(ROOT, file), 'utf8');
      return [...source.matchAll(PROHIBITED)].map(match => `${file}:${match[0]}`);
    });
    expect(violations).toEqual([]);
  });
});
