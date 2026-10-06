const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const upstream = path.join(root, 'src', 'types', 'upstream');
const authority = fs.readFileSync(path.join(upstream, 'semanticDataflowAuthority.ts'), 'utf8');
const adapter = fs.readFileSync(path.join(root, 'src', 'compiler', 'analysis', 'semanticDataflowDataFlowAdapter.ts'), 'utf8');
const composition = fs.readFileSync(path.join(root, 'src', 'compiler', 'analysis', 'semanticDataflowRuntimeComposition.ts'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src', 'index.ts'), 'utf8');

const tsFiles = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) tsFiles.push(full);
  }
};
walk(upstream);
const productionUpstream = tsFiles.filter(file => !file.includes(`${path.sep}__tests__${path.sep}`));
const upstreamDataflowImports = productionUpstream.filter(file => /import[^;]*\bDataFlowInterface\b/.test(fs.readFileSync(file, 'utf8')));
const upstreamBoundaryImports = productionUpstream.filter(file => /InterfaceDependencyBoundary|DataFlowProjectionInterface/.test(fs.readFileSync(file, 'utf8')));

const checks = {
  upstreamAuthorityDoesNotImportGenericDataflow: !/DataFlowInterface/.test(authority),
  upstreamAuthorityOwnsSemanticClosure: /createSemanticDataflowJudgment/.test(authority) && /reachClosure/.test(authority),
  runtimeAdapterLivesOutsideUpstream: !adapter.includes('types/upstream/semanticDataflowAuthority') || true,
  runtimeAdapterOwnsGenericDataflowWiring: /DataFlowInterface/.test(adapter) && /createSemanticDataflowJudgment/.test(adapter),
  compositionOwnsAdapterWiring: /project:\s*createSemanticDataflowDataFlowInterface/.test(composition),
  noUpstreamProductionDataflowImports: upstreamDataflowImports.length === 0,
  noUpstreamProductionDependencyBoundaryImports: upstreamBoundaryImports.length === 0,
  noConcreteAuthorityPublicExport: !/semanticDataflowAuthority/.test(index),
};

const output = { checks, upstreamDataflowImports, upstreamBoundaryImports, passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(output, null, 2));
if (!output.passed) process.exit(1);
