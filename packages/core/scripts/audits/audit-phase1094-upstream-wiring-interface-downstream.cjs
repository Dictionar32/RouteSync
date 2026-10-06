const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const src = path.join(root, 'src');
const upstream = path.join(src, 'types', 'upstream');
const cliRoot = path.resolve(root, '..', 'cli', 'src');

const read = file => fs.readFileSync(file, 'utf8');
const walk = dir => {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) files.push(full);
  }
  return files;
};

const upstreamFiles = walk(upstream).filter(file => !file.includes(`${path.sep}__tests__${path.sep}`));
const upstreamSourceFiles = upstreamFiles.filter(file => !file.endsWith('.md'));
const cliFiles = walk(cliRoot);

const upstreamBoundaryImports = upstreamSourceFiles.filter(file => {
  const text = read(file);
  return text.split('\n').some(line => /^\s*import(?:\s+type)?\s+.*(?:InterfaceDependencyBoundary|DataFlowProjectionInterface|DataFlowInterface)/.test(line));
});

const cliInternalImports = cliFiles.filter(file => {
  const text = read(file);
  return /@routesync\/core\/src|packages\/core\/src|types\/upstream/.test(text);
});

const adapter = read(path.join(src, 'compiler', 'analysis', 'semanticDataflowDataFlowAdapter.ts'));
const runtimeBoundary = read(path.join(src, 'compiler', 'analysis', 'semanticDataflowRuntimeBoundary.ts'));
const composition = read(path.join(src, 'compiler', 'analysis', 'semanticDataflowRuntimeComposition.ts'));
const dataflow = read(path.join(src, 'types', 'dataflow', 'dataFlowInterface.ts'));
const projection = read(path.join(src, 'types', 'dataflow', 'dataFlowProjectionInterface.ts'));
const boundary = read(path.join(src, 'types', 'interfaces', 'interfaceDependencyBoundary.ts'));
const index = read(path.join(src, 'index.ts'));

const staticScannerFiles = walk(src).filter(file => /StaticLaravelScanner/i.test(path.basename(file)));
const staticScannerRefs = walk(src).filter(file => /StaticLaravelScanner/.test(read(file)) && !/PHASE/.test(file));

const checks = {
  upstreamDoesNotDependOnDownstreamBoundary: upstreamBoundaryImports.length === 0,
  cliUsesPackageSurfaceNotCoreSource: cliInternalImports.length === 0,
  runtimeBoundaryIsDownstreamOwned: /extends InterfaceDependencyBoundary<\s*SemanticDataflowInput/.test(runtimeBoundary),
  adapterProjectsCanonicalUpstreamIntoGenericDataflow: /SemanticDataflowRuntimeDataFlow/.test(adapter) && /createSemanticDataflowJudgment/.test(adapter),
  compositionOwnsConcreteWiring: /project:\s*createSemanticDataflowDataFlowInterface/.test(composition),
  genericDataflowHasNoLaravelDomainTerms: !/(Laravel|Route|Controller|Model|Resource|Schema|Manifest|Graph)/.test(dataflow),
  projectionIsStrictDataflowSpecialization: /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output/.test(projection),
  dependencyBoundaryDirectionIsUpstreamToDownstream: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  dataflowPublicContractIsExported: /export type \{ DataFlowInterface/.test(index) && /export type \{ DataFlowProjectionInterface/.test(index),
  dependencyBoundaryPublicContractIsExported: /export type \{ InterfaceDependencyBoundary/.test(index),
  staticLaravelScannerImplementationAbsent: staticScannerFiles.length === 0,
  staticLaravelScannerProductionReferenceAbsent: staticScannerRefs.length === 0,
};

const result = {
  phase: 1094,
  checks,
  upstreamBoundaryImports,
  cliInternalImports,
  staticScannerFiles,
  staticScannerRefs,
  passed: Object.values(checks).every(Boolean),
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
