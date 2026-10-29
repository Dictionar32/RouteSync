const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const pipelineInterface = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelSourceAstScannerInterface.ts');
const builderInterface = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const controllerScanner = read('packages/core/src/compiler/scanner/operations/ControllerScanner.ts');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const inventoryAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const packageJson = JSON.parse(read('package.json'));

check('pipeline interface requires closure receipt', /execute: \(invocationInventoryReceipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt\)/.test(pipelineInterface) && !/invocationInventoryReceipt\?/.test(pipelineInterface));
check('pipeline interface is versioned', /contractVersion: 2/.test(pipelineInterface));
check('scanner interface requires closure receipt', /scan: \(invocationInventoryReceipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt\)/.test(scannerInterface) && !/invocationInventoryReceipt\?/.test(scannerInterface));
check('scanner facade forwards receipt without separate project identity', /scan: \(invocationInventoryReceipt:[\s\S]*?laravelSourceAstPipeline\.execute\(invocationInventoryReceipt\)/.test(scanner));
check('pipeline derives source project from receipt', /const sourceProject: SourceProjectIdentity = invocationInventoryReceipt\.sourceInventory\.sourceProject/.test(pipeline));
check('manifest builder interface requires receipt only', /build: \(invocationInventoryReceipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt\)/.test(builderInterface) && !/build: \(sourceProject:/.test(builderInterface));
check('manifest builder derives source project from receipt', /const sourceProject: SourceProjectIdentity = invocationInventoryReceipt\.sourceInventory\.sourceProject/.test(builder));
check('CLI passes authority-closed receipt into manifest builder', /manifestBuilder\.build\(inventoryResult\.receipt\)/.test(cli) && !/manifestBuilder\.build\(sourceProject,/.test(cli));
check('controller subscanner no longer has no-receipt fallback', /invocationInventoryReceipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(controllerScanner) && !/collectPhpFiles/.test(controllerScanner) && !/invocationInventoryReceipt\?/.test(controllerScanner));
check('controller boundary records receipt-only pipeline entry', /version: 46/.test(boundary) && /pipelineEntryBoundary/.test(boundary));
check('inventory authority avoids forbidden semantic dependencies', !/semantic\/foundation|semantic\/relations|semantic\/relation/.test(inventoryAuthority));
check('manifest builder is registered as closed versioned interface', /kind: 'manifest_builder',[\s\S]*?closed: true,[\s\S]*?contractVersion: 2/.test(builder));
check('test fixtures create explicit not-connected receipts', fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/__test__/createNotConnectedControllerInventoryReceipt.ts')));
check('package audit command registered', packageJson.scripts?.['audit:phase1837-required-controller-inventory-receipt'] === 'node scripts/audits/audit-phase1837-required-controller-inventory-receipt.cjs');

for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`${checks.filter(result => result.passed).length}/${checks.length} checks passed`);
if (checks.some(result => !result.passed)) process.exitCode = 1;
