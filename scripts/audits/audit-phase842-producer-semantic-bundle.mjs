import fs from 'node:fs';

const files = {
  resourceProducer: 'packages/core/src/compiler/scanner/subscanners/resourceProducer.ts',
  resourceScanner: 'packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts',
  requestProducer: 'packages/core/src/compiler/scanner/subscanners/requestProducer.ts',
  requestScanner: 'packages/core/src/compiler/scanner/subscanners/FormRequestScanner.ts',
  sourceScanner: 'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
  sourceModel: 'packages/core/src/types/upstream/highLevelSourceModel.ts',
  manifestBuilder: 'packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts',
};

const text = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, 'utf8')]));

const checks = {
  resourceProducerResult: /interface ResourceProducerResult/.test(text.resourceProducer) && /produceResult\(input\): ResourceProducerResult/.test(text.resourceProducer),
  resourceAstMaterializesProducerResult: /resourceProducer\.produceResult\(/.test(text.resourceScanner),
  resourceCanonicalBundle: /scanCanonicalBundle\(/.test(text.resourceScanner) && /definitions: relationProject\(files, item => item\.definition\)/.test(text.resourceScanner),
  requestProducerResult: /interface RequestProducerResult/.test(text.requestProducer) && /produceResult\(input\): RequestProducerResult/.test(text.requestProducer),
  requestAstMaterializesProducerResult: /requestProducer\.produceResult\(/.test(text.requestScanner),
  requestCanonicalBundle: /definitions: Object\.freeze\(relationProject\(results, result => result\.definition\)\)/.test(text.requestScanner),
  scannerCarriesSemanticDefinitions: /resourceDefinitions/.test(text.sourceScanner) && /requestDefinitions/.test(text.sourceScanner),
  manifestConsumesSemanticSeeds: /SemanticContractSeeds/.test(text.manifestBuilder) && /seeds:/.test(text.manifestBuilder),
  contractCatalogUsesResourceSeeds: /sequenceProject\(seeds\.resources/.test(text.sourceModel),
  contractCatalogUsesRequestSeeds: /sequenceProject\(seeds\.requests/.test(text.sourceModel),
  astCompatibilityRetained: /resources: \{ kind: "resource_asts"/.test(text.sourceScanner) && /requests: \{ kind: "request_asts"/.test(text.sourceScanner),
  noLegacyResourceScanInOrchestrator: !/ResourceScanner\.scanAsts/.test(text.sourceScanner),
  noDirectRequestProducerAstInScanner: !/requestProducer\.produce\(/.test(text.requestScanner),
};

for (const [name, ok] of Object.entries(checks)) console.log(`${name}: ${ok ? 'true' : 'false'}`);
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(`allChecksPass: ${failed.length === 0}`);
if (failed.length) process.exit(1);
