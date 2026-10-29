const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });

const collection = read('packages/core/src/types/upstream/collections.ts');
const authority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const barrel = read('packages/core/src/index.ts');
const producer = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const lowerer = read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts');
const scanAdt = read('packages/core/src/types/upstream/sourceScanJudgment.ts');

check('collections.ts stays empty as explicitly requested', collection.length === 0, `${collection.length} bytes`);
check('operation identity authority has an explicit interface', /export interface OperationIdentityCapabilityAuthorityOperationsInterface/.test(authority), 'named operation contract exists');
check('operation identity runtime is an interface-typed frozen object', /export const operationIdentityCapabilityAuthorityOperations:\s*OperationIdentityCapabilityAuthorityOperationsInterface\s*=\s*Object\.freeze\(/.test(authority), 'public operations are frozen and typed');
check('authority module exports no function declarations', !/export\s+function\s+/.test(authority), 'exported runtime behavior is object-based');
check('legacy public function names are absent from authority module', !/export\s+function\s+(createOperationIdentityCapabilityAuthority|operationIdentityCapabilityFromRoute|materializeOperationIdentityCapability)/.test(authority), 'no standalone exported function APIs remain');
check('scanner producer calls operation object directly', /operationIdentityCapabilityAuthorityOperations\.materialize\(boundary\.capability\)/.test(producer), 'real scanner runtime path uses the operation object');
check('old authority call is absent from scanner producer', !/operationIdentityCapabilityAuthority\.fromRoute\(/.test(producer), 'producer no longer calls legacy method name');
check('public core barrel exports object and interface', /operationIdentityCapabilityAuthorityOperations/.test(barrel) && /OperationIdentityCapabilityAuthorityOperationsInterface/.test(barrel), 'public package boundary is updated');
check('AST judgment still feeds manifest builder', /sourceAstPipeline\.execute\(\)/.test(manifestBuilder) && /LaravelSourceAstProjectionJudgment/.test(sourcePipeline), 'source scan → AST judgment → manifest builder trace remains present');
check('manifest lowering remains operation-oriented', /RouteSyncManifestLoweringOperationsInterface/.test(lowerer) && /routeSyncManifestLoweringOperations/.test(lowerer), 'lowering contract and runtime object exist');
check('scan ADT is not falsely claimed to be integrated', /SourceScanJudgment/.test(scanAdt) && !/SourceScanJudgment/.test(sourcePipeline), 'integration remains a documented gap');

let failed = false;
for (const item of checks) {
  process.stdout.write(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}\n`);
  if (!item.ok) failed = true;
}
process.stdout.write(`\n${checks.filter((item) => item.ok).length}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
