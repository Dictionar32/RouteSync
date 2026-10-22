const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../..');
const baseline = '/mnt/data/routesync-phase1583-baseline/RouteSync';
const interfacePath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

check('semantic reasoning has a dedicated source-evidence interface', /export interface RequestTypeDerivationSemanticReasoningInterface\s*\{[\s\S]*?infer:\s*\(input:\s*RequestTypeDerivationInput\)\s*=>\s*RequestTypeDerivationJudgment/.test(source), 'infer maps source evidence to a closed judgment');
check('proof verification is separate from inference', /export interface RequestTypeDerivationProofVerificationInterface\s*\{[\s\S]*?verify:\s*\([\s\S]*?input:\s*RequestTypeDerivationInput[\s\S]*?judgment:\s*RequestTypeDerivationJudgment[\s\S]*?\)\s*=>\s*RequestTypeDerivationVerification/.test(source), 'verification checks an existing judgment rather than deriving one');
check('wiring has a single source-bound pipeline operation', /export interface RequestTypeDerivationSemanticPipelineInterface\s*\{[\s\S]*?derive:\s*\(\s*input:\s*RequestTypeDerivationInput\s*,?\s*\)\s*=>\s*RequestTypeDerivationSemanticAuthorityAssessment/.test(source), 'wiring consumes one closed authority assessment');
check('pipeline does not expose candidate assembly to wiring', !/interface RequestTypeDerivationSemanticPipelineInterface\s*\{[^}]*candidate\s*:/.test(source), 'no candidate input on the source-bound pipeline interface');
check('consumer projection accepts judgment only', /export interface RequestTypeDerivationJudgmentConsumerInterface<TProjection>\s*\{\s*readonly project:\s*\(judgment:\s*RequestTypeDerivationJudgment\)\s*=>\s*TProjection/.test(source), 'projection has no raw source collections or policy arguments');
check('legacy low-level authority boundary remains distinct', /export interface RequestTypeDerivationSemanticAuthorityInterface/.test(source), 'candidate adjudication is not confused with the public source-bound pipeline');

const untouched = [
  'packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts',
  'packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts',
  'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts',
];
for (const relative of untouched) {
  const currentPath = path.join(root, relative);
  const baselinePath = path.join(baseline, relative);
  const current = fs.readFileSync(currentPath);
  const previous = fs.readFileSync(baselinePath);
  const same = crypto.createHash('sha256').update(current).digest('hex') === crypto.createHash('sha256').update(previous).digest('hex');
  check(`implementation untouched: ${relative}`, same, same ? 'byte-for-byte identical to Phase 1583 baseline' : 'unexpected implementation change');
}

const result = {
  phase: 1584,
  name: 'semantic-pipeline-interface-first',
  scope: 'upstream interface contract only; no scanner/wiring/authority/executor migration',
  checks,
  passed: checks.filter((entry) => entry.passed).length,
  total: checks.length,
  allPassed: checks.every((entry) => entry.passed),
};
const reportPath = path.join(root, 'PHASE1584_AUDIT.json');
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`${result.passed}/${result.total} checks passed`);
for (const entry of checks) console.log(`${entry.passed ? 'PASS' : 'FAIL'} ${entry.name}`);
if (!result.allPassed) process.exitCode = 1;
