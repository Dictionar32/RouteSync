const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const attributeContract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const controllerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const controllerScanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const producer = read('packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const checks = [
  ['attribute scanner owns the closed project-scoped inventory', /LaravelContextualAttributeInventory/.test(attributeContract) && /sourceProject: SourceProjectIdentity/.test(attributeContract) && /closed: true/.test(attributeContract)],
  ['declaration evidence retains typed class identity, source, and implementation proof', /qualifiedIdentity: PhpQualifiedClassName/.test(attributeContract) && /source: SourceSpan/.test(attributeContract) && /implementation: LaravelContextualAttributeImplementationProof/.test(attributeContract)],
  ['attribute scanner publishes complete-or-blocked judgment', /LaravelAttributeScanJudgment/.test(attributeContract) && /LaravelAttributeScanCompleteJudgment/.test(attributeContract) && /LaravelAttributeScanBlockedJudgment/.test(attributeContract)],
  ['controller scanner consumes the attribute-owned inventory contract', /contextualAttributeInventory: LaravelContextualAttributeInventory/.test(controllerContract)],
  ['source pipeline forwards the exact producer inventory without rebuilding names', /contextualAttributeInventory: attributeScan\.contextualAttributeInventory/.test(pipeline) && !/contextualAttributeNames:\s*customContextualAttributeNames/.test(pipeline)],
  ['composition root delegates directly to proof-producing scanner version 7', /contractVersion: 7,[\s\S]*?scan: scanAttributeAsts,[\s\S]*?satisfies LaravelAttributeScannerInterface/.test(pipeline)],
  ['blocked outcome is represented at the source-AST pipeline boundary', /laravel_source_ast_projection_attribute_scan_blocked/.test(pipelineContract) && /scan: LaravelAttributeScanBlockedJudgment/.test(pipelineContract)],
  ['controller scanner consumes typed ClassName identities from complete inventory', /input\.contextualAttributeInventory\.declarations\.map\(declaration => declaration\.identity\)/.test(controllerScanner)],
  ['contextual status comes from resolved canonical PHP name, not short-name regex', /phpClassNameResolutionAuthority\.judge/.test(producer) && !/implements\[\^\\\{\]\*\\bContextualAttribute\\b/.test(producer)],
  ['upstream contracts add no semantic foundation or relation imports', !/semantic\/(?:foundation|relations)/.test(attributeContract + controllerContract)],
];
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.exitCode = checks.every(([, pass]) => pass) ? 0 : 1;
