import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname);
const targets = [
  'semanticRewriteEngine.ts',
  'semanticConstraintCalculus.ts',
  'semanticRewriteEngine.ts',
  'phpAstSemanticKnowledgeDataFlowAdapter.ts',
].map(name => resolve(root, name));

const forbidden = /\b(if|for|while|switch)\b/;
const violations = targets.flatMap(file => {
  const source = readFileSync(file, 'utf8');
  return forbidden.test(source) ? [file] : [];
});

if (violations.length > 0) throw new Error(`construct-bearing semantic execution files: ${violations.join(', ')}`);
console.log('PHASE291-RELATIONAL-EXECUTION-BOUNDARY-PASS');
