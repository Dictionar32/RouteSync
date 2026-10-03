import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const authorityFiles = [
  'phpAstSemanticKnowledgeDataFlowAdapter.ts',
  'semanticRelationSolver.ts',
  'semanticConstraintCalculus.ts',
  'semanticRewriteEngine.ts',
  'semanticRelationalCollections.ts',
  'semanticEvidenceRelationCompiler.ts',
  'semanticClosureEngine.ts',
  'semanticRelationProgram.ts',
  'semanticRelationTheory.ts',
] as const;

const forbidden = /\b(if|for|while|switch)\b|\.(map|filter|reduce|flatMap)\s*\(/g;
const legacy = /SemanticChoice|SemanticRepetition|controlRelations|semanticControl|semanticRuleEngine|statementKnowledge/g;

for (const file of authorityFiles) {
  const source = readFileSync(resolve(__dirname, file), 'utf8');
  if (forbidden.test(source)) throw new Error(`Forbidden execution construct in ${file}`);
  if (legacy.test(source)) throw new Error(`Legacy semantic ontology in ${file}`);
}

console.log('PHASE293-RELATIONAL-EXECUTION-BOUNDARY-PASS');
