const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '..', '..');
const read = (p) => fs.readFileSync(path.isAbsolute(p) ? p : path.join(repo, p), 'utf8');
const exists = (p) => fs.existsSync(path.isAbsolute(p) ? p : path.join(repo, p));
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.ts')) out.push(p);
  }
  return out;
};
const upstreamFiles = walk(path.join(repo, 'packages/core/src/types/upstream'));
const domainFiles = walk(path.join(repo, 'packages/core/src/types/domain'));
const semanticFiles = walk(path.join(repo, 'packages/core/src/semantic'));
const cliFiles = walk(path.join(repo, 'packages/cli/src'));
const prodCliFiles = cliFiles.filter((p) => !p.includes(`${path.sep}__tests__${path.sep}`));
const compilerImport = /from\s+['"][^'"]*compiler\//;
const coreProdFiles = walk(path.join(repo, 'packages/core/src')).filter((p) => !p.includes(`${path.sep}__tests__${path.sep}`));
const legacy = coreProdFiles.filter((p) => /StaticLaravelScanner|LaravelScanner/.test(read(p)));
const directCliSource = prodCliFiles.filter((p) => /(?:from|import)\s*['"][^'"]*packages\/core\/src\//.test(read(p)));
const relationSource = read('packages/core/src/types/upstream/semanticReferences.ts');
const dataFlow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const boundary = read('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts');
const graphProjection = read('packages/core/src/graph/RouteSyncManifestGraphProjection.ts');
const graphInterface = read('packages/core/src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const dataflowInterface = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts');
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const modelCanonical = read('packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts');
const checks = {
  upstreamNoCompilerImports: upstreamFiles.concat(domainFiles, semanticFiles).every((p) => !compilerImport.test(read(p))),
  canonicalRelationAuthority: relationSource.includes("kind: 'model_relation'") && relationSource.includes("kind: 'route_controller'") && relationSource.includes("kind: 'controller_dependency'"),
  manifestCarriesCanonicalRelations: manifest.includes('readonly relations: SemanticRelationGraph'),
  modelRelationProjectsSemanticRelation: modelCanonical.includes('const semanticRelations = model.relation.semantic'),
  graphConsumesCanonicalRelations: graphProjection.includes('manifest.relations'),
  graphBoundaryIsGenericDirectional: graphInterface.includes('InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>'),
  dataflowBoundaryIsGenericDirectional: dataflowInterface.includes('InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestDataflowSurface>'),
  dataFlowInterfaceGeneric: dataFlow.includes('DataFlowInterface<Input, State, Node>') && !/Laravel|Route|Controller|Model|Resource|Schema/.test(dataFlow),
  dependencyBoundaryGeneric: boundary.includes('InterfaceDependencyBoundary<Upstream, Downstream>'),
  dataflowNoClosureRecompute: /derive:\s*\(current:\s*SemanticDataflowJudgment\)\s*=>\s*current/.test(read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts')) && /close:\s*\(current:\s*SemanticDataflowJudgment\)\s*=>\s*current/.test(read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts')) && !/derive:[^\n]*createSemanticDataflowJudgment/.test(read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts')) && !/close:[^\n]*createSemanticDataflowJudgment/.test(read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts')) ,
  graphRelationDownstreamOwned: exists('packages/core/src/graph/service/graphRelation.ts') && !exists('packages/core/src/types/upstream/graphRelation.ts'),
  legacyProductionEmpty: legacy.length === 0,
  cliProductionUsesPackageSurface: directCliSource.length === 0,
  ecommerceFixture: ['routes','app/Http/Controllers','app/Models','app/Http/Resources','database/migrations','frontend/src/api/schemas'].every((p) => fs.existsSync(path.join(repo, 'examples/ecommerce-shop-source', p))),
  legacyDirectoryPresentButUnreferenced: exists('packages/core/src/compiler/scanner/legacy'),
};
const violations = [];
for (const [k,v] of Object.entries(checks)) if (!v) violations.push(k);
const result = { phase: 1127, direction: 'upstream => wiring => interface => downstream', checks, counts: { upstreamCompilerImports: upstreamFiles.concat(domainFiles, semanticFiles).filter((p)=>compilerImport.test(read(p))).length, legacyRefs: legacy.length, cliCoreSourceImports: directCliSource.length }, violations, passed: violations.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
