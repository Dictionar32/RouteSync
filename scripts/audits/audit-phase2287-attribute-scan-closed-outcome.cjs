const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelAttributeScannerInterface.ts'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts'), 'utf8');
const pipelinePath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const pipeline = fs.readFileSync(pipelinePath, 'utf8');
const producer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts'), 'utf8');
const projectionContract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'), 'utf8');
const checks = [
  ['phase 2287 complete-or-blocked contract is preserved at current version 7', /interface LaravelAttributeScannerInterface[\s\S]*?readonly contractVersion: 7;/.test(contract) && /type LaravelAttributeScanJudgment =\s*\| LaravelAttributeScanCompleteJudgment\s*\| LaravelAttributeScanBlockedJudgment;/.test(contract)],
  ['complete outcome publishes ASTs and a closed inventory', /interface LaravelAttributeScanCompleteJudgment[\s\S]*?readonly attributes: readonly AttributeAst\[\];[\s\S]*?readonly contextualAttributeInventory: LaravelContextualAttributeInventory;/.test(contract)],
  ['blocked outcome publishes typed source-resolution blockers but no AST inventory', /interface LaravelAttributeScanBlockedJudgment[\s\S]*?readonly blockers: readonly LaravelAttributeScanBlocker\[\];/.test(contract) && !/interface LaravelAttributeScanBlockedJudgment[\s\S]*?readonly attributes:|interface LaravelAttributeScanBlockedJudgment[\s\S]*?readonly contextualAttributeInventory:/.test(contract)],
  ['blocker retains source provenance and existing PHP resolution ADT', /interface LaravelAttributeScanBlocker[\s\S]*?readonly source: SourceSpan;[\s\S]*?Extract<PhpClassNameResolution, \{ readonly kind: 'php_class_name_resolution_blocked' \}>/.test(contract)],
  ['controller scanner still accepts only the complete inventory contract', /readonly contextualAttributeInventory: LaravelContextualAttributeInventory;/.test(controller)],
  ['upstream contract has no foundation or relations imports', !/semantic\/(?:foundation|relations)/.test(contract)],
  ['short-name regex was replaced by the existing PHP resolution authority', !/implements\[\^\\\{\]\*\\bContextualAttribute\\b/.test(producer) && /phpClassNameResolutionAuthority\.judge/.test(producer)],
  ['pipeline forwards a typed attribute-blocked outcome', /laravel_source_ast_projection_attribute_scan_blocked/.test(pipeline) && /laravel_source_ast_projection_attribute_scan_blocked/.test(projectionContract)],
  ['pipeline does not reconstruct inventory from the contextual boolean', !/attributes\s*\.filter\(attribute => attribute\.definition\.contextual\)/.test(pipeline)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
