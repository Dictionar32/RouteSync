const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const contract = read('packages/core/src/types/upstream/invocationSemanticAlgebraInterface.ts');
const judgment = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const packageIndex = read('packages/core/src/index.ts');
const scanner = read('packages/core/src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const checks = [
  ['concrete algebra is typed by the dedicated interface', /export const invocationSemanticAlgebra:\s*InvocationSemanticAlgebraInterface/.test(algebra)],
  ['legacy staged algebra interface stays internal rather than expanding the canonical upstream surface', !/export \* from '\.\/invocationSemanticAlgebraInterface'/.test(upstreamIndex)],
  ['legacy staged algebra interface is not re-exposed through the core package surface', !/InvocationSemanticAlgebraInterface/.test(packageIndex) && !/INVOCATION_SEMANTIC_ALGEBRA_CONTRACT/.test(packageIndex)],
  ['target resolution is implemented by a domain phase', /deriveTargetResolution,/.test(algebra) && /const deriveTargetResolution =/.test(algebra)],
  ['argument binding consumes target judgment without re-resolving candidates', /const deriveArgumentBinding = \(input: InvocationArgumentBindingAlgebraInput\)/.test(algebra) && /targetResolution, positionalEvidence/.test(algebra)],
  ['positional binding requires matching upstream invocation and exact ordered arguments', /positionalEvidenceMatches/.test(algebra) && /normalizedArguments\.every/.test(algebra)],
  ['missing positional evidence emits argument-form obligation instead of guessing by index', /if \(!positionalEvidenceMatches\(invocation, positionalEvidence\)\)/.test(algebra) && /kind: 'argument-form-unproven'/.test(algebra)],
  ['per-argument ledger is constructed in source order, preserving duplicate argument identities', /const combinedItems: InvocationIncompleteArgumentDisposition\[\] = \[\]/.test(algebra) && /combinedItems\.push\(disposition\)/.test(algebra)],
  ['effect projection consumes target judgment and only declared emissions', /const deriveEffectProjection =/.test(algebra) && /declaredEmissionIds/.test(algebra) && /targetResolution\.kind === 'resolved'/.test(algebra)],
  ['result and exception effects are emitted as separate discriminated flow kinds', /kind: 'result-emission-flow'/.test(algebra) && /kind: 'exception-emission-flow'/.test(algebra)],
  ['closure consumes derived phase judgments and rejects incomplete closure without obligations', /const closeJudgment =/.test(algebra) && /input\.obligations\.length === 0/.test(algebra) && /inconsistent phase outcomes without an unresolved obligation/.test(algebra) && /Phase derivation status disagrees with retained obligations/.test(algebra)],
  ['public single-judgment path composes interface methods in derivation order', /invocationSemanticAlgebra\.deriveTargetResolution/.test(algebra) && /invocationSemanticAlgebra\.deriveArgumentBinding/.test(algebra) && /invocationSemanticAlgebra\.deriveEffectProjection/.test(algebra) && /invocationSemanticAlgebra\.closeJudgment/.test(algebra)],
  ['authority validates invocation membership and target/binding correlation', /invocationIsPresent/.test(authority) && /unavailable target must block argument binding/.test(authority)],
  ['authority validates positional correspondence and claim-specific provenance', /argument is not bound to the parameter at its proven position/.test(authority) && /argument claim lacks positional-correspondence provenance/.test(authority)],
  ['authority validates effect membership and distinct provenance channels', /effect flow emission is not declared by target callable/.test(authority) && /effect flow lacks projection-membership provenance/.test(authority)],
  ['batch analysis retains each judgment and its own proof', /judgments = Object\.freeze\(invocationsFrom\(knowledge\)\.map/.test(algebra) && /judgments\.flatMap\(judgment => judgment\.proof\.ruleTrace\)/.test(algebra)],
  ['positional evidence is part of the public input and contract version advanced', /readonly positionalEvidence\?: InvocationPositionalArgumentEvidence \| null/.test(judgment) && /readonly version: 33/.test(judgment) && /positionalArgumentEvidence/.test(judgment)],
  ['runtime executor remains pure delegation', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor) && !/deriveTargetResolution|deriveArgumentBinding|deriveEffectProjection|closeJudgment/.test(executor)],
  ['scanner remains free of invocation algebra implementation', !/invocationSemanticAlgebra|deriveTargetResolution|deriveArgumentBinding|deriveEffectProjection|closeJudgment/.test(scanner)],
  ['no any escape hatch in algebra implementation or contract', !/\bany\b/.test(algebra) && !/\bany\b/.test(contract)],
  ['no semantic foundation dependency was added', !/semantic\/foundation/.test(algebra) && !/semantic\/foundation/.test(contract)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1677 invocation algebra implementation audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
