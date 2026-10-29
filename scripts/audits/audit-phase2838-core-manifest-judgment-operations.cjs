'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const barrel = read('packages/core/src/index.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['core judgment has explicit typed follow-up handlers', /interface ManifestBuilderJudgmentHandlers<Result>[\s\S]*onComplete:[\s\S]*onBlocked:/.test(contract)],
  ['complete terminal carries a generic continueWith operation', /interface ManifestBuilderCompleteJudgment[\s\S]*continueWith: <Result>/.test(contract)],
  ['source-AST blocked terminal carries continueWith', /interface ManifestBuilderSourceAstBlockedJudgment[\s\S]*continueWith: <Result>/.test(contract)],
  ['source-model blocked terminal carries continueWith', /interface ManifestBuilderSourceModelBlockedJudgment[\s\S]*continueWith: <Result>/.test(contract)],
  ['AST blocked producer binds continuation to the original blocked terminal', /stage: 'source_ast',[\s\S]*continueWith: handlers => handlers\.onBlocked\(blockedJudgment\)/.test(builder)],
  ['source-model blocked producer binds continuation to the original blocked terminal', /stage: 'source_model',[\s\S]*continueWith: handlers => handlers\.onBlocked\(blockedJudgment\)/.test(builder)],
  ['complete producer binds continuation to the original complete terminal', /continueWith: handlers => handlers\.onComplete\(completeJudgment\)/.test(builder)],
  ['scanner flow projection consumes the ADT operation rather than dispatching on kind', /judgment\.continueWith\(\{[\s\S]*onBlocked: blocked => blocked,[\s\S]*onComplete: complete =>/.test(scanner) && !/if \(judgment\.kind/.test(scanner)],
  ['typed operation handlers are exported by core barrel', /ManifestBuilderJudgmentHandlers/.test(barrel)],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['audit script is registered', pkg.scripts?.['audit:phase2838-core-manifest-judgment-operations'] === 'node scripts/audits/audit-phase2838-core-manifest-judgment-operations.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2838 core manifest judgment operations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build, complete test suite, or CLI end-to-end run.');
if (failed) process.exitCode = 1;
