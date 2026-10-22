const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'src/types/upstream/semanticJudgmentDerivationInterface.ts');
const compilerPath = path.join(root, 'src/types/upstream/semanticJudgmentRuleCompiler.ts');
const fixturePath = path.join(__dirname, 'fixtures/phase1647-extensible-rule-literal-domain.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const compiler = fs.readFileSync(compilerPath, 'utf8');
const checks = [
  ['literal vocabulary is a generic atom parameter', /SemanticJudgmentRuleTerm<TAtom = unknown>/.test(contract)],
  ['relation pattern carries the atom parameter', /SemanticJudgmentRelationPattern<[\s\S]*?TAtom = unknown/.test(contract)],
  ['derivation program carries the atom parameter', /SemanticJudgmentDerivationProgram<[\s\S]*?TAtom = unknown/.test(contract)],
  ['rule definition carries the atom parameter', /SemanticJudgmentRuleDefinition<[\s\S]*?TAtom = unknown/.test(contract)],
  ['compiler preserves generic atom vocabulary', /compileSemanticJudgmentRule = <R extends string, TAtom = unknown>/.test(compiler)],
  ['no hard-coded primitive union remains in rule term', !/value:\s*string\s*\|\s*number\s*\|\s*boolean/.test(contract)],
  ['derivation interface and compiler do not depend on semantic/foundation', !/from ['"]\.\.\/\.\.\/semantic\/foundation\//.test(contract) && !/from ['"]\.\.\/\.\.\/semantic\/foundation\//.test(compiler)],
];
const typecheck = spawnSync('tsc', [
  '--noEmit', '--strict', '--target', 'ES2022', '--moduleResolution', 'node', '--module', 'commonjs',
  fixturePath,
], { encoding: 'utf8' });
checks.push(['literal-union and branded-string fixture typechecks', typecheck.status === 0]);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
if (typecheck.status !== 0) process.stderr.write(typecheck.stdout + typecheck.stderr);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed\n`);
process.exit(checks.every(([, passed]) => passed) ? 0 : 1);
