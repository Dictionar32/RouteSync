const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts');
const evidence = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const checks = [
  ['scanner input is a direct source-bound batch, not a lookup index', /PhpSourceInvocationSemanticPipelineDeliveryBatch/.test(scanner) && !/phpSourceInvocationSemanticPipelineResultForSource/.test(scanner)],
  ['scanner dispatches on supplied-versus-bound source entry variants', /php_source_invocation_pipeline_not_supplied/.test(scanner) && /php_source_invocation_pipeline_source_bound/.test(scanner)],
  ['no ambiguous index outcome remains in semantic composition evidence', !/pipeline_result_ambiguous/.test(evidence) && !/integration_result_ambiguous/.test(integrationInterface)],
  ['integration projects complete and blocked judgments without reconstruction', /projectConnectedResult/.test(integration) && /php_source_invocation_integration_complete/.test(integrationInterface) && /php_source_invocation_integration_blocked/.test(integrationInterface)],
  ['integration contract version reflects delivery semantics', /version: 7/.test(integrationInterface) && /deliverySemantics/.test(integrationInterface)],
  ['source binding rejection remains an explicit integrated outcome', /php_source_invocation_integration_source_binding_rejected/.test(integrationInterface)],
  ['controller parser receives the integrated evidence chain', /parseControllerDeclaration\(source, tokens, createAstIdentifier\(controllerName\), fullPath, integratedResponse\)/.test(scanner)],
  ['delivery contract forbids source-to-result lookup in scanner', /does-not-query-an-index/.test(read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface.ts'))],
  ['old index implementation is retired', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineResultIndex.ts').trim().length === 0],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test([scanner, evidence, integrationInterface, integration].join('\n'))],
];
let failed = 0;
for (const [name, passed] of checks) { process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`); failed += Number(!passed); }
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
