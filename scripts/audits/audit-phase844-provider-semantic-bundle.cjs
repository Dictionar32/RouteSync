const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const producer = read('packages/core/src/compiler/scanner/subscanners/providerProducer.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const high = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const manifest = read('packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const checks = {
  providerProducerResult: producer.includes('interface ProviderProducerResult'),
  providerDefinitionAndAstSameResult: producer.includes('definition: ProviderDefinition') && producer.includes('ast: ProviderAst'),
  producerUsesSemanticResult: producer.includes('buildProviderSemanticResultFromSource'),
  canonicalBuilderSingleDefinition: canonical.includes('const definition: ProviderDefinition') && canonical.includes('return { definition, ast:'),
  compatibilityAstRetained: canonical.includes('buildProviderAstFromSource') && canonical.includes('buildProviderSemanticResultFromSource(sourceAst, fileValue, span).ast'),
  scannerCanonicalBundle: canonical.includes('interface ProviderScanBundle') && canonical.includes('scanProviderBundle'),
  sourceAstsCarriesProviderDefinitions: collections.includes('providerDefinitions: readonly import(\'./application\').ProviderDefinition[]'),
  sourceScannerUsesBundle: scanner.includes('scanProviderBundle(sourceProject)') && scanner.includes('const providerDefinitions = providerBundle.definitions'),
  manifestSeedsProviderDefinitions: manifest.includes('providers: scanned.providerDefinitions'),
  highLevelUsesProviderSeeds: high.includes('const providers = seeds.providers') && high.includes('sequenceProject(providers, definition =>'),
  noProductionLegacyProviderScan: !scanner.includes('scanProviderAsts(sourceProject)'),
  noAstToProviderContractInBuilder: !high.includes('providers: sequenceFromArray(sequenceProject(providers, provider => ({\n      kind: \'provider_semantic_node\' as const,\n      identity: provider.definition.name')
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}: ${v}`);
console.log(`allChecksPass: ${Object.values(checks).every(Boolean)}`);
