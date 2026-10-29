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
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const integrated = read('packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const outcome = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionOutcome.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const packageJson = JSON.parse(read('package.json'));
const collectionsBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
check('projection result reuses lowering ADT', /type AuthorityBackedRouteManifestProjectionResult = AuthorityBackedRouteManifestTypeLoweringResult/.test(projection), 'no projected/not_projectable duplicate union');
check('projection authority delegates directly', /project:\s*\(preflight: RouteManifestRequestResolutionPreflight\): AuthorityBackedRouteManifestProjectionResult =>\s*lowering\.project\(preflight\)/.test(projection), 'projection boundary adds no second kind conversion');
check('projection authority has no result switch', !/switch\s*\(/.test(projection), 'redundant exhaustive conversion removed');
check('composition consumes lowerer-owned continuation', /result\.continue\(\{/.test(composition) && !/switch\s*\(/.test(composition), 'manifest composition does not inspect the lowerer discriminant');
check('integrated result reuses composition ADT', /type IntegratedRouteManifestAuthorityResult = RouteManifestProjectionCompositionResult/.test(integrated), 'no integrated_manifest/manifest_derivation_blocked duplicate union');
check('integrated authority delegates without ADT switch', !/switch\s*\(/.test(integrated) && /composition\.project\(routeManifestRequestResolutionPreflight\.evaluate\(manifest\), baseURL, version\)/.test(integrated), 'integration preserves continuation-bearing result and evaluates real preflight');
check('domain continuation remains on composition ADT', /readonly continue: \(handlers: RouteManifestProjectionCompositionOutcomeHandlers\) => RouteManifest/.test(outcome), 'composition outcome retains concrete follow-up operation');
check('lowering ADT owns its continuation', /readonly continue: \(handlers: AuthorityBackedRouteManifestTypeLoweringOutcomeHandlers\) => RouteManifestProjectionCompositionResult/.test(lowering), 'lowering result carries a concrete continuation into manifest composition');
check('lowering delegates semantic outcome handling to upstream operation', /derivation\.continueForManifestProjection\(\{/.test(lowering) && /switch\s*\(disposition\.kind\)/.test(lowering), 'upstream owns semantic outcome continuation; lowering exhaustively handles only projectability disposition');
check('preparation factory remains interface-first', /export const requestTypeDerivationOperationPreparationFactory:\s*RequestTypeDerivationOperationPreparationFactoryInterface\s*=\s*Object\.freeze/.test(preparation), 'runtime preparation remains an interface-typed frozen operation');
check('no generic dispatch or never assertion added', !/OutcomeHandlers\s*<\s*T\s*>|continue\s*<\s*T\s*>|consume\s*<\s*T\s*>|as\s+never/.test(composition + projection + integrated), 'domain ADT has no generic visitor or assertion escape hatch');
check('collections module remains empty', collectionsBytes === 0, `actual size=${collectionsBytes} bytes`);
check('audit command registered', packageJson.scripts['audit:phase2809-domain-adt-conversion-erasure'] === 'node scripts/audits/audit-phase2809-domain-adt-conversion-erasure.cjs', 'audit command is reproducible');
process.stdout.write(`\nPhase 2809 domain ADT conversion-erasure audit: ${passed}/13 passed; ${failed} failed.\n`);
if (failed > 0) process.exitCode = 1;
