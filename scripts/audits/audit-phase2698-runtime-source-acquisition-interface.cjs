#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail });
const sourceFile = 'packages/core/src/compiler/scanner/sourceFiles.ts';
const acquisition = read(sourceFile);
const consumers = [
  'packages/core/src/compiler/semantic/sourceAstEvidenceAcquisition.ts',
  'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts',
  'packages/core/src/compiler/frontend/php/resourceSourceEvidence.ts',
  'packages/core/src/compiler/scanner/operations/controller/responseDtoReader.ts',
  'packages/core/src/compiler/scanner/operations/ChannelScanner.ts',
  'packages/core/src/compiler/scanner/operations/responseScanner.ts',
  'packages/core/src/compiler/scanner/operations/providerAstCanonical.ts',
  'packages/core/src/compiler/scanner/operations/serviceAstCanonical.ts',
  'packages/core/src/compiler/scanner/operations/middlewareAstCanonical.ts',
  'packages/core/src/compiler/scanner/operations/FormRequestScanner.ts',
  'packages/core/src/compiler/scanner/operations/migrationAstCanonical.ts',
  'packages/core/src/compiler/scanner/__test__/createNotConnectedControllerInventoryReceipt.ts',
  'packages/core/src/compiler/scanner/laravelFormRequestScanner.ts',
  'packages/core/src/compiler/scanner/laravelModelScanner.ts',
];
const consumerSources = consumers.map(read);
check('source acquisition has a named interface with explicit async and sync contracts', /export interface SourceFileAcquisitionInterface/.test(acquisition) && /collectPhpFiles: \(directory: string\) => Promise<readonly string\[\]>/.test(acquisition) && /readSourceText: \(file: string\) => Promise<string>/.test(acquisition) && /readSourceTextSync: \(file: string\) => string/.test(acquisition));
check('runtime exports a single frozen interface-typed source acquisition object', /export const sourceFileAcquisition:\s*SourceFileAcquisitionInterface\s*=\s*Object\.freeze\(\{/.test(acquisition));
check('legacy free-function exports are removed from source acquisition', !/^\s*export\s+(?:async\s+)?function\s+(?:collectPhpFiles|readSourceText|readSourceTextSync)\b/m.test(acquisition) && !/^\s*export\s+const\s+(?:collectPhpFiles|readSourceText|readSourceTextSync)\b/m.test(acquisition));
check('recursive traversal uses the same typed runtime object', /sourceFileAcquisition\.collectPhpFiles\(fullPath\)/.test(acquisition));
check('PHP collection behavior preserves missing-root empty result and immutable file list', /if \(!fs\.existsSync\(directory\)\) return Object\.freeze\(\[\]\)/.test(acquisition) && /return Object\.freeze\(files\)/.test(acquisition));
check('async and sync source reads remain explicit typed operations', /readSourceText: async \(file: string\): Promise<string> => fs\.promises\.readFile\(file, 'utf-8'\)/.test(acquisition) && /readSourceTextSync: \(file: string\): string => fs\.readFileSync\(file, 'utf-8'\)/.test(acquisition));
check('all live scanner consumers import the interface object', consumerSources.every(source => /import \{ sourceFileAcquisition \} from ['"][^'"]*sourceFiles['"]/.test(source)));
check('all scanner call sites use explicit object methods', consumerSources.every(source => !/(^|[^.\w])(?:collectPhpFiles|readSourceTextSync|readSourceText)\(/m.test(source)));
check('semantic source AST evidence now uses the canonical scanner acquisition object', /sourceFileAcquisition\.collectPhpFiles\(/.test(consumerSources[0]) && /sourceFileAcquisition\.readSourceText\(/.test(consumerSources[0]) && !/scanner\/operations\/scannerUtils/.test(consumerSources[0]));
check('controller execution dependencies inject the object method, not a free function', /readSourceText:\s*sourceFileAcquisition\.readSourceText/.test(consumerSources[1]));
check('no direct sourceFiles imports retain legacy function names', consumers.every(file => !/import\s*\{[^}]*\b(?:collectPhpFiles|readSourceTextSync|readSourceText)\b[^}]*\}\s*from\s*['"][^'"]*sourceFiles/.test(read(file))));
const syntaxFiles = [sourceFile, ...consumers];
for (const relative of syntaxFiles) {
  const result = ts.transpileModule(read(relative), { fileName: relative, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  const errors = (result.diagnostics || []).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
  check(`TypeScript syntax: ${relative}`, errors.length === 0, errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('; '));
}
const result = { phase: 2698, audit: 'runtime-source-acquisition-interface', passed: checks.filter(item => item.ok).length, total: checks.length, syntaxFiles: syntaxFiles.length, syntaxPassed: checks.filter(item => item.name.startsWith('TypeScript syntax:') && item.ok).length, checks, typecheck: 'full project typecheck not run', notes: ['Transpile syntax checks do not prove type compatibility, filesystem behavior, build, or CLI integration.'] };
fs.writeFileSync(path.join(root, 'PHASE2698_RUNTIME_SOURCE_ACQUISITION_INTERFACE_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log('# Phase 2698 — Runtime Source Acquisition Interface\n');
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`RESULT ${result.passed}/${result.total}; syntax ${result.syntaxPassed}/${syntaxFiles.length}`);
if (checks.some(item => !item.ok)) process.exitCode = 1;
