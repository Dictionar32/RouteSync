const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

const contract = read('packages/core/src/types/upstream/astSemanticStageContract.ts');
const pipeline = read('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts');
const packageJson = JSON.parse(read('package.json'));
const docsPath = 'packages/core/src/types/docs/PHASE1371_AST_STAGE_TOPOLOGY_AUTHORITY.md';

check('canonical stage graph remains the topology authority',
  contract.includes('export const AST_SEMANTIC_STAGE_GRAPH') && contract.includes("from: 'source_syntax', to: 'scanner_evidence'") && contract.includes("to: 'target_projection'"),
  'The declared AST semantic stage graph remains the canonical topology contract.');
check('stage order is projected from graph edges',
  contract.includes('export const astSemanticStageOrder') && contract.includes('relationProject(AST_SEMANTIC_STAGE_GRAPH.edges, edge => edge.to)'),
  'The stage sequence is derived from the graph rather than maintained as a second ordered list.');
check('stage order projection is immutable',
  /astSemanticStageOrder[\s\S]*Object\.freeze\([\s\S]*relationProject/.test(contract),
  'The projected sequence is frozen before it is exposed to consumers.');
check('pipeline imports canonical stage-order projection',
  pipeline.includes('astSemanticStageOrder, stageGraphContains'),
  'The authority pipeline consumes the topology projection from the graph contract.');
check('pipeline construction uses canonical stage order',
  (pipeline.match(/stageOrder: astSemanticStageOrder\(\)/g) || []).length === 2,
  'Both pipeline construction paths derive their stage order from the same graph authority.');
check('duplicated hard-coded stage-order array is retired',
  !pipeline.includes('AST_SEMANTIC_STAGE_ORDER') && !/const\s+AST_SEMANTIC_STAGE_ORDER\s*:\s*readonly/.test(pipeline),
  'The pipeline no longer owns a parallel manually ordered list of semantic stages.');
check('stage membership and stage order share one graph',
  pipeline.includes('stageGraphContains(stage)') && contract.includes('AST_SEMANTIC_STAGE_GRAPH.edges'),
  'Stage membership and ordering are both derived from the same graph declaration.');
check('stage graph preserves the six-stage semantic path',
  ['scanner_evidence', 'upstream_mapping', 'resolver_graph', 'analysis', 'semantic_type_lowering', 'target_projection'].every(stage => contract.includes(`to: '${stage}'`)),
  'All six expected stages remain represented in the graph.');
check('pipeline transitions remain proof-checked',
  pipeline.includes('astSemanticStageTransition(from.stage, to.stage, from.judgment.contract, proof)'),
  'Stage topology derivation does not bypass transition proof validation.');
check('pipeline facts still come from stage interfaces',
  pipeline.includes('astSemanticInterfaceFacts(stageInterface)') && pipeline.includes('facts: pipelineFacts(interfaces)'),
  'The change does not introduce a second facts store or a second semantic solver.');
check('upstream AST stage interface remains type-level contract',
  exists('packages/core/src/types/upstream/astSemanticStageInterface.ts') && exists('packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts'),
  'The existing AST stage ADT/interface and its algebra remain in place.');
check('phase audit is registered without package/build changes',
  packageJson.scripts['audit:phase1371-ast-stage-topology-authority'] === 'node scripts/audits/audit-phase1371-ast-stage-topology-authority.cjs' && packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown',
  'The focused audit is reproducible while package version and build command remain unchanged.');
check('phase documentation records the authority boundary',
  exists(docsPath) && read(docsPath).includes('AST_SEMANTIC_STAGE_GRAPH'),
  'The design decision and validation limits are documented.');

const report = {
  phase: 1371,
  audit: 'ast-stage-topology-authority',
  topology: 'AST_SEMANTIC_STAGE_GRAPH -> astSemanticStageOrder -> AstSemanticAuthorityPipeline -> proof-checked stage transitions',
  passed: checks.every(item => item.passed),
  passedChecks: checks.filter(item => item.passed).length,
  totalChecks: checks.length,
  failures: checks.filter(item => !item.passed),
  results: checks,
  validationBoundary: 'Static source audit only; TypeScript build/runtime tests require installed dependencies.'
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1371-ast-stage-topology-authority.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.passed) process.exitCode = 1;
