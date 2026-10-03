const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const semanticBoundary = [
  'packages/core/src/semantic/kernel/semanticDecisionRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstAlgebra.ts',
  'packages/core/src/compiler/scanner/lexer/tokenEvidence.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/responseDetector.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/resourceInvocationDetector.ts',
  'packages/core/src/types/upstream/astSemanticStageInterface.ts',
  'packages/core/src/types/upstream/astSemanticStageProof.ts',
  'packages/core/src/types/upstream/astSemanticStagePreservation.ts',
];
const forbidden = /\b(if|while|for|switch)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\bundefined\b|\?\?|===|!==|as unknown|new Set|new Map|\bany\b/;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const solver = read(semanticBoundary[0]);
const algebra = read(semanticBoundary[1]);
const tokenEvidence = read(semanticBoundary[2]);
const targeted = semanticBoundary.map(file => ({ file, forbidden: [...read(file).matchAll(new RegExp(forbidden.source, 'g'))].length }));
const requiredFields = ['requirements: readonly Requirement[]', 'exclusions: readonly Exclusion[]', 'dependencies: readonly Dependency[]'];
const solverClosed = requiredFields.every(value => solver.includes(value)) && !/requirements\?:|exclusions\?:|dependencies\?:/.test(solver);
const astCastsRemoved = !/as Extract/.test(algebra);
const tokenInterface = /export type TokenEvidence/.test(tokenEvidence) && /export const tokenAt/.test(tokenEvidence);
const responseClean = !/\?\.|\.value!/.test(read('packages/core/src/compiler/scanner/subscanners/controller/responseDetector.ts'));
const invocationClean = !/\?\.|\.value!/.test(read('packages/core/src/compiler/scanner/subscanners/controller/resourceInvocationDetector.ts'));
const legacy = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
].every(file => fs.statSync(path.join(root, file)).size === 0);
const result = {
  phase: 665,
  model: 'closed AST interface elevation: solver judgments + lexical evidence + cast-free algebraic elimination',
  solverClosed,
  astCastsRemoved,
  tokenInterface,
  responseClean,
  invocationClean,
  legacySolverAndSyntaxCoreEmpty: legacy,
  semanticBoundaryForbidden: targeted,
  success: solverClosed && astCastsRemoved && tokenInterface && responseClean && invocationClean && legacy && targeted.every(x => x.forbidden === 0),
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
