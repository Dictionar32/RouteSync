const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const names = read('packages/core/src/types/upstream/names.ts');
const barrel = read('packages/core/src/index.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const inventoryContract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const visitorTest = read('packages/core/src/types/upstream/__tests__/source-file-inventory-domain-visitor.phase2921.test.ts');
const collectionBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = [
  ['SourceFileInventory exposes a domain-specific visitor contract', /interface SourceFileInventoryVisitorInterface[\s\S]*?visit: \(sourceFile: SourceFile\) => void/.test(names)],
  ['SourceFileInventory no longer exposes generic continuation handlers', !/SourceFileInventoryHandlers|continueWith:\s*<Result>/.test(names)],
  ['empty inventory defines an explicit no-source traversal operation', /visitSources: \(_visitor: SourceFileInventoryVisitorInterface\): void => undefined/.test(names)],
  ['entry inventory visits its source and delegates remaining traversal', /visitSources: \(visitor: SourceFileInventoryVisitorInterface\): void => \{\s*visitor\.visit\(sourceFile\);\s*remaining\.visitSources\(visitor\);/s.test(names)],
  ['format delegates source traversal to the inventory domain operation', /sourceFileInventoryFactory\.entry\(sourceFile, remaining\)\.visitSources/.test(names)],
  ['CLI source reads schedule work through the inventory visitor', /sources\.visitSources\(\{\s*visit: requestedSourceFile => scheduledReads\.push/s.test(composition)],
  ['CLI source-read settlement preserves inventory order with Promise.all', /return Object\.freeze\(await Promise\.all\(scheduledReads\)\)/.test(composition)],
  ['CLI source-read traversal no longer depends on generic inventory continuation', !/sources\.continueWith\(\{\s*onEmpty:[\s\S]*?onSource:/.test(composition)],
  ['manifest inventory contract continues to use SourceFileInventory', /readonly sources: SourceFileInventory/.test(inventoryContract)],
  ['visitor contract is exported from the core barrel', /SourceFileInventoryVisitorInterface, SourceFileInventoryOperations, SourceFileInventory/.test(barrel)],
  ['focused tests cover order, empty inventory, and formatting', /visits source files in insertion order/.test(visitorTest) && /visits no source for an empty inventory/.test(visitorTest) && /formats the inventory through the domain visitor/.test(visitorTest)],
  ['collections.ts remains empty', collectionBytes === 0],
  ['traced CLI composition has no exported function declarations', !/\bexport\s+(?:async\s+)?function\s+/.test(composition)],
];
const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\nPhase2921 structural audit: ${checks.length - failed.length}/${checks.length} passed\n`);
process.exitCode = failed.length ? 1 : 0;
