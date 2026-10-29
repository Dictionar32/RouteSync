const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const attribute = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const producer = read('packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts');
const checks = [
  ['controller input consumes closed inventory, not a primitive name list', /contextualAttributeInventory:\s*LaravelContextualAttributeInventory/.test(controller) && !/contextualAttributeNames:\s*readonly/.test(controller)],
  ['inventory declares explicit complete discriminant and closed marker', /kind: 'laravel_contextual_attribute_inventory_complete'/.test(attribute) && /readonly closed: true/.test(attribute)],
  ['declaration evidence carries class identity, qualified identity, proof, and source', /interface LaravelContextualAttributeDeclarationEvidence[\s\S]*identity:\s*ClassName;[\s\S]*qualifiedIdentity: PhpQualifiedClassName;[\s\S]*source: SourceSpan;[\s\S]*implementation: LaravelContextualAttributeImplementationProof/.test(attribute)],
  ['inventory is bound to the source project', /interface LaravelContextualAttributeInventory[\s\S]*sourceProject:\s*SourceProjectIdentity/.test(attribute)],
  ['attribute scanner contract is the current version 7 authority', /interface LaravelAttributeScannerInterface[\s\S]*contractVersion: 7/.test(attribute)],
  ['composition root passes through the scanner judgment rather than rebuilding inventory', /contractVersion: 7,[\s\S]*scan: scanAttributeAsts/.test(pipeline) && !/attributes\s*\.filter\(attribute => attribute\.definition\.contextual\)/.test(pipeline)],
  ['PHP contextual classification is based on resolved canonical identity', /phpClassNameResolutionAuthority\.judge/.test(producer) && !/implements\[\^\\\{\]\*\\bContextualAttribute\\b/.test(producer)],
  ['upstream contracts have no foundation or relations imports', !/semantic\/(?:foundation|relations)/.test(controller + attribute)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
