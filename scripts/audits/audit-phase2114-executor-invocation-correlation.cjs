const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = [
  ['execution input carries a generic invocation judgment', /interface LaravelControllerActionExecutionInput\s*<\s*TProjection,\s*TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface/s.test(source) && /readonly invocationJudgment:\s*TInvocationJudgment/.test(source)],
  ['execution result preserves the same invocation judgment type', /interface LaravelControllerActionExecutionResult\s*<\s*TProjection,\s*TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface/s.test(source) && /readonly invocationJudgment:\s*TInvocationJudgment/.test(source)],
  ['executor forwards the same correlated judgment generic', /interface LaravelControllerActionExecutionInterface\s*<\s*TProjection,\s*TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface/s.test(source) && /LaravelControllerActionExecutionInput<TProjection, TInvocationJudgment>\) => LaravelControllerActionExecutionResult<TProjection, TInvocationJudgment>/.test(source)],
  ['closed invocation judgment ADT remains the generic bound', /import type \{ LaravelControllerInvocationSemanticJudgmentInterface \}/.test(source)],
  ['executor contract contains no semantic branch implementation', !/\b(if|switch|case)\s*\(/.test(source)],
  ['legacy one-parameter executor use remains source-compatible by default', /TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface/.test(source)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
