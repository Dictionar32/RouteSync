const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const facade = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const facadeContract = read('packages/core/src/types/upstream/laravelSourceAstScannerInterface.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const upstreamTypes = read('packages/core/src/types/upstream/index.ts');

check('scanner facade delegates through pipeline contract while preserving receipt ADT', facade.includes('laravelSourceAstPipeline.execute(invocationInventoryReceipt)') && facade.includes('LaravelSourceAstProjectionJudgment<Receipt>'));
check('scanner facade does not import operations', !facade.includes('operations'));
check('scanner facade does not import semantic relation operators', !facade.includes('/semantic/relations/'));
check('scanner facade owns no source scan function body', !facade.includes('async function scanLaravelSourceAsts'));
check('pipeline implements a closed typed interface', pipeline.includes('LaravelSourceAstPipelineInterface') && pipeline.includes("closed: true"));
check('pipeline retains producer orchestration in wiring layer', pipeline.includes('ModelScanner.scanCanonicalBundle') && pipeline.includes('sourceAstSemanticProducer.produce'));
check('scanner interface remains type-only and closed', facadeContract.includes('readonly closed: true') && facadeContract.includes('readonly scan:'));
check('pipeline interface is exported from upstream type barrel', upstreamTypes.includes("export * from './laravelSourceAstPipelineInterface'"));
check('manifest builder consumes scanner projection interface and its complete ADT arm', manifestBuilder.includes('laravelSourceAstScanner.scan(invocationInventoryReceipt)') && manifestBuilder.includes('laravel_source_ast_projection_complete'));
check('no semantic foundation dependency introduced', !facade.includes('semantic/foundation') && !pipeline.includes('semantic/foundation'));

for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
const failed = checks.filter(result => !result.passed);
console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
