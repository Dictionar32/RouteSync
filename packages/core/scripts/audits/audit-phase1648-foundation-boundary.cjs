const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const derivation = read('src/types/upstream/semanticJudgmentDerivationInterface.ts');
const compiler = read('src/types/upstream/semanticJudgmentRuleCompiler.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const fixture = read('scripts/audits/fixtures/phase1647-extensible-rule-literal-domain.ts');
const checks = [
  ['Declarative derivation contract has no semantic/foundation import', !/^import .*semantic\/foundation/m.test(derivation)],
  ['Generic derivation compiler has no semantic/foundation import', !/^import .*semantic\/foundation/m.test(compiler)],
  ['Literal domain remains caller-owned and unconstrained by foundation atom aliases', /SemanticJudgmentRuleTerm<TAtom = unknown>/.test(derivation) && /SemanticJudgmentDerivationProgram<[\s\S]*?TAtom = unknown/.test(derivation)],
  ['Compiler emits a neutral compiled rule contract', /interface CompiledSemanticJudgmentRule/.test(compiler) && /CompiledSemanticJudgmentPattern/.test(compiler)],
  ['Runtime adapter selects the concrete invocation atom domain at the boundary', /compileSemanticJudgmentRule<InvocationRelation, string>/.test(algebra)],
  ['Branded and narrow literal fixtures remain represented', /BrandedRouteId/.test(fixture) && /RouteLiteral/.test(fixture)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
