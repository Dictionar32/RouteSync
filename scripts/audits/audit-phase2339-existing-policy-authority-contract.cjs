const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const scannerResolverPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts');
const upstreamResolverPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const scannerResolver = fs.readFileSync(scannerResolverPath, 'utf8');
const upstreamResolver = fs.readFileSync(upstreamResolverPath, 'utf8');
const checks = [
  ['existing input requires explicit policy evidence', /readonly policy: readonly ControllerPolicyRelation\[\];/.test(contract)],
  ['existing input requires explicit inheritance lineage', /readonly inheritedFrom: readonly ControllerName\[\];/.test(contract)],
  ['existing input requires explicit source provenance', /readonly source: readonly SourceSpan\[\];/.test(contract)],
  ['complete/blocked output is a closed discriminated union', /export type EffectiveControllerActionPolicy =\s*\| CompleteEffectiveControllerActionPolicy\s*\| BlockedEffectiveControllerActionPolicy/.test(contract)],
  ['existing algebra remains the semantic operation contract', /export interface EffectiveControllerActionPolicyAlgebraInterface/.test(contract)],
  ['semantic authority owns complete/blocked judgment', /interface EffectiveControllerActionPolicySemanticAuthorityInterface[\s\S]*readonly judge: \(input: EffectiveControllerActionPolicyUpstreamInput\) => EffectiveControllerActionPolicy/.test(contract)],
  ['runtime executor delegates through authority contract', /interface EffectiveControllerActionPolicyRuntimeExecutorInterface[\s\S]*readonly authority: EffectiveControllerActionPolicySemanticAuthorityInterface;[\s\S]*readonly execute: \(input: EffectiveControllerActionPolicyUpstreamInput\) => EffectiveControllerActionPolicy/.test(contract)],
  ['scanner resolver still duplicates judgment closure', /const blockedPolicyReasons/.test(scannerResolver) && /const policyJudgment/.test(scannerResolver)],
  ['upstream resolver independently constructs judgment', /const blockedReasons/.test(upstreamResolver) && /const judgment/.test(upstreamResolver)],
  ['scanner resolver still imports canonical algebra but is not wired to authority contract', /effectiveControllerActionPolicyAlgebra/.test(scannerResolver) && !/EffectiveControllerActionPolicyRuntimeExecutorInterface/.test(scannerResolver)],
  ['no foundation import added to policy contract', !/semantic\/foundation/.test(contract)],
  ['no parallel V2 policy interface added', !/EffectiveControllerActionPolicy.*V2/.test(contract)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase 2339 existing policy authority contract: ${checks.length - failed.length}/${checks.length} assertions passed`);
if (failed.length) process.exitCode = 1;
