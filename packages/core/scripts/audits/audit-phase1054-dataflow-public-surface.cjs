const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith('.ts')) files.push(p);
  }
}
walk(path.join(root, 'src'));
const text = files.map((p) => read(path.relative(root, p))).join('\n');
const upstreamIndex = read('src/types/upstream/index.ts');
const coreIndex = read('src/index.ts');
const production = files.filter((p) => !p.includes(`${path.sep}__tests__${path.sep}`));
const productionText = production.map((p) => read(path.relative(root, p))).join('\n');
const checks = {
  canonicalSemanticDataflowFileExists: exists('src/types/upstream/semanticDataflow.ts'),
  legacySemanticDataflowInterfaceFileRemoved: !exists('src/types/upstream/semanticDataflowInterface.ts'),
  noLegacySemanticDataflowInterfaceDeclaration: !/interface\s+SemanticDataflowInterface|type\s+SemanticDataflowInterface|interface\s+SemanticDataFlowInterface|type\s+SemanticDataFlowInterface/.test(text),
  upstreamBarrelExportsCanonicalSemanticDataflow: /export \* from ['"]\.\/semanticDataflow['"]/.test(upstreamIndex),
  upstreamBarrelDoesNotExportAuthorityFactory: !/semanticDataflowAuthority/.test(upstreamIndex),
  coreBarrelExportsRuntimeBoundary: /semanticDataflowRuntimeBoundary/.test(coreIndex),
  coreBarrelExportsGenericDataflow: /export type \{ DataFlowInterface/.test(coreIndex),
  productionFactoryImportCountIsOne: production.filter((p) => /import\s*\{[^}]*createSemanticDataflowDataFlowInterface/.test(read(path.relative(root,p)))).length === 1,
  productionUsesRuntimeBoundary: productionText.includes('semanticDataflowRuntimeBoundary'),
  noOldSemanticDataflowInterfaceImports: !/semanticDataflowInterface/.test(productionText),
  projectionStillUsesGenericDataflow: /DataFlowProjectionInterface/.test(read('src/types/dataflow/dataFlowProjectionInterface.ts')),
  graphStillUsesGenericBoundary: /InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(read('src/graph/ServiceGraphBuilderInterface.ts')),
};
const failed = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
console.log(JSON.stringify({phase:1054, checks, failed, passed: failed.length === 0}, null, 2));
process.exitCode = failed.length ? 1 : 0;
