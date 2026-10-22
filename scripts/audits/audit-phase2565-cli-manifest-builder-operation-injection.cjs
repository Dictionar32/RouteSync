const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const builderContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const barrel = read('packages/core/src/index.ts');
const checks = [
  ['upstream manifest owner declares explicit preparation interface', /interface ManifestBuilderOperationPreparationInterface/.test(builderContract)],
  ['preparation interface is an operation contract with typed input and builder result', /readonly prepare:\s*\(input: ManifestBuilderInput\) => ManifestBuilderInterface/.test(builderContract)],
  ['core exports the operation preparation interface', /ManifestBuilderOperationPreparationInterface/.test(barrel)],
  ['core exports the named preparation operation', /export \{[^}]*manifestBuilderOperationPreparation[^}]*\}/.test(barrel)],
  ['production preparation is exported as const typed by its interface', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface/.test(builder)],
  ['CLI composition dependencies require the manifest preparation operation', /readonly manifestBuilderPreparation:\s*ManifestBuilderOperationPreparationInterface/.test(contract)],
  ['composition closes validated inventory through the injected preparation operation', /manifestBuilderPreparation\.prepare\([\s\S]*?\)\.build\(\)/.test(composition)],
  ['composition no longer imports the raw manifest preparation function', !/prepareManifestBuilderOperation/.test(composition)],
  ['default composition wires the named upstream preparation operation', /manifestBuilderPreparation:\s*manifestBuilderOperationPreparation/.test(composition)],
  ['inventory rejection remains terminal and does not invoke manifest preparation', /case 'laravel_controller_invocation_semantic_judgment_inventory_rejected':[\s\S]*?controller_invocation_manifest_inventory_rejected/.test(composition)],
  ['active changed path avoids semantic foundation and relations imports', !/semantic\/(?:foundation|relations)/.test(composition + contract + builderContract + builder)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['composition implementation', composition], ['composition contract', contract], ['manifest builder contract', builderContract], ['manifest builder implementation', builder]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  const passed = errors.length === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'} syntax transpilation: ${label}`);
  if (!passed) failures += errors.length;
}
console.log(`Phase 2565: ${checks.length + 4 - failures}/${checks.length + 4} assertions passed.`);
process.exitCode = failures ? 1 : 0;
