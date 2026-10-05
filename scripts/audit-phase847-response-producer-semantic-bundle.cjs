const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const producer = read('packages/core/src/compiler/scanner/subscanners/responseProducer.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/responseScanner.ts');
const orchestrator = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const model = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const builder = read('packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const checks = {
  responseProducerResultClosed: /interface ResponseProducerResult[\s\S]*readonly definition: ResponseDefinition;[\s\S]*readonly ast: ResponseAst;/.test(producer),
  producerReturnsBundle: /produce:\s*\(input: ResponseProducerInput\) => ResponseProducerResult/.test(producer),
  scannerBundleClosed: /interface ResponseScannerBundle[\s\S]*readonly definitions: readonly ResponseDefinition\[\][\s\S]*readonly asts: readonly ResponseAst\[\]/.test(scanner),
  scannerProjectsCanonicalDefinitions: /relationProject\(results, result => result\.definition\)/.test(scanner),
  scannerProjectsCanonicalAsts: /relationProject\(results, result => result\.ast\)/.test(scanner),
  orchestratorUsesBundle: /scanResponseBundle\(sourceProject\)/.test(orchestrator) && !/scanResponseAsts\(sourceProject\)/.test(orchestrator),
  sourceCarriesResponseDefinitions: /readonly responseDefinitions: readonly import\('\.\/response'\)\.ResponseDefinition\[\]/.test(collections),
  builderSeedsResponses: /responses:\s*scanned\.responseDefinitions/.test(builder),
  modelConsumesDefinitions: /const responses = seeds\.responses;/.test(model),
  noResponseAstSemanticProjection: !/responseNodeFromAst/.test(model),
  compatibilityScannerRetained: /export async function scanResponseAsts/.test(scanner),
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}: ${v}`);
const all = Object.values(checks).every(Boolean);
console.log(`allChecksPassed: ${all}`);
process.exit(all ? 0 : 1);
