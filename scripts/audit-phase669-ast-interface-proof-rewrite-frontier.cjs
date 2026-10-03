const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/kernel/relationalSequence.ts',
  'packages/core/src/semantic/kernel/semanticDecisionRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/tokenEvidence.ts',
  'packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts',
  'packages/core/src/compiler/scanner/lexer/controllerReturnParser.ts',
  'packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionMappings.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionClosure.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptNodeLowerer.ts',
];
const forbidden = /as unknown|\?\.|\.value!|new Set|new Map|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\bundefined\b|\bany\b/;
const extract = /\bas\s+Extract\s*</;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const legacy = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
];
const boundary = Object.fromEntries(files.map(f => [f, { forbidden: (read(f).match(forbidden) || []).length, extractCasts: (read(f).match(extract) || []).length }]));
const success = Object.values(boundary).every(v => v.forbidden === 0 && v.extractCasts === 0)
  && legacy.every(f => fs.statSync(path.join(root, f)).size === 0);
console.log(JSON.stringify({
  phase: 669,
  model: 'proof-carrying typed AST variant rewrite interface across scanner, upstream mapping, resolver-adjacent closure and lowering boundary',
  relationVariantWitness: /export const relationVariantValue/.test(read('packages/core/src/semantic/kernel/relationalSequence.ts')),
  typedRewriteCandidate: /SemanticVariantRewriteCandidate/.test(read('packages/core/src/semantic/kernel/semanticDecisionRewriteEngine.ts')),
  proofCarryingRewrite: /variantRewriteCandidate/.test(read('packages/core/src/semantic/kernel/semanticDecisionRewriteEngine.ts')),
  lexicalEvidenceInterface: /TokenEvidenceInterface/.test(read('packages/core/src/compiler/scanner/lexer/tokenEvidence.ts')),
  legacySolverEmpty: fs.statSync(path.join(root, legacy[0])).size === 0,
  syntaxCoreEmpty: fs.statSync(path.join(root, legacy[1])).size === 0,
  boundary,
  success,
}, null, 2));
process.exit(success ? 0 : 1);
