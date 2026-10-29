const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const cliInterface = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const scanFactory = read('packages/cli/src/manifestScanOperationInterface.ts');
const scanCommand = read('packages/cli/src/commands/scan.ts');
const syncCommand = read('packages/cli/src/commands/sync.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const preparation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationAuthority.ts');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const manifest = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collectionsBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const packageJson = JSON.parse(read('package.json'));
const traceFiles = [cli, cliInterface, scanFactory, inventory, authority, preparation, frontend];
const checks = [
  ['scan command consumes injected manifestScanOperation', /composition\.manifestScanOperation/.test(scanCommand) && /manifestScanOperation\.scan\(/.test(scanCommand)],
  ['sync command consumes injected manifestScanOperation', /composition\.manifestScanOperation/.test(syncCommand) && /manifestScanOperation\.scan\(/.test(syncCommand)],
  ['manifest scan factory is interface-first', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze/.test(scanFactory)],
  ['composition authority is interface-first', /export const controllerInvocationManifestCompositionAuthorityFactory:\s*ControllerInvocationManifestCompositionAuthorityFactoryInterface\s*=\s*Object\.freeze/.test(cli)],
  ['manifest builder is interface-first', /export const controllerInvocationManifestBuilder:\s*ControllerInvocationManifestBuilderInterface\s*=\s*Object\.freeze/.test(cli)],
  ['CLI composition calls existing authority compose operation', /controllerInvocationManifestCompositionAuthority\.compose/.test(cli) || /compose:/.test(cli)],
  ['discovery carries SourceFileInventory', /discovered: SourceFileInventory/.test(cli) && /partialSources: SourceFileInventory/.test(cli)],
  ['source inventory ADT provides domain operations', ['include:', 'filter:', 'countMatching:', 'format:', 'visitSources:'].every(name => names.includes(name))],
  ['inventory closure uses SourceFileInventory', /readonly sources: SourceFileInventory/.test(inventory) && /readonly missingSources: SourceFileInventory/.test(inventory)],
  ['preparation builds SourceFileInventory at upstream boundary', /sourceFileInventoryFactory\.empty\(\)/.test(preparation) && /accumulated\.include\(document!\.sourceFile\)/.test(preparation)],
  ['read-batch rejection contract uses SourceFileInventory', /readonly sourceFiles: SourceFileInventory/.test(frontend) && /rejected: SourceFileInventory/.test(frontend)],
  ['CLI source traversal does not map a raw source-file array', /discoveredSourceReadSettlementOperation\.readAll\(\s*discoveredSources/.test(cli) && !/discoveredSources\.map\(/.test(cli)],
  ['CLI terminal contract carries SourceFileInventory', /readonly sourceFiles: SourceFileInventory/.test(cliInterface)],
  ['manifest result retains actionable terminal operation', /continueForDriftAudit/.test(manifest)],
  ['traced production contracts contain no SourceFile[] declaration', traceFiles.every(source => !/SourceFile\[\]/.test(source))],
  ['traced production path contains no export function declarations', traceFiles.every(source => !/\bexport\s+(?:async\s+)?function\s+/.test(source))],
  ['collections.ts remains empty', collectionsBytes === 0],
  ['Phase2919 audit is registered', packageJson.scripts['audit:phase2919-upstream-cli-manifest-runtime'] === 'node scripts/audits/audit-phase2919-upstream-cli-manifest-runtime.cjs'],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
