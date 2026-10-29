'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const interfacePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const contract = fs.readFileSync(interfacePath, 'utf8');
const checks = [];
const check = (label, assertion) => { assertion(); checks.push(label); };

check('CLI manifest boundary no longer calls unsupported generic continueWith visitor', () => {
  const start = composition.indexOf('fromManifestBuilderJudgment:');
  assert.notEqual(start, -1);
  const end = composition.indexOf('\n  }),', start);
  const body = composition.slice(start, end === -1 ? start + 1200 : end);
  assert.doesNotMatch(body, /\.continueWith\s*\(/);
  assert.match(body, /requireCompleteManifest:\s*\(\)\s*=>\s*judgment\.requireCompleteManifest\(\)/);
  assert.doesNotMatch(body, /\bif\s*\(|\bswitch\s*\(|judgment\.kind/);
});
check('complete judgment preserves the original manifest terminal', () => {
  const upstreamPath = path.join(root, 'packages/core/src/types/upstream/manifestBuilderInterface.ts');
  const upstream = fs.readFileSync(upstreamPath, 'utf8');
  assert.match(upstream, /readonly requireCompleteManifest:\s*\(\)\s*=>\s*RouteSyncManifest/);
});
check('blocked judgment preserves the original blocker terminal', () => {
  const upstreamPath = path.join(root, 'packages/core/src/types/upstream/manifestBuilderInterface.ts');
  const upstream = fs.readFileSync(upstreamPath, 'utf8');
  assert.match(upstream, /export class ManifestBuilderBlockedError extends Error/);
  assert.match(upstream, /constructor\(readonly judgment: ManifestBuilderBlockedJudgment\)/);
});
check('upstream manifest contract remains the source of complete and blocked judgments', () => {
  const upstreamPath = path.join(root, 'packages/core/src/types/upstream/manifestBuilderInterface.ts');
  const upstream = fs.readFileSync(upstreamPath, 'utf8');
  assert.match(upstream, /export type ManifestBuilderJudgment = ManifestBuilderCompleteJudgment \| ManifestBuilderBlockedJudgment/);
  assert.match(upstream, /readonly continueToFlow:/);
  assert.doesNotMatch(upstream, /continueWith\s*</);
});
check('CLI boundary contract describes the actual closed-ADT adaptation', () => {
  assert.match(contract, /without redispatching on the judgment kind/);
  assert.doesNotMatch(contract, /never by redispatching on kind/);
});
check('deleted relation foundation remains absent', () => {
  for (const moduleName of ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts']) {
    assert.equal(fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', moduleName)), false);
  }
});

const reportPath = path.join(root, 'reports/PHASE3124_MANIFEST_JUDGMENT_BOUNDARY_MIGRATION.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({ phase: 3124, subject: 'CLI manifest builder judgment boundary migration', checksPassed: checks.length, checksFailed: 0, checks }, null, 2)}\n`);
console.log(`Phase 3124 manifest judgment boundary migration: ${checks.length}/${checks.length} checks passed`);
for (const label of checks) console.log(`PASS ${label}`);
console.log(`Report: ${path.relative(root, reportPath)}`);
