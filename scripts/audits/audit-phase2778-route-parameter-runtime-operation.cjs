const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });

const collection = read('packages/core/src/types/upstream/collections.ts');
const capability = read('packages/core/src/types/upstream/routeParameterCapability.ts');
const barrel = read('packages/core/src/index.ts');
const emitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const lowerer = read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts');
const scanAdt = read('packages/core/src/types/upstream/sourceScanJudgment.ts');

check('collection module remains empty by request', collection.length === 0, `${collection.length} bytes`);
check('route parameter capability defines an explicit operation interface', /export interface RouteParameterCapabilityOperationsInterface/.test(capability), 'named contract exists');
check('runtime authority is exported as a typed frozen object', /export const routeParameterCapabilityOperations:\s*RouteParameterCapabilityOperationsInterface\s*=\s*Object\.freeze\(/.test(capability), 'object is frozen and interface-typed');
check('route parameter module has no exported function declarations', !/export\s+function\s+/.test(capability), 'all public runtime functions replaced by object members');
check('route parameter module exposes no legacy function exports', !/export\s+function\s+(routeParameterCapabilityFromRoute|routeParameterCapabilityReferenceFromCapability|routeParameterCapabilityReferencesFromRoute|routeParameterCapabilityReferenceFromRoute|routeTargetScopeFromRoute)/.test(capability), 'legacy names are not standalone exports');
check('core barrel exports the operation authority and interface', /export \{ routeParameterCapabilityOperations \}/.test(barrel) && /export type \{ RouteParameterCapabilityOperationsInterface \}/.test(barrel), 'public package boundary updated');
check('CLI SDK emitter calls the runtime object', /routeParameterCapabilityOperations\.targetScopeFromRoute/.test(emitter) && /routeParameterCapabilityOperations\.referenceFromRoute/.test(emitter) && /routeParameterCapabilityOperations\.referencesFromRoute/.test(emitter), 'actual CLI generation path consumes operation object');
check('source-AST pipeline remains the upstream manifest builder input', /sourceAstPipeline\.execute\(\)/.test(manifestBuilder), 'builder consumes source AST pipeline');
check('manifest lowering remains typed and operation-oriented', /RouteSyncManifestLoweringOperationsInterface/.test(lowerer) && /routeSyncManifestLoweringOperations/.test(lowerer), 'lowering contract and object exist');
check('source scan ADT is present but not falsely claimed as wired end-to-end', /SourceScanJudgment/.test(scanAdt) && !/SourceScanJudgment/.test(sourcePipeline), 'ADT definitions exist; pipeline integration remains outstanding');

let failed = false;
for (const item of checks) {
  process.stdout.write(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}\n`);
  if (!item.ok) failed = true;
}
process.stdout.write(`\n${checks.filter((item) => item.ok).length}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
