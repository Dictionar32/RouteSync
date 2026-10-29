const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const delivery = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/ControllerScanner.ts');
const cli = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const checks = [
  ['delivery batch is a typed interface with explicit contract version', /interface PhpSourceInvocationSemanticPipelineDeliveryBatch/.test(delivery) && /contractVersion: 1/.test(delivery)],
  ['delivery contract makes source provenance an invariant', /each-delivered-result-retains-the-source-file-identity/.test(delivery)],
  ['delivery contract prohibits scanner-side index lookup', /does-not-query-an-index/.test(delivery)],
  ['CLI creates delivery from closed pipeline results', /phpSourceInvocationSemanticPipelineDeliveryBatchFromResults/.test(cli) && /documents\.map\(analyzePhpSourceInvocationSemanticPipeline\)/.test(cli)],
  ['composition root injects delivery batch into manifest builder', /manifestBuilder\.build\(sourceProject, invocationPipelineDelivery\)/.test(composition)],
  ['scanner iterates direct delivered results instead of resolving by path', /invocationPipelineDelivery\.entries\.map/.test(scanner) && !/phpSourceInvocationSemanticPipelineResultForSource|pipelineLookup/.test(scanner)],
  ['scanner still preserves the explicit not-connected outcome when no batch is injected', /php_source_invocation_pipeline_not_connected/.test(scanner)],
  ['scanner preserves source binding judgment through declaration parsing', /phpSourceInvocationPipelineEvidenceFromSourceBinding/.test(scanner) && /integratedResponse\)/.test(scanner)],
  ['integrated response no longer exposes index ambiguity as a semantic outcome', !/integration_result_ambiguous|indexSemantics/.test(integration) && /deliverySemantics/.test(integration)],
  ['old index module is emptied and no longer exported', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineResultIndex.ts').trim().length === 0 && !/phpSourceInvocationSemanticPipelineResultIndex/.test(read('packages/core/src/index.ts'))],
  ['no forbidden semantic foundation dependency', !/semantic\/foundation/.test([delivery, scanner, cli, composition].join('\n'))],
];
let failed = 0;
for (const [name, passed] of checks) { process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`); failed += Number(!passed); }
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
