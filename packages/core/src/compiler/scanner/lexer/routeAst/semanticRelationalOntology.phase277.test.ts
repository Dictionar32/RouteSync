import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { cwd } from 'node:process';

const root = join(cwd(), 'packages/core/src/compiler/scanner/lexer/routeAst');
const semanticRoots = [
  'semanticKnowledgeDataFlowRelations.ts',
  'semanticCanonicalRelationProjection.ts',
  'semanticConstraintCalculus.ts',
  'semanticRelationalBehaviorKernel.ts',
  'semanticRelationalBehaviorCatalog.ts',
  'semanticRelationTheory.ts',
  'semanticRelationSolver.ts',
  'semanticRewriteEngine.ts',
  'semanticClosureEngine.ts',
  'semanticCompilationArtifact.ts',
  'phpAstSemanticKnowledgeDataFlowAdapter.ts',
];

const forbiddenOntology = /\b(?:SemanticChoice|SemanticRepetition|controlRelations|semanticControl)\b/g;
const forbiddenSourceConstructs = /\b(?:if_statement|foreach_statement|for_statement|while_statement|switch_statement)\b/g;
const sourceSyntaxBoundary = 'phpAstStatementSyntaxEvidenceRegistry.ts';

const violations: string[] = [];
for (const relativeFile of semanticRoots) {
  const file = join(root, relativeFile);
  const source = readFileSync(file, 'utf8');
  const matches = [...source.matchAll(forbiddenOntology)].map(match => match[0]);
  if (matches.length > 0) {
    violations.push(`${relativeFile}: ${[...new Set(matches)].join(', ')}`);
  }
}

const collect = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const file = join(dir, name);
  return statSync(file).isDirectory() ? collect(file) : [file];
});

for (const file of collect(root)) {
  const relativeFile = relative(root, file);
  if (relativeFile === sourceSyntaxBoundary || relativeFile.startsWith('legacy/') || relativeFile.endsWith('.test.ts')) continue;
  if (!file.endsWith('.ts')) continue;
  const source = readFileSync(file, 'utf8');
  const matches = [...source.matchAll(forbiddenOntology)].map(match => match[0]);
  if (matches.length > 0) {
    violations.push(`${relativeFile}: ${[...new Set(matches)].join(', ')}`);
  }
}

for (const relativeFile of semanticRoots) {
  const file = join(root, relativeFile);
  const source = readFileSync(file, 'utf8');
  const matches = [...source.matchAll(forbiddenSourceConstructs)].map(match => match[0]);
  if (matches.length > 0) {
    violations.push(`${relativeFile}: source constructs ${[...new Set(matches)].join(', ')}`);
  }
}

if (violations.length > 0) {
  throw new Error(`Phase 277 relational ontology leak detected:\n${violations.join('\n')}`);
}

console.log('PHASE277-RELATIONAL-ONTOLOGY-AUDIT-PASS');
