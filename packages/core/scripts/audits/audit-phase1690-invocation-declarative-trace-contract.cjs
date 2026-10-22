const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const judgment = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticPipelineInterface.ts'), 'utf8');
const publicIndex = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const conditionalDispatch = /RuleId\s+extends\s+['"][^'"]+['"]\s*\?/;
const checks = [
  ['trace semantics are a keyed domain contract catalog', /export interface InvocationSemanticTraceRuleContractCatalog/.test(judgment)],
  ['trace outcome is projected from its declared rule contract', /InvocationSemanticTraceRuleContractCatalog\[RuleId\]\['outcomes'\]\[number\]/.test(judgment)],
  ['trace witness family is projected from its declared rule contract', /InvocationSemanticTraceRuleContractCatalog\[RuleId\]\['witnesses'\]\[number\]/.test(judgment)],
  ['trace contract contains no conditional rule dispatch', !conditionalDispatch.test(judgment)],
  ['closure owns the closed and incomplete outcomes explicitly', /'invocation-judgment-closure': Readonly<\{\s*readonly outcomes: readonly \['closed', 'incomplete'\]/.test(judgment)],
  ['argument-form evidence owns no witness and no derived outcome', /'invocation-argument-form-evidence': Readonly<\{\s*readonly outcomes: readonly \['no-conclusion', 'obligation-emitted'\];\s*readonly witnesses: readonly never\[\]/.test(judgment)],
  ['semantic model and judgment contract versions advance', /readonly version: 20/.test(judgment) && /readonly version: 35/.test(judgment) && /version: 20,/.test(judgment) && /version: 35,/.test(judgment)],
  ['trace and pipeline contracts advance together', /readonly version: 3/.test(pipeline) && /version: 3,\s*traceOwner/.test(pipeline) && /readonly version: 12/.test(pipeline) && /version: 12,\s*judgmentContract/.test(pipeline)],
  ['declarative trace contract is part of the public type surface', /InvocationSemanticTraceRuleContractCatalog/.test(publicIndex)],
  ['audit is registered in package scripts', packageJson.scripts['audit:phase1690-invocation-declarative-trace-contract'] === 'node scripts/audits/audit-phase1690-invocation-declarative-trace-contract.cjs'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\nPhase 1690: ${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
