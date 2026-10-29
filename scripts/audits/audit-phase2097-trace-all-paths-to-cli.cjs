const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const report = read('docs/traces/PHASE2097_TRACE_ALL_PATHS_TO_CLI.md');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const routes = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cli = read('packages/cli/src/commands/scan.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const checks = [
  ['trace report exists and states read-only scope', report.includes('read-only static trace') && report.includes('No production source files were changed')],
  ['CLI scan command uses invocation composition', cli.includes('buildManifestWithInvocationPipeline')],
  ['composition closes inventory before manifest build', composition.includes('laravelControllerInvocationSemanticJudgmentInventoryAuthority.close') && composition.includes('manifestBuilder.build(terminalOutcome.result.receipt)')],
  ['manifest builder enters source AST scanner', builder.includes('laravelSourceAstScanner.scan(invocationInventoryReceipt)')],
  ['AST pipeline still imports operations', pipeline.includes('../operations')],
  ['AST pipeline still imports semantic relations', pipeline.includes('semantic/relations/')],
  ['controller scanner still calls scanControllerAction', controller.includes('scanControllerAction(')],
  ['route scanner still imports subscanner route producer/emitter', routes.includes('../operations/routeProducer') && routes.includes('../operations/route-scanner')],
  ['report explicitly includes CLI relation helper consumers', report.includes('packages/cli/src/parsers/php/boundaryAdapter.ts')],
  ['report explicitly states foundation deletion is not proven', report.toLowerCase().includes('does not prove that `semantic/foundation` is safe to delete')],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, ok]) => !ok).length;
console.log(`RESULT ${checks.length - failed}/${checks.length}`);
process.exitCode = failed === 0 ? 0 : 1;
