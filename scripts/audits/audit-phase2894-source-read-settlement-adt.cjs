const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const core = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['fulfilled reader operation has a named upstream ADT variant', core.includes('PhpSourceDocumentReadOperationFulfilledEvidence') && core.includes("kind: 'php_source_document_read_operation_fulfilled'")],
  ['rejected reader operation has a named upstream ADT variant', core.includes('PhpSourceDocumentReadOperationRejectedEvidence') && core.includes("kind: 'php_source_document_read_operation_rejected'")],
  ['settlement variants provide domain continuation', core.includes('PhpSourceDocumentReadOperationSettlementHandlers') && core.includes('continueWith: <Result>(handlers: PhpSourceDocumentReadOperationSettlementHandlers<Result>) => Result')],
  ['domain batch factory owns fulfilled/rejected classification', core.includes('phpSourceDocumentReadOperationBatchFactory') && core.includes('fromSettlements') && core.includes('PhpSourceDocumentReadOperationBatchRejectedEvidence')],
  ['composition delegates batch outcome through ADT continuation', composition.includes('phpSourceDocumentReadOperationBatchFactory.fromSettlements(settledSourceReads).continueWith({')],
  ['composition does not classify settled outcomes with filter or if', !composition.includes('settledSourceReads.filter') && !composition.includes('if (rejectedReadOperations.length > 0)')],
  ['composition maps Promise rejection to the domain settlement constructor', composition.includes('phpSourceDocumentReadOperationSettlementFactory.rejected(requestedSourceFile)')],
  ['upstream barrel exports the existing source frontend contract module', upstreamBarrel.includes("export * from './phpSourceFrontendInterface'")],
  ['collections.ts remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['composition has no exported function declarations', !/^\s*export\s+function\s/m.test(composition)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
