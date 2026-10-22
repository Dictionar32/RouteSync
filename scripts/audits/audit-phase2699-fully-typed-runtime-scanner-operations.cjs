#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail });
const projectionPath = 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts';
const projection = read(projectionPath);
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const integrated = read('packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts');
const sourceAcquisition = read('packages/core/src/compiler/scanner/sourceFiles.ts');
const sourceAst = read('packages/core/src/compiler/semantic/sourceAstEvidenceAcquisition.ts');
const coreIndex = read('packages/core/src/index.ts');
check('projection factory has a named interface with a fully typed create contract',
  /export interface RouteManifestProjectionCompositionFactoryInterface/.test(projection) &&
  /readonly create:\s*\(\s*pipeline: RequestTypeDerivationSemanticPipelineInterface,\s*\) => RouteManifestProjectionCompositionInterface/.test(projection));
check('projection factory is exported as one frozen interface-typed runtime object',
  /export const routeManifestProjectionCompositionFactory:\s*RouteManifestProjectionCompositionFactoryInterface\s*=\s*Object\.freeze\(\{/.test(projection));
check('legacy exported projection factory function is removed',
  !/export\s+(?:async\s+)?function\s+createRouteManifestProjectionComposition\b/.test(projection) &&
  !/export const createRouteManifestProjectionComposition\b/.test(projection));
check('scan and sync use the typed factory object on the live runtime path',
  /routeManifestProjectionCompositionFactory\.create\(requestTypeDerivationPipeline\)\.project\(/.test(scan) &&
  /routeManifestProjectionCompositionFactory\.create\(requestTypeDerivationPipeline\)\.project\(/.test(sync));
check('integrated manifest authority uses the same typed projection factory',
  /routeManifestProjectionCompositionFactory\.create\(pipeline\)/.test(integrated));
check('public core boundary exports the factory object and its interface',
  /export \{ routeManifestProjectionCompositionFactory \}/.test(coreIndex) &&
  /export type \{ RouteManifestProjectionCompositionFactoryInterface \}/.test(coreIndex) &&
  !/createRouteManifestProjectionComposition/.test(coreIndex));
check('CLI scan and sync both request the canonical upstream manifest operation',
  /manifestScanOperation\.scan\(Object\.freeze\(/.test(scan) &&
  /manifestScanOperation\.scan\(Object\.freeze\(/.test(sync));
check('projection is gated on the closed projected result; blocked judgments remain explicit',
  /case 'projected'/.test(projection) &&
  /case 'not_projectable'/.test(projection) &&
  /kind: 'manifest_projection_blocked'/.test(projection) &&
  /lowerRouteSyncManifestToRouteManifest/.test(projection));
check('source acquisition remains interface-first and canonical for semantic source AST evidence',
  /export const sourceFileAcquisition:\s*SourceFileAcquisitionInterface\s*=\s*Object\.freeze\(\{/.test(sourceAcquisition) &&
  /sourceFileAcquisition\.collectPhpFiles\(/.test(sourceAst) &&
  /sourceFileAcquisition\.readSourceText\(/.test(sourceAst));
const syntaxFiles = [
  projectionPath,
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts',
  'packages/core/src/index.ts',
];
for (const relative of syntaxFiles) {
  const result = ts.transpileModule(read(relative), {
    fileName: relative, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  check(`TypeScript syntax: ${relative}`, errors.length === 0,
    errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('; '));
}
const result = {
  phase: 2699,
  audit: 'fully-typed-runtime-scanner-operations',
  passed: checks.filter(c => c.ok).length,
  total: checks.length,
  syntaxFiles: syntaxFiles.length,
  syntaxPassed: checks.filter(c => c.name.startsWith('TypeScript syntax:') && c.ok).length,
  checks,
  typecheck: 'full project typecheck not run',
  notes: [
    'Structural and transpile syntax checks do not prove full TypeScript type compatibility or runtime CLI integration.',
    'The production RequestType semantic reasoning/verifier gap documented in Phase 2636 remains unresolved and must continue to fail closed.'
  ]
};
fs.writeFileSync(path.join(root, 'PHASE2699_FULLY_TYPED_RUNTIME_SCANNER_OPERATIONS_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log('# Phase 2699 — Fully Typed Runtime Scanner Operations\n');
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`RESULT ${result.passed}/${result.total}; syntax ${result.syntaxPassed}/${syntaxFiles.length}`);
if (checks.some(c => !c.ok)) process.exitCode = 1;
