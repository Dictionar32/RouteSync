const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerRequestSemanticBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerRequestSemanticBindingAuthority.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionContract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const actionJudgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const index = read('packages/core/src/index.ts');

const checks = [
  ['request evidence carries complete parameter inventory', /kind: 'controller_method_parameters'[\s\S]*parameters: readonly LaravelControllerRequestParameterEvidence\[\]/.test(contract)],
  ['request parameter evidence separates request origins from other parameters', /kind: 'request_origin'[\s\S]*declaredType: PhpParameterTypeEvidence[\s\S]*kind: 'non_request_parameter'/.test(contract)],
  ['upstream authority owns request-origin selection', /evidence\.parameters\.find\(candidate => candidate\.kind === 'request_origin'\)/.test(authority)],
  ['interface declares the semantic rule precedence executed by the authority', /readonly rulePrecedence: readonly \[/.test(contract) && /rulePrecedence: Object\.freeze/.test(authority) && /otherwise_resolve_declared_php_parameter_type/.test(authority)],
  ['upstream authority owns FormRequest and framework Request classification', /evidence\.formRequests\.find/.test(authority) && /frameworkRequestTypes\.find/.test(authority)],
  ['unsupported and malformed type outcomes remain unresolved', /case 'unsupported':[\s\S]*case 'malformed':[\s\S]*kind: 'typed_unresolved'/.test(authority)],
  ['wiring adapts source parameters instead of reading legacy request contract', /canonicalRequestBinding\(input\.method, input\.formRequestIndex\)/.test(wiring) && !/canonicalRequestBinding\(result\.contract\.request\)/.test(wiring)],
  ['legacy schema request compatibility remains explicitly open', /legacy_schema_request_binding_compatibility/.test(actionJudgment) && /legacy-schema-request-binding-compatibility-remains-open/.test(actionJudgment)],
  ['action semantic contract version 18 aligns with production composition', /readonly version: 18;/.test(actionJudgment) && /version: 18 as const/.test(wiring)],
  ['new evidence types are publicly exported', /LaravelControllerRequestParameterEvidence/.test(index) && /LaravelControllerFormRequestBindingEvidence/.test(index)],
];

const syntaxFiles = [
  'packages/core/src/types/upstream/laravelControllerRequestSemanticBindingInterface.ts',
  'packages/core/src/types/upstream/laravelControllerRequestSemanticBindingAuthority.ts',
  'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts',
  'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts',
  'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts',
  'packages/core/src/index.ts',
];
for (const file of syntaxFiles) {
  const result = ts.transpileModule(read(file), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  checks.push([`syntax transpilation: ${file}`, !(result.diagnostics ?? []).some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)]);
}

const failed = checks.filter(([, passed]) => !passed);
const report = {
  phase: 2148,
  title: 'Request Binding Source Authority, Interface First',
  passed: checks.length - failed.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  limitations: ['No full build', 'No full typecheck', 'No Vitest run', 'Static contract audit and syntax-only transpilation do not establish runtime correctness'],
};
fs.writeFileSync(path.join(root, 'reports/phase2148/PHASE2148_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`Phase 2148: ${report.passed}/${report.total} passed\n`);
if (failed.length > 0) process.exitCode = 1;
