const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const test = read('packages/core/src/types/upstream/__test__/laravelControllerInvocationSemanticJudgmentInventory.phase1953.test.ts');
const publicIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ["inventory contract and result ADT advance together to v11", /readonly version: 11/.test(contract) && (contract.match(/readonly contractVersion: 11;/g) || []).length === 2 && /version: 11,/.test(contract)],
  ["reasoning is represented by typed rule interfaces rather than prose-only labels", /interface LaravelControllerInvocationSemanticJudgmentInventoryProjectBindingRule/.test(contract) && /interface LaravelControllerInvocationSemanticJudgmentInventoryCompletenessRule/.test(contract) && /interface LaravelControllerInvocationSemanticJudgmentInventoryCorrespondenceRule/.test(contract)],
  ["canonical reasoning value contains all six named domain rules", ["projectBinding:", "completenessWitness:", "sourceIdentityUniqueness:", "judgmentCorrespondence:", "outcomePreservation:", "rejectionAggregation:"].every(rule => contract.includes(rule))],
  ["authority consumes project-binding relation and rejection from the typed rule", /judgeProjectBinding:/.test(authority) && /kind: 'project_binding_rejected'/.test(contract) && /rules\.projectBinding\.rejectionKind/.test(authority)],
  ["authority consumes completeness obligations and witness rejection from the typed rule", /judgeCompletenessWitness:/.test(authority) && /rules\.completenessWitness/.test(authority) && /rule\.requiredObligations/.test(authority) && /rule\.rejectionKind/.test(authority)],
  ["authority consumes canonical identity and correspondence rejection kinds from rules", /judgeSourceIdentityUniqueness:/.test(authority) && /judgeJudgmentCorrespondence:/.test(authority) && /rules\.sourceIdentityUniqueness/.test(authority) && /rule\.sameIdentityRelation/.test(authority) && /rule\.maximumOccurrences/.test(authority) && /rules\.judgmentCorrespondence/.test(authority) && /rule\.minimumMatches/.test(authority) && /rule\.maximumMatches/.test(authority) && /rule\.sameIdentityRelation/.test(authority) && /rule\.orphanJudgmentRejectionKind/.test(authority)],
  ["integrated response outcome preservation rule is retained on the closure receipt", /readonly outcomePreservation: LaravelControllerInvocationSemanticJudgmentInventoryOutcomePreservationRule/.test(contract) && /outcomePreservation: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT\.rules\.outcomePreservation/.test(authority)],
  ["rejection ADT is non-empty and aggregation result kind is contract-owned", /readonly rejections: readonly \[/.test(contract) && /kind: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT\.reasoning\.rules\.rejectionAggregation\.resultKind/.test(authority)],
  ["canonical judgments retain object identity in the closure receipt", /correspondences: Object\.freeze\(\[\.\.\.input\.judgments\]\)/.test(authority) && test.includes("result.receipt.correspondences[0]).toBe(judgment)")],
  ["project mismatch remains distinct from malformed witness", test.includes("keeps project-binding rejection separate") && /kind: 'project_binding_rejected'/.test(contract) && /kind: 'completeness_witness_rejected'/.test(contract) && /projectBinding\.rejections/.test(authority)],
  ["phase 1953 regression audit is compatible with the current v11 contract", /readonly version: 11/.test(read("scripts/audits/audit-phase1953-invocation-inventory-reasoning-interface-first.cjs")) && /contractVersion: 11/.test(read("scripts/audits/audit-phase1953-invocation-inventory-reasoning-interface-first.cjs"))],
  ["typed reasoning rule interfaces are exported through the public core API", ["LaravelControllerInvocationSemanticJudgmentInventoryProjectBindingRule", "LaravelControllerInvocationSemanticJudgmentInventoryCompletenessRule", "LaravelControllerInvocationSemanticJudgmentInventorySourceIdentityRule", "LaravelControllerInvocationSemanticJudgmentInventoryCorrespondenceRule", "LaravelControllerInvocationSemanticJudgmentInventoryOutcomePreservationRule", "LaravelControllerInvocationSemanticJudgmentInventoryRejectionAggregationRule", "LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface", "LaravelControllerInvocationInventoryProjectBindingJudgment", "LaravelControllerInvocationInventoryCompletenessJudgment", "LaravelControllerInvocationInventorySourceIdentityJudgment", "LaravelControllerInvocationInventoryCorrespondenceJudgment"].every(name => publicIndex.includes(name))],
  ["phase 1954 audit is registered", packageJson.scripts["audit:phase1954-inventory-executable-reasoning-adt-interface-first"] === "node scripts/audits/audit-phase1954-inventory-executable-reasoning-adt-interface-first.cjs"],
];
for (const [name, pass] of checks) process.stdout.write(`${pass ? "PASS" : "FAIL"} ${name}\n`);
const passed = checks.filter(([, pass]) => pass).length;
const summary = { phase: 1954, audit: "inventory-executable-reasoning-adt-interface-first", passed, total: checks.length, checks: checks.map(([name, pass]) => ({ name, passed: Boolean(pass) })) };
fs.writeFileSync(path.join(root, "PHASE1954_AUDIT.json"), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
