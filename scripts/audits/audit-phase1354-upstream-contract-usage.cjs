const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const failures = [];
const passed = [];
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const requireText = (rel, needle, label) => {
  if (read(rel).includes(needle)) passed.push(label);
  else failures.push(`${rel}: missing ${label}`);
};

const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const rel = path.posix.join(dir, entry.name);
  if (entry.isDirectory()) return walk(rel);
  return /\.(?:ts|tsx|mts|cts)$/.test(entry.name) ? [rel] : [];
});
const files = walk('packages');
const sources = files.map(file => ({ file, source: read(file) }));
const upstreamFiles = walk('packages/core/src/types/upstream');
const declarations = [];
for (const file of upstreamFiles) {
  const source = read(file);
  const expression = /^\s*export\s+(?:declare\s+)?(interface|type)\s+([A-Za-z_$][\w$]*)/gm;
  for (const match of source.matchAll(expression)) {
    const name = match[2];
    const consumers = sources
      .filter(item => item.file !== file && new RegExp(`\\b${name}\\b`).test(item.source))
      .map(item => item.file);
    declarations.push({ file, kind: match[1], name, externalReferenceCount: consumers.length, consumers });
  }
}
const unreferenced = declarations.filter(item => item.externalReferenceCount === 0);
const report = {
  phase: 1354,
  audit: 'upstream-contract-usage',
  method: 'static identifier occurrence scan across packages; candidates require semantic review and are not automatically obsolete',
  upstreamFiles: upstreamFiles.length,
  exportedTypeInterfaceDeclarations: declarations.length,
  externallyReferenced: declarations.length - unreferenced.length,
  unreferencedCandidates: unreferenced,
  declarations,
};
const reportPath = 'scripts/audits/reports/phase1354-upstream-contract-usage.json';
fs.mkdirSync(path.dirname(path.join(root, reportPath)), { recursive: true });
fs.writeFileSync(path.join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);

requireText('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'readonly facts: readonly AstSemanticStageFact[]', 'closed AST authority pipeline exposes aggregated semantic facts');
requireText('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'astSemanticInterfaceFacts(stageInterface)', 'AST authority pipeline consumes the previously unreferenced stage-fact projection');
requireText('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'facts: pipelineFacts(interfaces)', 'AST source-pipeline constructor seals facts from projected stage interfaces');
requireText('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'facts: pipelineFacts([scanner, mapping, resolver, analysis, lowering, target])', 'AST direct-pipeline constructor seals facts from stage interfaces');
requireText('packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts', 'export const astSemanticInterfaceFacts', 'stage-fact projection remains an explicit interface algebra operation');
requireText('packages/core/src/types/upstream/astSemanticStageContract.ts', 'AST_SEMANTIC_STAGE_GRAPH', 'AST stage topology remains declared upstream');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts', 'operationIdentityCapabilityFromRoute', 'operation identity remains created by upstream authority');
requireText('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts', 'manifest.ast.ast.routeFlows', 'manifest wiring preserves upstream route-flow identity');
requireText('packages/cli/src/generators/sdk/apiObjectEmitter.ts', 'operationIdentityReferenceFromCapability(route.raw.operationIdentityCapability)', 'CLI projects operation identity without semantic reconstruction');
requireText('packages/core/src/types/upstream/resourceGroupCapabilityAuthority.ts', 'resourceGroupCapabilityAlgebra.compose(routes)', 'resource group authority delegates semantic decisions to algebra');
requireText('packages/core/src/types/upstream/semanticDataflowAuthority.ts', 'relationFixedPoint', 'semantic dataflow closure remains owned by upstream authority');
requireText('packages/core/src/types/upstream/astDataflowInterface.ts', 'DataFlowAuthorityInterface<', 'AST dataflow interface reuses the canonical read-only authority');

const result = {
  phase: 1354,
  audit: 'upstream-contract-usage',
  passed: failures.length === 0,
  passedChecks: passed.length,
  failures,
  inventory: {
    upstreamFiles: report.upstreamFiles,
    exportedTypeInterfaceDeclarations: report.exportedTypeInterfaceDeclarations,
    externallyReferenced: report.externallyReferenced,
    unreferencedCandidates: unreferenced.length,
    report: reportPath,
  },
  note: 'Unreferenced candidates are advisory. They must be classified as live future contract, missing wiring, intentionally type-only, duplicate, or obsolete before any deletion/emptying decision.',
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
