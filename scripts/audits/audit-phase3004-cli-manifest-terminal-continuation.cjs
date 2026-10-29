const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const check = (name, predicate, detail) => checks.push({ name, passed: Boolean(predicate), detail });

const scanOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const compositionInterface = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scanCommand = read('packages/cli/src/commands/scan.ts');
const syncCommand = read('packages/cli/src/commands/sync.ts');
const upstreamFactory = read('packages/cli/src/upstreamCompositionFactory.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');

check('cli-scan-operation-has-interface-first-export', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze/.test(scanOperation), 'CLI scan factory is exported as a named, explicitly typed operation object.');
check('composition-factory-has-interface-first-export', /export const controllerInvocationManifestCompositionAuthorityFactory:\s*ControllerInvocationManifestCompositionAuthorityFactoryInterface\s*=\s*Object\.freeze/.test(composition), 'Manifest composition factory uses the declared interface as its runtime contract.');
check('composition-authority-is-interface-typed', /export const controllerInvocationManifestCompositionAuthority:\s*ControllerInvocationManifestCompositionAuthorityInterface\s*=/.test(composition), 'Canonical production authority is constructed through the typed factory.');
check('manifest-result-is-operational-adt', compositionInterface.includes('continueForDriftAudit') && compositionInterface.includes('ControllerInvocationManifestTerminalOperationInterface'), 'Every manifest terminal outcome carries a domain continuation.');
check('manifest-builder-outcomes-use-upstream-continuation', composition.includes('fromManifestBuilderJudgment: judgment => judgment.continueWith({'), 'Complete/blocked builder outcomes are translated through the producer-owned continuation.');
check('cli-command-consumes-manifest-adt', scanCommand.includes('scannedManifest.continueForDriftAudit({'), 'CLI scan consumes the manifest terminal ADT through its operation.');
check('scan-no-undefined-validation-sentinel', !scanCommand.includes('manifestContractRejection') && !/if\s*\(manifestContractRejection\s*!==\s*undefined\)/.test(scanCommand), 'Manifest validation rejection is handled at its ADT terminal, not encoded as undefined sentinel data.');
check('scan-rejection-is-domain-handler', /manifestContractValidationOperations\.validate\(resolvedManifest\)\.continueWith\(\{\s*onValidated: \(\) => undefined,\s*onRejected: judgment => \{[\s\S]*?judgment\.violations[\s\S]*?process\.exit\(1\)/.test(scanCommand), 'Rejected validation is handled directly by the rejected-result continuation.');
check('scan-sync-share-one-manifest-operation', scanCommand.includes('composition.manifestScanOperation') && syncCommand.includes('composition.manifestScanOperation'), 'Scan and sync both use the composition-owned manifest scan operation.');
check('cli-composition-uses-typed-scan-factory', upstreamFactory.includes('routeSyncCliManifestScanOperationFactory.create(manifestComposition)'), 'CLI composition reuses the canonical scan operation factory.');
check('no-export-function-in-traced-composition-modules', !/^export\s+(?:async\s+)?function\s+/m.test(scanOperation + '\n' + composition + '\n' + upstreamFactory), 'Traced composition/scan operation modules contain no exported function declarations.');
check('collections-remains-empty', fs.statSync(collectionsPath).size === 0, 'Intentionally empty upstream collections module remains untouched.');
for (const rel of ['packages/core/src/semantic/relations/relationMembership.ts', 'packages/core/src/semantic/relations/relationalSequence.ts', 'packages/core/src/semantic/relations/semanticRelations.ts']) {
  check(`forbidden-relation-foundation-absent:${path.basename(rel)}`, !fs.existsSync(path.join(root, rel)), `${rel} remains absent.`);
}
const failed = checks.filter(c => !c.passed);
const result = { phase: 3004, title: 'CLI Manifest Terminal Continuation and Runtime Trace', passed: checks.length - failed.length, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE3004_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exit(1);
