'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const cliContractPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const upstreamContractPath = path.join(root, 'packages/core/src/types/upstream/manifestBuilderInterface.ts');
const builderPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const cliContract = fs.readFileSync(cliContractPath, 'utf8');
const upstreamContract = fs.readFileSync(upstreamContractPath, 'utf8');
const builder = fs.readFileSync(builderPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [];
const check = (label, assertion) => { assertion(); checks.push(label); };

check('CLI manifest judgment adapter delegates to the upstream-owned operation without kind dispatch', () => {
  const start = composition.indexOf('fromManifestBuilderJudgment:');
  assert.notEqual(start, -1);
  const end = composition.indexOf('\n  }),', start);
  const body = composition.slice(start, end === -1 ? start + 900 : end);
  assert.match(body, /requireCompleteManifest:\s*\(\)\s*=>\s*judgment\.requireCompleteManifest\(\)/);
  assert.doesNotMatch(body, /\bif\s*\(|\bswitch\s*\(|judgment\.kind/);
});
check('complete upstream judgment owns manifest success operation', () => {
  const complete = upstreamContract.slice(upstreamContract.indexOf('export interface ManifestBuilderCompleteJudgment'), upstreamContract.indexOf('export interface ManifestBuilderSourceAstBlocker'));
  assert.match(complete, /readonly requireCompleteManifest:\s*\(\)\s*=>\s*RouteSyncManifest/);
  assert.match(builder, /requireCompleteManifest:\s*\(\)\s*=>\s*completeJudgment\.manifest/);
});
check('each blocked upstream judgment owns rejection operation', () => {
  const blocked = upstreamContract.slice(upstreamContract.indexOf('export interface ManifestBuilderSourceAstBlockedJudgment'), upstreamContract.indexOf('export type ManifestBuilderBlockedJudgment'));
  assert.equal((blocked.match(/readonly requireCompleteManifest:\s*\(\)\s*=>\s*never/g) || []).length, 2);
  assert.equal((builder.match(/new ManifestBuilderBlockedError\(blockedJudgment\)/g) || []).length, 2);
});
check('blocked error retains the original judgment and blocker evidence', () => {
  assert.match(upstreamContract, /export class ManifestBuilderBlockedError extends Error/);
  assert.match(upstreamContract, /constructor\(readonly judgment: ManifestBuilderBlockedJudgment\)/);
  assert.match(upstreamContract, /JSON\.stringify\(judgment\.blocker\)/);
});
check('core public barrel exports the runtime blocked-error class', () => {
  assert.match(barrel, /export \{ ManifestBuilderBlockedError \} from '\.\/types\/upstream\/manifestBuilderInterface'/);
});
check('CLI contract documents operation delegation instead of outcome redispatch', () => {
  assert.match(cliContract, /without redispatching on the judgment kind/);
});
check('deleted relation foundation remains absent', () => {
  for (const moduleName of ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts']) {
    assert.equal(fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', moduleName)), false);
  }
});

const reportPath = path.join(root, 'reports/PHASE3125_UPSTREAM_OWNED_MANIFEST_TERMINAL_OPERATION.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({ phase: 3125, subject: 'Upstream-owned manifest terminal operation migration', checksPassed: checks.length, checksFailed: 0, checks }, null, 2)}\n`);
console.log(`Phase 3125 upstream-owned manifest terminal operation: ${checks.length}/${checks.length} checks passed`);
for (const label of checks) console.log(`PASS ${label}`);
console.log(`Report: ${path.relative(root, reportPath)}`);
