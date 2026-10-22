const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const implementation = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const checks = [
  ['canonicalization is an explicit typed operation interface', /interface ControllerSourceProjectIdentityCanonicalizationInterface/.test(contract) && /readonly canonicalize:\s*\(/.test(contract)],
  ['canonicalization result is a closed ADT with canonicalized and blocked variants', /kind: 'controller_source_project_identity_canonicalized'/.test(contract) && /kind: 'controller_source_project_identity_canonicalization_blocked'/.test(contract)],
  ['production operation resolves project root through filesystem realpath', /controllerSourceProjectIdentityCanonicalization:\s*ControllerSourceProjectIdentityCanonicalizationInterface/.test(implementation) && /await fs\.realpath\(input\.sourceProject\.root\.value\.value\)/.test(implementation)],
  ['canonical identity preserves upstream dataflow policy intent', /createLaravelSourceProjectIdentity\([\s\S]*?input\.sourceProject\.dataflowQueryPolicyIntent/.test(implementation)],
  ['composition canonicalizes identity before constructing controller discovery root', /sourceProjectIdentityCanonicalization\.canonicalize[\s\S]*?const sourceProject = identity\.canonical[\s\S]*?path\.join\(sourceProject\.root\.value\.value, 'app', 'Http', 'Controllers'\)/.test(implementation)],
  ['identity canonicalization failure remains an explicit composition terminal ADT', /controller_invocation_manifest_source_project_identity_blocked/.test(implementation) && /ControllerInvocationManifestSourceProjectIdentityBlockedJudgment/.test(contract)],
  ['scan and sync handle the blocked identity outcome before manifest projection', /controller_invocation_manifest_source_project_identity_blocked/.test(scan) && /controller_invocation_manifest_source_project_identity_blocked/.test(sync)],
  ['composition reasoning contract declares canonical identity before inventory', /readonly version:\s*11/.test(contract) && /canonicalize-source-project-root-identity-before-discovery-and-inventory-binding/.test(contract)],
  ['active changed path avoids semantic foundation and relations imports', !/semantic\/(?:foundation|relations)/.test(implementation + contract)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['composition implementation', implementation], ['composition contract', contract], ['scan command', scan], ['sync command', sync]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  const passed = errors.length === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'} syntax transpilation: ${label}`);
  if (!passed) failures += errors.length;
}
console.log(`Phase 2564: ${checks.length + 4 - failures}/${checks.length + 4} assertions passed.`);
process.exitCode = failures ? 1 : 0;
