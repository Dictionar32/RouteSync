const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const judgment = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticPipelineInterface.ts'), 'utf8');
const publicIndex = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scanner = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'), 'utf8');
const executor = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticRuntimeExecutor.ts'), 'utf8');

const checks = [
  ['trace outcomes are projections of a declarative rule contract catalog', /export interface InvocationSemanticTraceRuleContractCatalog/.test(judgment) && /InvocationSemanticTraceRuleContractCatalog\[RuleId\]\['outcomes'\]\[number\]/.test(judgment) && /readonly outcome: InvocationSemanticTraceOutcomeFor<RuleId>/.test(judgment)],
  ['only judgment closure contract admits closed or incomplete', /'invocation-judgment-closure': Readonly<\{\s*readonly outcomes: readonly \['closed', 'incomplete'\]/.test(judgment)],
  ['argument-form evidence contract admits no derivation outcome or witness', /'invocation-argument-form-evidence': Readonly<\{\s*readonly outcomes: readonly \['no-conclusion', 'obligation-emitted'\];\s*readonly witnesses: readonly never\[\]/.test(judgment)],
  ['judgment contract records trace-outcome correlation and advances to version 35', /outcomeCorrelation: 'closure-outcomes-belong-only-to-closure-rule-and-argument-form-evidence-never-claims-a-derivation-witness'/.test(judgment) && /readonly version: 35/.test(judgment) && /version: 35,/.test(judgment)],
  ['pipeline trace contract records the strengthened outcome invariant', /readonly version: 3/.test(pipeline) && /outcomeCorrelation: 'only-closure-rule-may-report-closed-or-incomplete-and-argument-form-rule-cannot-claim-derivation'/.test(pipeline)],
  ['pipeline composes the revised trace contract under version 12', /readonly version: 12/.test(pipeline) && /kind: 'invocation_semantic_pipeline_contract',\s*version: 12,/.test(pipeline)],
  ['public API exports the trace outcome type', /InvocationSemanticTraceOutcomeFor/.test(publicIndex)],
  ['scanner still delegates whole-knowledge analysis without semantic reconstruction', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner) && /executeAll: batchAuthority\.analyze/.test(executor)],
  ['no generic callable boundary or semantic foundation dependency was introduced', !/\bFunction\b|semantic\/foundation/.test(judgment + pipeline)],
  ['audit is registered in package scripts', packageJson.scripts['audit:phase1689-invocation-trace-outcome-algebra'] === 'node scripts/audits/audit-phase1689-invocation-trace-outcome-algebra.cjs'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\nPhase 1689: ${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
