const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const contributor = path.join(root, 'src/compiler/analysis/dataflow/dataFlowConfigContributorInterface.ts');
const index = fs.readFileSync(path.join(root, 'src/compiler/analysis/dataflow/index.ts'), 'utf8');
const core = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8');
const upstream = fs.readFileSync(path.join(root, 'src/types/dataflow/dataFlowInterface.ts'), 'utf8');
const source = fs.readFileSync(contributor, 'utf8');
const checks = {
  contributorExists: fs.existsSync(contributor),
  contributionType: source.includes('DataFlowConfigContribution'),
  contributorInterface: source.includes('DataFlowConfigContributorInterface'),
  composer: source.includes('composeDataFlowConfigContributors'),
  composerUsesOrSemantics: source.includes('predicates.some(predicate => predicate(node))') && source.includes('predicates.some(predicate => predicate(source, target))'),
  analysisBarrelExport: index.includes("./dataFlowConfigContributorInterface"),
  coreBarrelExport: core.includes("./compiler/analysis/dataflow/dataFlowConfigContributorInterface"),
  upstreamDoesNotOwnContributor: !upstream.includes('DataFlowConfigContributorInterface'),
  upstreamDoesNotOwnConfig: !upstream.includes('DataFlowConfigInterface'),
};
console.log(JSON.stringify({ phase: 1023, checks, clean: Object.values(checks).every(Boolean) }, null, 2));
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
