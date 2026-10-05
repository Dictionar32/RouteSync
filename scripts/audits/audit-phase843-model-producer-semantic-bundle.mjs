import fs from 'node:fs';

const files = {
  producer: 'packages/core/src/compiler/scanner/subscanners/modelProducer.ts',
  scanner: 'packages/core/src/compiler/scanner/subscanners/ModelScanner.ts',
  orchestrator: 'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
  collections: 'packages/core/src/types/upstream/collections.ts',
  sourceModel: 'packages/core/src/types/upstream/highLevelSourceModel.ts',
  manifest: 'packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts',
};
const text = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, fs.readFileSync(f, 'utf8')]));
const checks = {
  modelProducerResult: /interface ModelProducerResult/.test(text.producer) && /produceResult\(input\): ModelProducerResult/.test(text.producer),
  modelDefinitionFromSameAst: /const ast = modelAstFromSemantic\(/.test(text.producer) && /return \{ definition: ast\.definition, ast \}/.test(text.producer),
  modelCanonicalBundle: /scanModelBundle\(/.test(text.scanner) && /definitions: Object\.freeze\(relationProject\(results, result => result\.definition\)\)/.test(text.scanner),
  orchestratorUsesCanonicalBundle: /ModelScanner\.scanCanonicalBundle\(/.test(text.orchestrator) && /const modelDefinitions = modelBundle\.definitions/.test(text.orchestrator),
  sourceAstsCarriesModelDefinitions: /readonly modelDefinitions: readonly import\('\.\/model'\)\.ModelDefinition\[\]/.test(text.collections),
  manifestConsumesModelSeeds: /models: scanned\.modelDefinitions/.test(text.manifest),
  contractCatalogUsesModelSeeds: /sequenceProject\(seeds\.models/.test(text.sourceModel),
  astCompatibilityRetained: /models: \{ kind: "model_asts"/.test(text.orchestrator),
  noDirectModelProducerAstPath: !/modelProducer\.produce\(/.test(text.scanner),
  noAstToContractModelProjection: !/sequenceProject\(models, modelNodeFromAst\)/.test(text.sourceModel),
};
for (const [name, ok] of Object.entries(checks)) console.log(`${name}: ${ok ? 'true' : 'false'}`);
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(`allChecksPass: ${failed.length === 0}`);
if (failed.length) process.exit(1);
