const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition, detail) => checks.push({ name, pass: Boolean(condition), detail });

const collections = read('packages/core/src/types/upstream/collections.ts');
const resourceFlow = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeComposition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const routeBoundary = read('packages/core/src/compiler/scanner/upstream/routeBoundaryEmitter.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const coreBarrel = read('packages/core/src/index.ts');
const phaseTest = read('packages/core/src/types/upstream/__tests__/route-resource-flow.phase48.test.ts');

check('collections.ts remains intentionally empty', collections.length === 0, `${collections.length} bytes`);
check('resource flow has an explicit operation interface', /export interface RouteResourceFlowOperationsInterface/.test(resourceFlow), 'RouteResourceFlowOperationsInterface exists');
check('resource flow runtime exports a typed frozen operation object', /export const routeResourceFlowOperations:\s*RouteResourceFlowOperationsInterface\s*=\s*Object\.freeze\(/.test(resourceFlow), 'operation object is interface-typed and frozen');
check('resource flow has no exported function declarations', !/export\s+function\s+/.test(resourceFlow), 'public operations are not export function declarations');
check('route declaration authority consumes declaration-level judgment', /routeResourceFlowAuthority/.test(routeScanner) && /routeResourceFlowAuthority/.test(routeComposition) && /resolveDeclaration/.test(routeComposition), 'route scanner wires the authority into declaration composition');
check('route boundary consumes the typed resource flow judgment', /RouteResourceFlowJudgment/.test(routeBoundary), 'downstream boundary uses the ADT type');
check('manifest builder preserves typed source AST projection judgment', /sourceAstPipeline\.execute\(\)/.test(manifestBuilder) && /projection\.kind\s*!==\s*'laravel_source_ast_projection_complete'/.test(manifestBuilder) && /LaravelSourceAstProjectionJudgment/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts')), 'pipeline interface carries the ADT and blocked projection is rejected');
check('operation object is exposed through core runtime barrel', /export\s*\{\s*routeResourceFlowOperations,\s*routeResourceFlowAuthority\s*\}/.test(coreBarrel), 'runtime operations have public barrel exports');
check('tests call operations through the interface object', /routeResourceFlowOperations\.resolveApiResourceFlow/.test(phaseTest) && /routeResourceFlowOperations\.defaultApiResourceRegistration/.test(phaseTest), 'resource-flow tests use object operations');

let failed = false;
for (const item of checks) {
  process.stdout.write(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}\n`);
  if (!item.pass) failed = true;
}
process.stdout.write(`\n${checks.filter(item => item.pass).length}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
