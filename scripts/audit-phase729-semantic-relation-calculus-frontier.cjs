const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = {
  algebra: read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationalAlgebra.ts'),
  rewrite: read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts'),
  store: read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationStore.ts'),
  theory: read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationTheory.ts'),
  program: read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationProgram.ts'),
  constraint: read('packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintCalculus.ts'),
  behavior: read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationalBehaviorKernel.ts'),
};

const checks = {
  canonicalAtomDefinedOnce: (files.algebra.match(/export type RelationAtom =/g) || []).length === 1,
  rewriteReusesCanonicalAtom: files.rewrite.includes("type SemanticRelationAtom = RelationAtom"),
  rewriteUsesImmutableFactIndex: files.rewrite.includes('type FactIndex<R extends string> = Readonly<{ readonly facts: readonly SemanticRelation<R>[] }>'),
  storeUsesCanonicalAtom: files.store.includes("type RelationAtom } from './semanticRelationalAlgebra'"),
  theoryHasSingleRelationResolveImport: (files.theory.match(/relationResolve/g) || []).length > 0 && (files.theory.match(/import \{[^}]*relationResolve/g) || []).length === 1,
  staleRewriteReplaceRemoved: !files.constraint.includes('rule.replace'),
  relationSolverUsesStratumClosure: files.rewrite.includes('ruleDependencies') && files.rewrite.includes('solveStrata'),
  relationProgramUsesRelationValidation: files.program.includes('validateSemanticRelationProgram'),
  behaviorUsesCanonicalConstraintProgram: files.behavior.includes('SEMANTIC_BEHAVIOR_CONSTRAINT_RULES'),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const result = { phase: 729, checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
