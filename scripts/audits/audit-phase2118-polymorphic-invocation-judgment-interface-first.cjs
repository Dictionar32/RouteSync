const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const execution = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const checks = [
  ['action judgment input owns invocation judgment, not a detached sourceFile', /readonly invocationJudgment:\s*TInvocationJudgment/.test(judgment) && !/readonly sourceFile:\s*SourceFile/.test(judgment.split('export interface LaravelControllerActionSemanticJudgment<')[0])],
  ['action authority uses a generic method to preserve exact invocation subtype', /readonly judge:\s*<TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>\(/.test(judgment)],
  ['completed action judgment returns the same invocation subtype accepted by judge', /=> LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>/.test(judgment)],
  ['executor input accepts one completed action judgment', /readonly semanticJudgment:\s*LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>/.test(execution)],
  ['executor uses a generic method instead of fixing invocation to the union default', /readonly execute:\s*<TInvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>\(/.test(execution)],
  ['executor receipt preserves the exact completed action judgment and invocation subtype', /readonly semanticJudgment:\s*LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>/.test(execution)],
  ['production adapter implements polymorphic judgment without reconstructing invocation', /judge:\s*<TInvocationJudgment extends import\([^\n]+LaravelControllerInvocationSemanticJudgmentInterface>/.test(dependencies) && /invocationJudgment:\s*input\.invocationJudgment/.test(dependencies)],
  ['production adapter forwards the exact completed judgment object', /execute:\s*<TInvocationJudgment extends import\([^\n]+LaravelControllerInvocationSemanticJudgmentInterface>/.test(dependencies) && /semanticJudgment:\s*input\.semanticJudgment/.test(dependencies)],
  ['scanner passes one semantic judgment to execution', /actionExecution\.execute\(\s*\{\s*semanticJudgment,\s*\}\)/.test(scanner)],
  ['canonical invocation ADT retains four explicit outcomes', ['LaravelControllerInvocationNotConnectedJudgment', 'LaravelControllerInvocationSourceBindingRejectedJudgment', 'LaravelControllerInvocationCompleteJudgment', 'LaravelControllerInvocationBlockedJudgment'].every(name => invocation.includes(name))],
  ['integrated response is indexed by the same invocation judgment type', /LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>/.test(invocation) || /LaravelControllerIntegratedResponseJudgment<InvocationJudgment>/.test(response)],
  ['authority interface remains declarative rather than owning branch implementation', !/\b(if|switch|case)\s*\(/.test(judgment + execution)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('KNOWN DEBT: the production judgment adapter still delegates semantic interpretation to scanControllerAction in the legacy controller subscanner; this phase strengthens subtype correlation but does not claim subscanner retirement.\n');
process.exitCode = failures === 0 ? 0 : 1;
