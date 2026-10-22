const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const tests = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.phase1968.test.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const oldDependencies = !scanner.includes('semantic/relations') && !scanner.includes('subscanners/') && dependencies.includes("from '../subscanners/controller'");
const checks = [
  ['declaration subject has canonical source identity', contract.includes('readonly sourceIdentity: SourceFile;')],
  ['correspondence is a closed matched-or-mismatch ADT', contract.includes("readonly kind: 'controller_declaration_semantic_correspondence'") && contract.includes("readonly kind: 'controller_declaration_source_identity_mismatch'")],
  ['mismatch outcome has no semantic selection field', /kind: 'controller_declaration_source_identity_mismatch'[\s\S]*?candidateSourceIdentity: SourceFile;\n\s*}>;/.test(contract)],
  ['authority validates source identity before judgment', authority.includes('subject.sourceIdentity.value.value === subject.candidate.sourceFile.value.value')],
  ['invalid candidates are excluded from ancestry inventory', authority.includes('input.filter(subject =>') && authority.includes('validSubjects.map(subject => subject.candidate)')],
  ['scanner supplies identity from canonical invocation judgment', scanner.includes('sourceIdentity: item.invocationJudgment.sourceFile')],
  ['scanner turns mismatch into an explicit blocker', scanner.includes("kind: 'controller_declaration_source_identity_mismatch' as const")],
  ['mismatched correspondence cannot enter declaration execution list', scanner.includes("correspondence.kind === 'controller_declaration_semantic_correspondence'") && scanner.includes(': [],')],
  ['blocker gate precedes injected action executor', scanner.indexOf('if (declarationBlockers.length > 0)') < scanner.indexOf('this.executionDependencies.actionExecution.execute(')],
  ['regression test covers mismatched source identity', tests.includes('rejects a declaration candidate whose source identity differs from its invocation subject')],
  ['scanner contract version is synchronized at 31', scannerContract.includes('readonly contractVersion: 31;') && scanner.includes('contractVersion: 31 as const')],
  ['legacy relation/subscanner bindings are isolated in explicit composition rather than claimed removed', oldDependencies],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
