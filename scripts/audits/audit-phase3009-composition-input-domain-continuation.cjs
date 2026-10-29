const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const drift = read('packages/cli/src/commands/audit/driftAuditor.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.readFileSync(collectionsPath);
const relationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
check('composition input has domain continuation operation', /continueToCanonicalization\s*:\s*\(/.test(contract), 'Input ADT exposes continueToCanonicalization.');
check('canonical input factory is interface-first frozen export', /export const controllerInvocationManifestCompositionInputFactory:\s*ControllerInvocationManifestCompositionInputFactoryInterface\s*=\s*Object\.freeze\(/.test(contract), 'Factory has explicit interface annotation and frozen operation object.');
check('factory forwards canonicalization result through domain handlers', /canonicalization\.canonicalize\([\s\S]*?identity\.continueWith\([\s\S]*?onBlocked:\s*continuation\.onBlocked[\s\S]*?onCanonicalized:[\s\S]*?continuation\.onCanonicalized\(canonicalIdentity, routeSelection\)/.test(contract), 'Input continuation preserves route-selection identity while following canonicalization outcome.');
check('composition authority delegates to input operation', /input\.continueToCanonicalization\(dependencies\.sourceProjectIdentityCanonicalization/.test(composition), 'Authority no longer unpacks sourceProject to start canonicalization.');
check('route selection remains a single explicit downstream field', /inventoryClosureOperation\.close\(inventoryResult, routeSelection, dependencies\.manifestBuilderPreparation\)/.test(composition) && /invocationInventoryReceipt:\s*validatedInventory\.receipt,\s*routeSelection,/.test(composition), 'Same route-selection value reaches manifest-builder input.');
check('scan command uses canonical composition input factory', /controllerInvocationManifestCompositionInputFactory\.create\(/.test(scan) && !/kind:\s*'controller_invocation_manifest_composition_input'/.test(scan), 'No raw composition-input object is constructed in scan command.');
check('sync command uses canonical composition input factory', /controllerInvocationManifestCompositionInputFactory\.create\(/.test(sync) && !/kind:\s*'controller_invocation_manifest_composition_input'/.test(sync), 'No raw composition-input object is constructed in sync command.');
check('drift audit uses canonical composition input factory', /controllerInvocationManifestCompositionInputFactory\.create\(/.test(drift) && !/kind:\s*'controller_invocation_manifest_composition_input'/.test(drift), 'No raw composition-input object is constructed in drift audit.');
check('traced production files have no exported function declarations', !/^\s*export\s+function\s+/m.test(contract + '\n' + composition + '\n' + scan + '\n' + sync + '\n' + drift), 'Scoped modules remain interface-first operation objects.');
check('collections.ts remains whitespace-only', /^\s*$/.test(collectionsBytes.toString('utf8')), `collections.ts bytes=${collectionsBytes.length}; no semantic content added.`);
check('deleted relation foundations remain absent', relationPaths.every(file => !fs.existsSync(path.join(root, file))), 'No deleted relation foundation module restored.');
const result = { phase: 3009, audit: 'composition-input-domain-continuation', passed: checks.filter(c => c.pass).length, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE3009_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
for (const item of checks) process.stdout.write(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}\n`);
process.stdout.write(`RESULT ${result.passed}/${result.total}\n`);
if (result.passed !== result.total) process.exitCode = 1;
