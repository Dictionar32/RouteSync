const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const relative = 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingBatchAuthority.ts';
const source = fs.readFileSync(path.join(root, relative), 'utf8');
const interfaceSource = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts'), 'utf8');
const syntax = ts.transpileModule(source, {
  fileName: path.join(root, relative),
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
});
const runtimeModule = { exports: {} };
new Function('exports', 'require', 'module', syntax.outputText)(runtimeModule.exports, require, runtimeModule);
const projection = runtimeModule.exports.phpSourceDocumentIdentityBindingReadResultProjection;
const first = Object.freeze({ kind: 'read', identity: 'A' });
const second = Object.freeze({ kind: 'read', identity: 'B' });
const projected = projection.project(Object.freeze([
  Object.freeze({ kind: 'bound', result: first }),
  Object.freeze({ kind: 'bound', result: second }),
]));
const checks = {
  namedHelperFunctionRemoved: !/const readResultsFromBindings\s*=/.test(source),
  interfaceDeclaredForDomainOperation: /export interface PhpSourceDocumentIdentityBindingReadResultProjectionInterface\s*\{[\s\S]*?kind:[\s\S]*?project:/.test(interfaceSource),
  exportedOperationUsesExplicitInterfaceObject: /export const phpSourceDocumentIdentityBindingReadResultProjection:\s*PhpSourceDocumentIdentityBindingReadResultProjectionInterface\s*= Object\.freeze\(\{/.test(source),
  operationIsFrozen: Object.isFrozen(projection),
  projectionPreservesOrderAndResultIdentity: projected.length === 2 && projected[0] === first && projected[1] === second,
  projectedResultIsFrozen: Object.isFrozen(projected),
  bothBatchOutcomesUseDomainProjection: (source.match(/readResults:\s*\(\) => phpSourceDocumentIdentityBindingReadResultProjection\.project\(bindings\)/g) || []).length === 2,
  noExportedFunctionDeclarationAdded: !/^export\s+function\s+/m.test(source),
  syntaxTranspileClean: (syntax.diagnostics || []).length === 0,
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const report = {
  phase: 3085,
  title: 'Fully Explicit Simplicity Typed Runtime Scanner Operations — interface-first read-result projection',
  status: failed.length === 0 ? 'PASS_STRUCTURAL' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics: (syntax.diagnostics || []).map(diagnostic => ({ code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') })),
  runtimeTrace: 'Identity-binding judgment → phpSourceDocumentIdentityBindingReadResultProjection.project(bindings) → immutable ordered read-result projection → CLI document-read batch → semantic invocation → manifest composition → canonical manifest generator.',
  verification: {
    focusedRuntimeProjection: 'EXECUTED',
    syntaxTranspile: (syntax.diagnostics || []).length === 0 ? 'PASS' : 'FAIL',
    strictWholeWorkspaceTypecheck: 'NOT_RUN',
    fullTestSuite: 'NOT_RUN',
    endToEnd: 'NOT_RUN',
  },
  remainingNote: 'The object operation now follows the requested export const name: Interface = Object.freeze({...}) form. Its internal iteration remains intentionally visible as projection mechanics; this phase does not claim blanket elimination of all loops or control flow.',
};
fs.writeFileSync(path.join(root, 'PHASE3085_INTERFACE_FIRST_READ_RESULT_PROJECTION_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, pass] of Object.entries(checks)) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${report.status}: ${report.passed}/${report.total} checks passed\n`);
if (report.status !== 'PASS_STRUCTURAL') process.exitCode = 1;
