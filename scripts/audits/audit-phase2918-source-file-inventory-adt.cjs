const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const names = read('packages/core/src/types/upstream/names.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const preparation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationAuthority.ts');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const cliInterface = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const index = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const collectionBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const tracedFiles = [inventory, authority, preparation, frontend, cli, cliInterface];
const checks = [
  ['SourceFileInventory is a source-model ADT, not SourceFile[]', /export type SourceFileInventory =\s*\|/.test(names) && !/SourceFile\[\]/.test(names)],
  ['SourceFileInventory variants own include/filter/count/format/visitSources operations', ['include:', 'filter:', 'countMatching:', 'format:', 'visitSources:'].every(operation => names.includes(operation))],
  ['source inventory contract uses SourceFileInventory', /readonly sources: SourceFileInventory/.test(inventory)],
  ['discovery complete and blocked evidence use SourceFileInventory', /readonly sources: SourceFileInventory/.test(inventory) && /readonly partialSources: SourceFileInventory/.test(inventory)],
  ['discovery appends and blocks through the inventory ADT', /sources: evidence\.sources\.include\(sourceFile\)/.test(inventory) && /partialSources: evidence\.sources/.test(inventory)],
  ['inventory authority reasons over SourceFileInventory operations', /sources\.countMatching\(/.test(authority) && /sourceInventory\.sources\.filter\(/.test(authority)],
  ['preparation authority constructs SourceFileInventory at source-model boundary', /sourceFileInventoryFactory\.empty\(\)/.test(preparation) && /accumulated\.include\(document!\.sourceFile\)/.test(preparation) && !/SourceFile\[\]/.test(preparation)],
  ['source-read rejected batch carries SourceFileInventory rather than SourceFile[]', /readonly sourceFiles: SourceFileInventory/.test(frontend) && /rejected: SourceFileInventory/.test(frontend) && !/SourceFile\[\]/.test(frontend)],
  ['source-read batch accumulates rejected files through include', /rejected\.include\(settlement\.sourceFile\)/.test(frontend)],
  ['CLI discovery operation accepts SourceFileInventory', /discovered: SourceFileInventory/.test(cli) && /partialSources: SourceFileInventory/.test(cli)],
  ['CLI source reads traverse the inventory ADT rather than map over SourceFile[]', /discoveredSourceReadSettlementOperation\.readAll\(\s*discoveredSources/.test(cli) && !/discoveredSources\.map\(/.test(cli)],
  ['CLI terminal contract carries SourceFileInventory', /readonly sourceFiles: SourceFileInventory/.test(cliInterface)],
  ['CLI diagnostics use inventory-owned formatting', /judgment\.sourceFiles\.format\(stringValue\(', '\)\)\.value/.test(read('packages/cli/src/commands/scan.ts')) && /judgment\.sourceFiles\.format\(stringValue\(', '\)\)\.value/.test(read('packages/cli/src/commands/sync.ts'))],
  ['all traced contracts are free of SourceFile[] declarations', tracedFiles.every(source => !/SourceFile\[\]/.test(source))],
  ['SourceFileInventory is exported through the core barrel', /sourceFileInventoryFactory/.test(index) && /SourceFileInventoryVisitorInterface, SourceFileInventoryOperations, SourceFileInventory, SourceFileInventoryFactoryInterface/.test(index)],
  ['discovery contract version reflects the ADT change', /readonly contractVersion: 3/.test(inventory) && /contractVersion: 3/.test(cli)],
  ['collections.ts remains empty', collectionBytes === 0],
  ['no export function declarations remain in the traced CLI runtime', !/\bexport\s+(?:async\s+)?function\s+/.test(cli)],
  ['Phase2918 audit is registered', packageJson.scripts['audit:phase2918-source-file-inventory-adt'] === 'node scripts/audits/audit-phase2918-source-file-inventory-adt.cjs'],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
