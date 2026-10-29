const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const delivery = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/ControllerScanner.ts');
const cli = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const checks = [
  ['source-bound delivery has a named interface contract', /interface PhpSourceInvocationSemanticPipelineDeliveryBatch/.test(delivery) && /PhpSourceInvocationSemanticPipelineDeliveryContract/.test(delivery)],
  ['delivery entries retain closed pipeline results and document provenance', /entries: readonly PhpSourceInvocationSemanticPipelineResult\[\]/.test(delivery) && /source-file-identity/.test(delivery)],
  ['scanner consumes delivered entries directly without source lookup', /invocationPipelineDelivery\.entries\.map/.test(scanner) && !/phpSourceInvocationSemanticPipelineResultForSource/.test(scanner)],
  ['scanner source binding uses the delivered result itself', /pipelineResult: sourceInput\.pipelineResult/.test(scanner)],
  ['CLI factory returns direct delivery batch', /PhpSourceInvocationSemanticPipelineDeliveryBatch/.test(cli) && /phpSourceInvocationSemanticPipelineDeliveryBatchFromResults/.test(cli)],
  ['old index contract is retired from active source', !/PhpSourceInvocationSemanticPipelineResultIndex|phpSourceInvocationSemanticPipelineResultForSource/.test([delivery, scanner, cli].join('\n'))],
  ['public manifest/scanner/pipeline interfaces share the delivery contract', ['packages/core/src/types/upstream/manifestBuilderInterface.ts','packages/core/src/types/upstream/laravelSourceAstScannerInterface.ts','packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'].every(file => /PhpSourceInvocationSemanticPipelineDeliveryBatch/.test(read(file)))],
  ['core exports delivery contract', /phpSourceInvocationSemanticPipelineDeliveryInterface/.test(read('packages/core/src/index.ts')) && /phpSourceInvocationSemanticPipelineDeliveryInterface/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test([delivery, scanner, cli].join('\n'))],
  ['retired index source file is empty rather than duplicated', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineResultIndex.ts').trim().length === 0],
];
let failed = 0;
for (const [name, passed] of checks) { process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`); failed += Number(!passed); }
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
