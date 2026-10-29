#!/usr/bin/env node
'use strict';

// Phase 3120: static CJS + TypeScript AST guard for the real Laravel controller-discovery runtime path.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const upstreamPath = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts';
const coreIndexPath = 'packages/core/src/index.ts';
const cliPath = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const upstreamText = fs.readFileSync(path.join(root, upstreamPath), 'utf8');
const coreIndexText = fs.readFileSync(path.join(root, coreIndexPath), 'utf8');
const cliText = fs.readFileSync(path.join(root, cliPath), 'utf8');
const upstream = ts.createSourceFile(upstreamPath, upstreamText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const cli = ts.createSourceFile(cliPath, cliText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const checks = [];
const check = (name, passed, value) => checks.push({ check: name, passed: Boolean(passed), ...(value === undefined ? {} : { value }) });

const expectedContinuations = [
  ['LaravelControllerSourceDiscoveryDirectoryContinuationInterface', 'discoverNestedDirectory'],
  ['LaravelControllerSourceDiscoverySymbolicLinkContinuationInterface', 'blockUnresolvedSymbolicLink'],
  ['LaravelControllerSourceDiscoveryPhpSourceContinuationInterface', 'includePhpSource'],
  ['LaravelControllerSourceDiscoveryIgnoredContinuationInterface', 'preserveDiscoveryJudgment'],
];
for (const [contract, operation] of expectedContinuations) {
  const declaration = upstream.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === contract);
  check(`${contract} defines explicit ${operation} domain operation`, Boolean(declaration?.members.some(member => ts.isPropertySignature(member) && member.name?.getText(upstream) === operation)));
  check(`${contract} is exported from core`, coreIndexText.includes(contract));
}
check('legacy generic discovery-entry handlers are retired', !/interface\s+LaravelControllerSourceDiscoveryEntryHandlers\b/.test(upstreamText) && !/LaravelControllerSourceDiscoveryEntryHandlers/.test(coreIndexText));
check('entry continuation takes no visitor/handler argument', /readonly\s+continueDiscovery:\s*\(\)\s*=>\s*Promise<LaravelControllerSourceDiscoveryResult>/.test(upstreamText));
check('entry factories bind continuation operations at construction', expectedContinuations.every(([, operation]) => upstreamText.includes(`continuation.${operation}()`)));
check('CLI runtime invokes entry-owned continuation without a visitor', /await\s+classifiedEntry\.continueDiscovery\(\)/.test(cliText) && !/classifiedEntry\.continueDiscovery\(\s*\{/.test(cliText));
check('CLI binds nested-directory discovery to the real source reader', /discoverNestedDirectory:\s*\(\)\s*=>\s*controllerPhpSourceDiscoveryOperation\.discover\(/.test(cliText));
check('CLI binds symbolic-link blocker to upstream judgment operation', /blockUnresolvedSymbolicLink:\s*\(\)\s*=>\s*Promise\.resolve\(currentJudgment\.block\(/.test(cliText));
check('CLI binds PHP source inclusion to upstream judgment operation', /includePhpSource:\s*\(\)\s*=>\s*Promise\.resolve\(currentJudgment\.includeSource\(/.test(cliText));
check('CLI explicitly preserves judgment for ignored entries', /preserveDiscoveryJudgment:\s*\(\)\s*=>\s*Promise\.resolve\(currentJudgment\)/.test(cliText));
check('upstream source keeps all four discovery-entry variants', ['directory_entry', 'symbolic_link_entry', 'php_source_entry', 'ignored_entry'].every(kind => upstreamText.includes(`laravel_controller_discovery_${kind}`)));

const packageFiles = [];
const collect = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (entry.isFile() && /\.tsx?$/.test(entry.name)) packageFiles.push(full);
  }
};
collect(path.join(root, 'packages'));
const parseFailures = [];
for (const file of packageFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  if (ast.parseDiagnostics.length) parseFailures.push({ file: path.relative(root, file), diagnostics: ast.parseDiagnostics.length });
}
check('all package TypeScript files parse without syntax diagnostics', packageFiles.length > 0 && parseFailures.length === 0, { parsed: packageFiles.length, failures: parseFailures });

const report = {
  phase: 3120,
  title: 'Entry-Owned Explicit Runtime Continuation Migration',
  execution: 'static-cjs-typescript-ast-no-vitest',
  runtimePath: 'Node Dirent adapter -> upstream Laravel source-discovery entry ADT -> nested discovery / blocker / source inclusion / judgment preservation',
  migratedDomain: 'LaravelControllerSourceDiscoveryEntry',
  checks,
  failed: checks.filter(item => !item.passed),
  selectedRuntimeSliceMigrationComplete: checks.every(item => item.passed),
  repositoryWideExportInterfaceMigrationComplete: false,
  globalPrimitiveEliminationComplete: false,
  fullTypecheck: 'not verified: this extracted workspace has no installed project dependencies or @types/node/vitest declarations',
  endToEndRuntimeTest: 'not run in this environment',
};
const reportPath = path.join(root, 'reports/PHASE3120_ENTRY_OWNED_RUNTIME_CONTINUATION_MIGRATION.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.check}${item.value === undefined ? '' : `: ${JSON.stringify(item.value)}`}\n`);
process.stdout.write(`Report: ${path.relative(root, reportPath)}\n`);
if (report.failed.length) process.exitCode = 1;
