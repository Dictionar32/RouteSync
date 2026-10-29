const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
let passed = 0;
let failed = 0;
const results = [];
function check(name, condition, detail) {
  results.push({ name, passed: Boolean(condition), detail });
  if (condition) { passed += 1; process.stdout.write(`PASS ${name}: ${detail}\n`); }
  else { failed += 1; process.stderr.write(`FAIL ${name}: ${detail}\n`); }
}
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const rootIndex = read('packages/core/src/index.ts');
const routeProjection = read('packages/core/src/types/upstream/semanticDataflowRouteProjection.ts');
const packageJson = JSON.parse(read('package.json'));
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
check('closed derivation variants preserved', /kind: 'projected'/.test(upstream) && /kind: 'incomplete'/.test(upstream) && /kind: 'conflict'/.test(upstream) && /kind: 'authority_integrity_failed'/.test(upstream), 'semantic outcomes remain distinct; no failures collapsed');
check('upstream ADT owns explicit manifest-domain operation', /readonly toManifestProjectionDisposition: \(\) => Extract</.test(upstream), 'result exposes a zero-argument, RequestType-specific operation');
check('projected outcome constructs projectable disposition', /toManifestProjectionDisposition: \(\) => Object\.freeze\(\{\s*kind: 'request_type_derivation_projectable'/.test(preparation), 'projectable result owns the positive disposition');
check('blocked outcome constructs non-projectable disposition', /toManifestProjectionDisposition: \(\) => Object\.freeze\(\{\s*kind: 'request_type_derivation_not_projectable'/.test(preparation), 'blocked result retains original blocked outcome evidence');
check('consumer-supplied handler API removed from active contract', !/RequestTypeDerivationRuntimeExecutionOutcomeHandlers|continueForManifestProjection/.test(upstream + preparation + lowering + rootIndex), 'no callback visitor required to ask the ADT its domain disposition');
check('lowering calls ADT operation directly', /derivation\.toManifestProjectionDisposition\(\)/.test(lowering), 'lowering does not reinterpret the raw derivation kind');
check('lowering remains exhaustive over explicit domain dispositions', /switch\s*\(disposition\.kind\)/.test(lowering) && /const exhaustive: never = disposition/.test(lowering), 'only the two domain dispositions are eliminated downstream');
check('projected evidence is forwarded into manifest lowering', /requestTypes: projectable\.projection/.test(lowering) && /derivation: projectable/.test(lowering), 'verified request projection and its evidence remain attached');
check('blocked evidence and request ledger are retained', /derivation: disposition\.derivation/.test(lowering) && /requestResolutionLedger/.test(lowering), 'blocked result does not synthesize a manifest');
check('manifest composition consumes lowering ADT', /result\.continue\(\{/.test(composition) && /routeSyncManifestLoweringOperations\.lower/.test(composition), 'canonical manifest lowering remains on the same path');
check('CLI uses injected manifest scan operation', /composition\.manifestScanOperation/.test(scan) && /composition\.manifestScanOperation/.test(sync), 'scan and sync share the injected upstream manifest authority');
check('CLI validates before persistence', /manifestContractValidationOperations\.validate\(resolvedManifest\)/.test(scan) && /manifestContractValidationOperations\.validate\(resolvedManifest\)/.test(sync), 'both commands apply the manifest contract gate before save');
check('old relation foundation stays absent', ['relationMembership.ts','relationalSequence.ts','semanticRelations.ts'].every(name => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name))), 'deleted relation foundation modules were not restored');
check('collections newline sentinel unchanged', fs.statSync(collectionsPath).size === 1 && fs.readFileSync(collectionsPath)[0] === 10, 'collections.ts remains exactly one newline byte');
check('no kernel re-export points to deleted relation foundation', !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(rootIndex), 'core public entrypoint does not restore deleted foundations');
check('upstream runtime projection avoids deleted sequence foundation', !/semantic\/relations\/relationalSequence/.test(routeProjection) && /routeContractItems/.test(routeProjection) && /routeParameterItems/.test(routeProjection), 'uses the concrete source-domain collection shapes without importing the deleted relation module');
check('audit command is registered', packageJson.scripts['audit:phase3019-upstream-manifest-domain-operation'] === 'node scripts/audits/audit-phase3019-upstream-manifest-domain-operation.cjs', 'repeatable audit is available from the package scripts');
const output = { phase: 3019, passed, failed, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE3019_AUDIT.json'), JSON.stringify(output, null, 2) + '\n');
process.stdout.write(`\nPhase 3019 upstream manifest domain-operation audit: ${passed}/${results.length} passed; ${failed} failed.\n`);
if (failed > 0) process.exitCode = 1;
