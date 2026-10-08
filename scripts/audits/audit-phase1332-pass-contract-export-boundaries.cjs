const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const passIndex = read('packages/core/src/compiler/passes/index.ts');
const compilerIndex = read('packages/core/src/compiler/index.ts');
const checks = [
  ['PassDescriptor and PassDependency are type-only exports', /export type \{ PassDescriptor, PassDependency \}/.test(passIndex)],
  ['CompilerPass is a type-only export', /export type \{ CompilerPass \}/.test(passIndex)],
  ['ExecutablePass is a type-only export', /export type \{ ExecutablePass \}/.test(passIndex)],
  ['CompilerOptions and VirtualFileWriter are type-only exports', /type CompilerOptions,[\s\S]*type VirtualFileWriter/.test(passIndex)],
  ['ResolveArtifacts is a type-only export', /type ResolveArtifacts,/.test(passIndex)],
  ['PassResult is a type-only export', /type PassResult,/.test(passIndex)],
  ['runtime adapter and pass manager remain value exports', /export \{ createTypedPassAdapter \}/.test(passIndex) && /export \{ PassManager \}/.test(passIndex)],
  ['compiler barrel preserves pass contract type modifiers', /type PassDescriptor,[\s\S]*type PassDependency,[\s\S]*type CompilerPass,[\s\S]*type ExecutablePass/.test(compilerIndex)],
  ['compiler barrel keeps runtime pass infrastructure as values', /createTypedPassAdapter,[\s\S]*PassGraph,[\s\S]*PassManager,[\s\S]*CompilationState,[\s\S]*CompilationContext/.test(compilerIndex)],
];
let failures = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
  if (!pass) failures++;
}
console.log(`${checks.length - failures}/${checks.length} checks passed`);
process.exitCode = failures ? 1 : 0;
