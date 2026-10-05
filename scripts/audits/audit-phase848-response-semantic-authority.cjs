const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const producer = read('packages/core/src/compiler/scanner/subscanners/responseProducer.ts');
const high = read('packages/core/src/types/upstream/highLevelContracts.ts');
const descriptor = read('packages/core/src/types/domain/responseDescriptors.ts');
const checks = {
  responseDefinitionDirectProducer: (producer.match(/const definition: ResponseDefinition/g) || []).length === 2,
  responseAstDefinitionReconstructionRemoved: !producer.includes("ResponseAst['definition']"),
  responseProducerReturnsBundle: producer.includes('produce: (input: ResponseProducerInput) => ResponseProducerResult'),
  upstreamResponseSemanticContractAliasRemoved: !high.includes('export type ResponseSemanticContract = ResponseResult'),
  domainResponseSemanticContractRemainsCanonicalCompatibility: descriptor.includes('export type ResponseSemanticContract = ResponseContract'),
  producerTypeIdentityHelperRemoved: !producer.includes('const typeExpression ='),
  producerStringHelperRemoved: !producer.includes('const stringValue ='),
};
const allChecksPassed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({...checks, allChecksPassed}, null, 2));
process.exitCode = allChecksPassed ? 0 : 1;
