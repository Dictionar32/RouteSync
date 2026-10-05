const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const upstream = read('packages/core/src/types/upstream/response.ts');
const domain = read('packages/core/src/types/domain/responseContracts.ts');
const descriptors = read('packages/core/src/types/domain/responseDescriptors.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/responseProducer.ts');
const checks = {
  upstreamResponseDefinitionContractIsCanonical: upstream.includes('export interface ResponseDefinitionContract'),
  upstreamCompatibilityAliasRetained: upstream.includes('export type ResponseContract = ResponseDefinitionContract'),
  domainPayloadContractIsDistinct: domain.includes("export interface ResponseContract") && domain.includes("readonly kind: 'object'"),
  domainSemanticAliasTargetsDomainContract: descriptors.includes('export type ResponseSemanticContract = ResponseContract;'),
  producerUsesResponseDefinition: (producer.match(/const definition: ResponseDefinition/g) || []).length === 2,
  producerReturnsSemanticBundle: producer.includes('produce: (input: ResponseProducerInput) => ResponseProducerResult'),
  noAstDefinitionReconstruction: !producer.includes("ResponseAst['definition']"),
};
const allChecksPassed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({...checks, allChecksPassed}, null, 2));
process.exitCode = allChecksPassed ? 0 : 1;
