const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
function check(name, condition, detail) {
  checks.push({ name, status: condition ? 'PASS' : 'FAIL', detail });
}
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const authority = read('packages/core/src/compiler/semantic/controllerReturnSemanticProductionAuthority.ts');
const contract = read('packages/core/src/types/upstream/controllerReturnSemanticProductionInterface.ts');
const routeComposition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const resourceBinding = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const rewriteAuthority = read('packages/core/src/types/upstream/semanticRewriteAuthority.ts');

check('active route scanner binds the upstream production authority', scanner.includes("controllerReturnSemanticProductionAuthority") && scanner.includes('routeDeclarationEvidenceFromAst(declaration, file, controllerReturnSemanticProductionAuthority)'), 'The active wiring injects the authority into route declaration evidence conversion.');
check('active route scanner no longer imports the legacy closure producer', !scanner.includes('controllerReturnSemanticFromValues') && !scanner.includes("subscanners/controller/controllerAstCanonical"), 'No direct legacy closure-return producer import remains in route scanner wiring.');
check('runtime closure producer const-function adapter removed', !scanner.includes('routeClosureReturnSemanticProduction') && !scanner.includes('ControllerReturnSemanticProductionInput'), 'The local const object/arrow adapter has been removed from runtime wiring.');
check('runtime scanner factory is a function declaration, not a const arrow', scanner.includes('export function createLaravelRouteScanner(') && !scanner.includes('export const createLaravelRouteScanner ='), 'The scanner factory no longer uses a const-bound function expression.');
check('existing upstream producer contract reused', contract.includes('ControllerReturnSemanticProductionInterface') && authority.includes('ControllerReturnSemanticProductionInterface<readonly PhpAstValue[]>'), 'No duplicate producer interface was introduced.');
check('new producer implementation has no direct legacy imports', !authority.includes('subscanners/') && !authority.includes('semantic/relations') && !authority.includes('semantic/foundation'), 'No direct legacy-folder import exists in the closure-return producer implementation.');
check('route composition remains parameterized by an explicit producer', routeComposition.includes('returnSemanticProduction: ControllerReturnSemanticProductionInterface<readonly PhpAstValue[]>'), 'The source-to-evidence operation receives the producer explicitly.');

const openDebt = [
  { name: 'expression projection transitive dependency', status: 'OPEN', detail: 'The producer calls phpAstExpressionSemanticAuthority, whose implementation still imports semantic/relations.' },
  { name: 'resource-model binding relation engine', status: 'OPEN', detail: 'resourceModelBindingAuthority and semanticRewriteAuthority/interface still import semantic/relations; full relation/foundation removal is not complete.' },
  { name: 'whole scanner subscanner retirement', status: 'OPEN', detail: 'This phase removes the closure-return producer dependency only; other active scanner paths may still use subscanners.' },
];
for (const item of checks) console.log(`${item.status} ${item.name}: ${item.detail}`);
for (const item of openDebt) console.log(`${item.status} ${item.name}: ${item.detail}`);
const failed = checks.filter((item) => item.status === 'FAIL');
console.log(`\nPhase2452 scoped checks: ${checks.length - failed.length}/${checks.length} passed; ${openDebt.length} architecture debts remain open.`);
process.exitCode = failed.length === 0 ? 0 : 1;
