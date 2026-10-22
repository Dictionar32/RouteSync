const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const interfacePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const contract = fs.readFileSync(interfacePath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['composition interface exists', fs.existsSync(interfacePath)],
  ['closed declarative workflow is part of the interface', contract.includes('ControllerInvocationManifestCompositionReasoningContract') && contract.includes('readonly workflow: readonly [')],
  ['contract states upstream semantic ownership', contract.includes('core-authorities-own-semantic-judgment-and-inventory-closure-cli-only-discovers-wires-and-projects')],
  ['contract prohibits CLI semantic reclassification', contract.includes('cli-must-not-classify-invocations-or-reconstruct-integrated-response-outcomes')],
  ['authority interface exposes typed composition boundary', contract.includes('ControllerInvocationManifestCompositionAuthorityInterface') && contract.includes('readonly compose:')],
  ['existing CLI entry point delegates to authority interface', composition.includes('controllerInvocationManifestCompositionAuthority.compose(')],
  ['invocation judgment authority remains the semantic owner', composition.includes('laravelControllerInvocationSemanticJudgmentAuthority.judge(')],
  ['inventory closure authority remains the closure owner', composition.includes('laravelControllerInvocationSemanticJudgmentInventoryAuthority.close(')],
  ['manifest is built only from validated receipt', composition.includes("case 'validated_inventory':") && composition.includes('manifestBuilder.build(terminalOutcome.result.receipt)')],
  ['rejected inventory cannot reach manifest builder', composition.includes("case 'rejected_inventory':") && composition.includes('throw new ControllerInvocationManifestCompositionRejectedError(sourceProject, documents, terminalOutcome)') && composition.includes('this.terminalOutcome = terminalOutcome')],
  ['PHP parser index exports the authority contract', fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/index.ts'), 'utf8').includes('controllerInvocationManifestCompositionAuthority')],
  ['audit command is registered', packageJson.scripts['audit:phase1949-cli-invocation-composition-interface-first'] === 'node scripts/audits/audit-phase1949-cli-invocation-composition-interface-first.cjs'],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
