const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const contract = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const analysisInterface = read('packages/core/src/compiler/analysis/astAnalysisInterface.ts');
const authority = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');

const productionFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (entry.isFile() && rel.endsWith('.ts') && !rel.includes('/__tests__/') && !rel.includes('PHASE')) productionFiles.push(rel);
  }
}
walk('packages/core/src');

const interfaceConstructors = productionFiles.filter(file =>
  read(file).includes("kind: 'semantic_dataflow_interface'")
);
const manualAnalysisConstruction = /dataflow:\s*Object\.freeze\(\{[\s\S]*?semantic_dataflow_interface/.test(analysisInterface);

const checks = {
  canonicalInterfaceFactoryExists: contract.includes('semanticDataflowInterfaceFromJudgment'),
  factoryPreservesJudgmentIdentity: contract.includes('  judgment,') && contract.includes("authority: 'semantic_dataflow_judgment'"),
  analysisUsesCanonicalFactory: analysisInterface.includes('semanticDataflowInterfaceFromJudgment(judgment.dataflow)'),
  analysisNoLongerReconstructsInterface: !manualAnalysisConstruction,
  authorityRemainsInterfaceProducer: authority.includes("kind: 'semantic_dataflow_interface'") && authority.includes('origin: input.origin'),
  onlyExpectedProductionConstructors: interfaceConstructors.length === 2 && interfaceConstructors.some(file => file.replaceAll('\\', '/') === 'packages/core/src/compiler/analysis/astDataflowAuthority.ts') && interfaceConstructors.some(file => file.replaceAll('\\', '/') === 'packages/core/src/types/upstream/semanticDataflowInterface.ts'),
};

const result = {
  ...checks,
  interfaceConstructors,
  clean: Object.values(checks).every(Boolean),
};

console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
