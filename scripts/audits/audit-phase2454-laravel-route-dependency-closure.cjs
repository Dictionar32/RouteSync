const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-source-ast-pipeline-scanner-dependency-closure.phase2204.test.ts');
const checks = [
  ['scanner contract owns stable binding authority dependency', /interface LaravelRouteScannerAuthorityInterface[\s\S]*?readonly bindingAuthority: RouteControllerBindingJudgmentAuthority;/.test(contract)],
  ['per-operation route input excludes binding authority', /export interface LaravelRouteScanInput[\s\S]*?readonly controllerScan:[\s\S]*?readonly sourceSelectionIntent: LaravelRouteSourceSelectionIntent;/.test(contract) && !/export interface LaravelRouteScanInput[\s\S]*?bindingAuthority/.test(contract)],
  ['route scanner delegates binding judgment through injected authority', scanner.includes('authorities.bindingAuthority.judge(')],
  ['canonical singleton is explicitly typed by the scanner interface', /export const laravelRouteScanner: LaravelRouteScannerInterface = createLaravelRouteScanner/.test(scanner)],
  ['canonical singleton binds the existing upstream authority', /bindingAuthority: routeControllerBindingAuthority/.test(scanner)],
  ['pipeline passes operation data only', /routeScanner\.prepare\(\{\s*controllerScan,\s*sourceSelectionIntent: input\.routeSelection,\s*\}\)/s.test(pipeline) && !pipeline.includes('bindingAuthority: routeBindingAuthority')],
  ['pipeline dependency contract no longer duplicates scanner authority', !pipelineContract.includes('routeBindingAuthority: RouteControllerBindingJudgmentAuthority') && !pipelineContract.includes('readonly routeBindingAuthority:')],
  ['dependency closure test verifies the singleton authority', test.includes('laravelSourceAstPipelineDependencies.routeScanner.bindingAuthority).toBe(routeControllerBindingAuthority)')],
  ['runtime execute remains parameterless and returns prepared outcome', /async execute\(\)\s*\{\s*return outcome;\s*\}/.test(scanner)],
  ['singleton remains const instance while factory is not const-bound function', scanner.includes('export const laravelRouteScanner: LaravelRouteScannerInterface') && scanner.includes('export function createLaravelRouteScanner(') && !scanner.includes('export const createLaravelRouteScanner =')],
  ['route scanner has no direct legacy relations/foundation/subscanner imports', !/from ['"][^'"]*(?:semantic\/relations|semantic\/foundation|operations\/)[^'"]*['"]/.test(scanner)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2454 route dependency-closure assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
