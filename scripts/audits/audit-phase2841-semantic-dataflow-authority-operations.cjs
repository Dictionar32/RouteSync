'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const contract = read('packages/core/src/types/upstream/semanticDataflow.ts');
const executor = read('packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts');
const surface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const barrel = read('packages/core/src/index.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['existing upstream authority interface owns derivation validation operation', /interface SemanticDataflowReasoningAuthorityInterface[\s\S]*validateDerivations:\s*\(closure: readonly SemanticDataflowFact\[\], derivations: readonly SemanticDataflowDerivation\[\]\) => boolean/.test(contract)],
  ['canonical authority export is interface-first and frozen', /export const semanticDataflowReasoningAuthority:\s*SemanticDataflowReasoningAuthorityInterface\s*=\s*Object\.freeze\(/.test(authority)],
  ['judgment derivation is bound directly to the authority operation', /judge:\s*\(input: SemanticDataflowInput\): SemanticDataflowJudgment\s*=>/.test(authority)],
  ['derivation validation is an authority-owned domain operation', /validateDerivations:\s*\(closure:[\s\S]*?derivationsAreValid\(closure, derivations\)/.test(authority)],
  ['derivation invariant remains enforced before returning judgment', /if\s*\(!derivationsAreValid\(closure, derivations\)\)\s*throw new Error\('semantic dataflow derivation invariant violated'\)/.test(authority)],
  ['standalone exported judgment factory is removed', !/export const createSemanticDataflowJudgment\b|export function createSemanticDataflowJudgment\b/.test(authority)],
  ['standalone exported validator is removed', !/export const validateSemanticDataflowDerivations\b|export function validateSemanticDataflowDerivations\b/.test(authority)],
  ['runtime executor consumes the existing upstream authority contract', /authority\.judge\(request\.input\.value\)/.test(executor) && /SemanticDataflowReasoningAuthorityInterface/.test(executor)],
  ['manifest surface consumes the same upstream authority contract', /semanticDataflowReasoningAuthority/.test(surface) && /authority\.judge\(inputs\.head\)/.test(surface)],
  ['core barrel exports the authority object but not removed free factory', /export \{ semanticDataflowReasoningAuthority \}/.test(barrel) && !/export \{ createSemanticDataflowJudgment/.test(barrel)],
  ['collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['audit script is registered', pkg.scripts?.['audit:phase2841-semantic-dataflow-authority-operations'] === 'node scripts/audits/audit-phase2841-semantic-dataflow-authority-operations.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2841 semantic-dataflow authority operations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build or end-to-end scan.');
if (failed) process.exitCode = 1;
