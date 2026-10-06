const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const coreIndex = read('src/index.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const graphInterface = read('src/graph/ServiceGraphBuilderInterface.ts');
const manifest = read('src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const composition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const runtimeBoundary = read('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');

const checks = {
  graphConcreteClassNotPublicFromCore: !/export\s*\{\s*ServiceGraphBuilder\s*\}\s*from ['"]\.\/graph\/ServiceGraphBuilder['"]/.test(coreIndex),
  graphFactoryIsPublicFromCore: /export\s*\{\s*createServiceGraphBuilder\s*\}\s*from ['"]\.\/graph\/ServiceGraphBuilder['"]/.test(coreIndex),
  graphInterfaceIsPublicFromCore: /export\s*type\s*\{\s*ServiceGraphBuilderInterface\s*\}\s*from ['"]\.\/graph\/ServiceGraphBuilderInterface['"]/.test(coreIndex),
  graphFactoryReturnsInterface: /createServiceGraphBuilder\s*=\s*\(\)\s*:\s*ServiceGraphBuilderInterface/.test(graph),
  graphInterfaceOwnsProjectionBoundary: /extends InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(graphInterface),
  manifestBuilderIsInterfaceTyped: /export const manifestBuilder:\s*ManifestBuilderInterface/.test(manifest),
  dataflowCompositionOwnsConcreteFactory: /project:\s*createSemanticDataflowDataFlowInterface/.test(composition),
  runtimeBoundaryIsInterfaceTyped: /export interface SemanticDataflowRuntimeBoundary/.test(runtimeBoundary),
  noConcreteGraphClassExportInCoreIndex: !/ServiceGraphBuilder\s*[,}]/.test(coreIndex.split('\n').filter(l => l.includes('ServiceGraphBuilder')).join('\n')) || /createServiceGraphBuilder/.test(coreIndex),
};
const result = { checks, passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
