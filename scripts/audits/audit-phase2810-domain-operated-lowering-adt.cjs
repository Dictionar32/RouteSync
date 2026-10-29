const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
let passed = 0;
let failed = 0;
function check(name, condition, detail) {
  if (condition) { passed += 1; process.stdout.write(`PASS ${name}: ${detail}\n`); }
  else { failed += 1; process.stderr.write(`FAIL ${name}: ${detail}\n`); }
}
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const integrated = read('packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts');
const outcome = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionOutcome.ts');
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const collectionsBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
check('lowering ADT has explicit success payload', /interface AuthorityBackedRouteManifestTypeLoweredOutcome/.test(lowering) && /kind: 'lowered'/.test(lowering), 'projectable derivation remains distinct');
check('lowering ADT has explicit blocked payload', /interface AuthorityBackedRouteManifestTypeLoweringBlockedOutcome/.test(lowering) && /kind: 'derivation_not_projectable'/.test(lowering), 'all non-projectable derivations preserve evidence');
check('lowering ADT carries a domain continuation', /readonly continue: \(handlers: AuthorityBackedRouteManifestTypeLoweringOutcomeHandlers\) => RouteManifestProjectionCompositionResult/.test(lowering), 'each concrete result provides follow-up behavior');
check('lowering variant invokes its owned handler', /handlers\.lowered\(outcome\)/.test(lowering) && /handlers\.derivation_not_projectable\(outcome\)/.test(lowering), 'no external discriminant dispatch is required');
check('composition consumes continuation without switch', /result\.continue\(\{/.test(composition) && !/switch\s*\(/.test(composition), 'composition does not re-decide the lowering outcome');
check('composition builds manifest only on lowered branch', /lowered: \(lowered\) =>/.test(composition) && /routeSyncManifestLoweringOperations\.lower/.test(composition), 'manifest creation stays on verified path');
check('blocked path retains original derivation', /derivation: blocked\.derivation/.test(composition), 'blocked outcome retains evidence and ledger');
check('composition result still carries its continuation', /readonly continue: \(handlers: RouteManifestProjectionCompositionOutcomeHandlers\) => RouteManifest/.test(outcome), 'consumer-facing ADT remains domain-operated');
check('projection boundary reuses lowering ADT', /type AuthorityBackedRouteManifestProjectionResult = AuthorityBackedRouteManifestTypeLoweringResult/.test(projection), 'no duplicate projection union');
check('integrated boundary reuses composition ADT', /type IntegratedRouteManifestAuthorityResult = RouteManifestProjectionCompositionResult/.test(integrated), 'no integrated result renaming');
check('upstream derivation contract already owns runtime ADT', /export type RequestTypeDerivationRuntimeExecutionResult =/.test(upstream) && /export interface RequestTypeDerivationOperationPreparationInterface/.test(upstream), 'no duplicate upstream semantic contract added');
check('no generic visitor or never assertion', !/OutcomeHandlers\s*<\s*T\s*>|continue\s*<\s*T\s*>|as\s+never/.test(lowering + composition + outcome), 'dispatch remains concrete and typed');
check('runtime factories remain interface-first', /export const authorityBackedRouteManifestTypeLoweringFactory:\s*AuthorityBackedRouteManifestTypeLoweringFactoryInterface\s*=\s*Object\.freeze/.test(lowering) && /export const routeManifestProjectionCompositionFactory:\s*RouteManifestProjectionCompositionFactoryInterface\s*=\s*Object\.freeze/.test(composition), 'public runtime operations are frozen and interface typed');
check('collections module remains empty', collectionsBytes === 0, `actual size=${collectionsBytes} bytes`);
check('audit command registered', packageJson.scripts['audit:phase2810-domain-operated-lowering-adt'] === 'node scripts/audits/audit-phase2810-domain-operated-lowering-adt.cjs', 'audit command is reproducible');
process.stdout.write(`\nPhase 2810 domain-operated lowering ADT audit: ${passed}/15 passed; ${failed} failed.\n`);
if (failed > 0) process.exitCode = 1;
