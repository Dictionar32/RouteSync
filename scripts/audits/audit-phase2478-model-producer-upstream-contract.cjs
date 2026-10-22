const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/laravelModelScanner.ts');
const contract = read('packages/core/src/types/upstream/modelProducerInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const oldProducer = path.join(root, 'packages/core/src/compiler/scanner/subscanners/modelProducer.ts');
const checks = [
  ['Phase2480 supersedes the subscanner producer implementation', !fs.existsSync(oldProducer)],
  ['scanner producer is an interface-typed exported const', /export const modelProducer:\s*ModelProducerInterface<ModelDeclarationAst, PhpClassPropertyAst>\s*= Object\.freeze/.test(scanner)],
  ['producer contract remains declared upstream', /export interface ModelProducerInterface/.test(contract) && /export interface ModelProducerInput/.test(contract) && /export interface ModelProducerResult/.test(contract)],
  ['upstream barrel exports the producer contract', /export \* from [\'\"]\.\/modelProducerInterface[\'\"]/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['scanner has no direct relation/foundation import', !/semantic\/(?:relations|foundation)/.test(scanner)],
  ['producer operation uses the existing upstream result contract', /produceResult:\s*\(input: ModelProducerInput<ModelDeclarationAst, PhpClassPropertyAst>\): ModelProducerResult/.test(scanner)],
  ['phase audit remains registered', Boolean(packageJson.scripts['audit:phase2478-model-producer-upstream-contract'])],
];
const failed = checks.filter(([, passed]) => !passed);
console.log(JSON.stringify({phase:2478,name:'model-producer-upstream-contract-superseded-by-phase2480',passed:checks.length-failed.length,total:checks.length,failed:failed.map(([name]) => name),checks:checks.map(([name,passed]) => ({name,passed}))}, null, 2));
process.exitCode = failed.length ? 1 : 0;
