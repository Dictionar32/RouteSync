import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const tests = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.phase1968.test.ts');

const checks = [
  ['ancestor evidence retains exact source identity', /interface ControllerDeclarationAncestorEvidence<[\s\S]*?sourceFile: SourceFile/.test(contract)],
  ['ancestor evidence retains canonical class identity', /interface ControllerDeclarationAncestorEvidence<[\s\S]*?classIdentity: PhpQualifiedClassName/.test(contract)],
  ['judgment carries resolved ancestor chain', /readonly inheritedDeclarations: readonly ControllerDeclarationAncestorEvidence<TAttribute>\[\]/.test(contract)],
  ['authority emits exact ancestor evidence', /const ancestorEvidence: ControllerDeclarationAncestorEvidence<TAttribute>/.test(authority)],
  ['authority preserves partial known ancestry on blocked closure', /declarations: Object\.freeze\(\[ancestorEvidence, \.\.\.upstream\.declarations\]\)/.test(authority)],
  ['scanner consumes canonical ancestor chain', /semanticSelection\.inheritedDeclarations\.map\(ancestor => ancestor\.controller\)/.test(scanner)],
  ['regression covers exact resolved ancestor source identity', /preserves resolved ancestor identities when a more distant parent blocks closure/.test(tests)],
  ['blocked declaration still excludes executable action selections', /readonly kind: 'controller_declaration_selection_blocked';[\s\S]*?ancestryTermination/.test(contract) && !/controller_declaration_selection_blocked';[\s\S]{0,180}actionSelections/.test(contract)],
];
const residuals = [
  ['scanner still imports semantic/relations', /semantic\/relations/.test(scanner)],
  ['scanner still calls controller subscanner', /scanControllerAction/.test(scanner)],
  ['declaration authority still contains imperative helper functions', /const ancestryFor|const judgeActionSelection|const sameClassIdentity/.test(authority)],
  ['runtime scanner still uses class executor', /class LaravelControllerScannerExecutor/.test(scanner)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
for (const [label, present] of residuals) process.stdout.write(`${present ? 'GAP' : 'CLEAR'} ${label}\n`);
process.stdout.write(`SUMMARY checks=${checks.filter(([, ok]) => ok).length}/${checks.length} residualGaps=${residuals.filter(([, present]) => present).length}/${residuals.length}\n`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
