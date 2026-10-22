const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const implementation = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const checks = [
  ['composition operation is typed by the existing authority interface', /const compose:\s*ControllerInvocationManifestCompositionAuthorityInterface\['compose'\]\s*=\s*async/.test(implementation)],
  ['inventory subject preserves the discovery authority output identity', /sourceProject:\s*discovery\.sourceProject/.test(implementation)],
  ['completeness witness retains the originally requested project identity', /completeness:\s*Object\.freeze\(\{[\s\S]*?kind:\s*'laravel_controller_source_inventory_completeness_witness',[\s\S]*?sourceProject,/.test(implementation)],
  ['project mismatch is judged by the existing upstream inventory authority', /controller_source_inventory_project_binding_mismatch/.test(inventory) && /projectBinding/.test(inventory) && /identitySemantics/.test(inventory)],
  ['composition contract states the identity-binding operation', /preserve-the-discovery-project-identity-as-inventory-subject-evidence/.test(contract) && /bind-the-complete-discovered-source-inventory-to-the-requested-project-identity-through-upstream-identity-judgment/.test(contract)],
  ['composition reasoning contract version is evolved rather than duplicated', /readonly version:\s*11/.test(contract) && /version:\s*11/.test(implementation) && !/ReasoningContractV2/.test(contract + implementation)],
  ['composition distinguishes discovery identity from requested witness identity', /sourceProject:\s*discovery\.sourceProject/.test(implementation) && /completeness:[\s\S]*?sourceProject,/.test(implementation)],
  ['no semantic foundation/relation dependency is introduced on the path', !/semantic\/(?:foundation|relations)/.test(implementation + contract)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['manifest composition', implementation], ['manifest composition interface', contract]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  const passed = errors.length === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'} syntax transpilation: ${label}`);
  if (!passed) failures += errors.length;
}
console.log(`Phase 2562: ${checks.length + 2 - failures}/${checks.length + 2} assertions passed.`);
process.exitCode = failures ? 1 : 0;
