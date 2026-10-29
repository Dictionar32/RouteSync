#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pipeline = read('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts');
const astInterface = read('packages/core/src/types/upstream/astSemanticInterface.ts');
const scannerRewriteFacade = read('packages/core/src/compiler/frontend/php/routeAst/semanticRewriteEngine.ts');
const scannerClosureFacade = read('packages/core/src/compiler/frontend/php/routeAst/semanticClosureEngine.ts');
const scannerProgramFacade = read('packages/core/src/compiler/frontend/php/routeAst/semanticRelationProgram.ts');
const foundationRewrite = read('packages/core/src/semantic/foundation/semanticRewriteEngine.ts');
const foundationFiles = fs.readdirSync(path.join(root, 'packages/core/src/semantic/foundation'));
const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(target) : target.endsWith('.ts') ? [target] : [];
});
const scannerFiles = walk(scannerRoot);
const scannerFoundationConsumers = scannerFiles.filter((file) => /semantic\/foundation\//.test(fs.readFileSync(file, 'utf8')));
const checks = [
  ['pipeline exposes the existing AST semantic interface as authority', /readonly semanticAuthority:\s*AstSemanticInterface/.test(pipeline)],
  ['pipeline constructors bind the same canonical authority instance', (pipeline.match(/semanticAuthority:\s*astSemanticInterface/g) || []).length === 2],
  ['pipeline no longer reduces authority to strategy metadata only', !/readonly reasoning:\s*SemanticReasoningContract/.test(pipeline) && !/reasoning:\s*astSemanticInterface\.reasoning/.test(pipeline)],
  ['canonical AST interface owns close, verification, and combined assessment', /readonly close:\s*\(request: AstSemanticClosureRequest\)/.test(astInterface) && /readonly verifyClosure:/.test(astInterface) && /readonly closeVerified:/.test(astInterface)],
  ['scanner rewrite engine is a compatibility facade, not a second implementation', /Compatibility facade/.test(scannerRewriteFacade) && /export \* from ['"]\.\.\/\.\.\/\.\.\/\.\.\/semantic\/foundation\/semanticRewriteEngine['"]/.test(scannerRewriteFacade) && !/function solveSemanticRelations|const solveSemanticRelations\s*=/.test(scannerRewriteFacade)],
  ['scanner closure engine delegates to upstream closure authority', /Compatibility facade/.test(scannerClosureFacade) && /types\/upstream\/semanticClosureEngine/.test(scannerClosureFacade) && !/export const closeCanonicalSemanticRelations\s*=/.test(scannerClosureFacade)],
  ['scanner relation-program facade delegates to upstream program contract', /Compatibility facade/.test(scannerProgramFacade) && /types\/upstream\/semanticRelationProgram/.test(scannerProgramFacade) && !/export const validateSemanticRelationProgram\s*=/.test(scannerProgramFacade)],
  ['generic rewrite implementation remains foundation-owned', foundationFiles.includes('semanticRewriteEngine.ts') && /export const solveSemanticRelationsDetailed/.test(foundationRewrite)],
  [`scanner foundation dependencies are present and must be migrated before any foundation deletion (${scannerFoundationConsumers.length} files)`, scannerFoundationConsumers.length > 0],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
