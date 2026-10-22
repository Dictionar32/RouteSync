const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const implementation = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const compositionContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const checks = [
  ['upstream discovery blocker ADT models unresolved symbolic links', /controller_source_discovery_symbolic_link_encountered/.test(contract)],
  ['discovery contract version evolves with the new closed outcome', /readonly contractVersion:\s*2/.test(contract) && /readonly symbolicLinkPolicy:\s*'block-complete-discovery-when-an-unresolved-symbolic-link-is-encountered'/.test(contract)],
  ['directory root is checked with lstat before claiming discovery completeness', /await fs\.lstat\(directory\)/.test(implementation) && /directoryMetadata\.isSymbolicLink\(\)/.test(implementation)],
  ['nested symbolic-link entries produce a blocked judgment instead of being silently omitted', /entry\.isSymbolicLink\(\)/.test(implementation) && /kind:\s*'laravel_controller_source_discovery_blocked'[\s\S]*?kind:\s*'controller_source_discovery_symbolic_link_encountered'/.test(implementation)],
  ['complete and blocked discovery outcomes use contract version 2', /kind:\s*'laravel_controller_source_discovery_complete',[\s\S]*?contractVersion:\s*2/.test(implementation) && /kind:\s*'laravel_controller_source_discovery_blocked',[\s\S]*?contractVersion:\s*2/.test(implementation)],
  ['composition preserves discovery blocker ADT without inventing an empty inventory', /if \(discovery\.kind === 'laravel_controller_source_discovery_blocked'\)\s*\{\s*return Object\.freeze\(\{ kind: 'controller_invocation_manifest_source_discovery_blocked', discovery \}\)/.test(implementation)],
  ['composition contract records the symlink completeness obligation', /block-complete-inventory-when-an-unresolved-symbolic-link-is-encountered/.test(compositionContract) && /readonly version:\s*11/.test(compositionContract)],
  ['new active path does not import semantic foundation or relations', !/semantic\/(?:foundation|relations)/.test(implementation + contract + compositionContract)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['discovery implementation', implementation], ['upstream discovery contract', contract], ['composition contract', compositionContract]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  const passed = errors.length === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'} syntax transpilation: ${label}`);
  if (!passed) failures += errors.length;
}
console.log(`Phase 2563: ${checks.length + 3 - failures}/${checks.length + 3} assertions passed.`);
process.exitCode = failures ? 1 : 0;
