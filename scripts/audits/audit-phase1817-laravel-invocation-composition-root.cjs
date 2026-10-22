const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['manifest builder interface accepts source-bound delivery batch', /PhpSourceInvocationSemanticPipelineDeliveryBatch/.test(read('packages/core/src/types/upstream/manifestBuilderInterface.ts'))],
  ['manifest builder forwards supplied results to the core scanner', /laravelSourceAstScanner\.scan\(sourceProject,\s*invocationPipelineDelivery\)/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['CLI composition root builds typed whole-file documents from controller sources', /kind:\s*'php_source_document'/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts')) && /kind:\s*'php_source_text'/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['CLI composition root runs batch pipeline before manifest construction', /analyzePhpSourceInvocationSemanticPipelineBatch\(documents\)/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts')) && /manifestBuilder\.build\(sourceProject,\s*invocationPipelineDelivery\)/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['scan command uses injected pipeline composition', /buildManifestWithInvocationPipeline\(sourceProject\)/.test(read('packages/cli/src/commands/scan.ts'))],
  ['sync command uses injected pipeline composition', /buildManifestWithInvocationPipeline\(sourceProject\)/.test(read('packages/cli/src/commands/sync.ts'))],
  ['drift audit uses injected pipeline composition', /buildManifestWithInvocationPipeline\(createLaravelSourceProjectIdentity\(cwd\)\)/.test(read('packages/cli/src/commands/audit/driftAuditor.ts'))],
  ['core does not import the CLI adapter', !/packages\/cli/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts')) && !/packages\/cli/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['no semantic foundation dependency introduced', !['packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts', 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts', 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'].some((file) => /semantic\/foundation/.test(read(file)))],
  ['audit stays under scripts/audits', fs.existsSync(path.join(root, 'scripts/audits/audit-phase1817-laravel-invocation-composition-root.cjs'))],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
