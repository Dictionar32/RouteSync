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
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const outcome = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionOutcome.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const rootIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const collectionsBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
check('upstream runtime result retains explicit semantic variants', /export type RequestTypeDerivationRuntimeExecutionResultData =/.test(upstream) && /kind: 'projected'/.test(upstream) && /kind: 'authority_integrity_failed'/.test(upstream), 'all original derivation outcomes remain represented');
check('upstream runtime result carries domain continuation', /toManifestProjectionDisposition:/.test(upstream), 'each concrete result owns its manifest-projection disposition operation');
check('continuation is owned by RequestType derivation', /toManifestProjectionDisposition:/.test(upstream) && /RequestTypeDerivationManifestProjectionDisposition/.test(upstream), 'operation is domain-specific and does not require consumer-supplied handlers');
check('projectable and blocked dispositions are explicit', /request_type_derivation_projectable/.test(upstream) && /request_type_derivation_not_projectable/.test(upstream), 'success and failure are not collapsed to boolean');
check('handler contract is concrete and non-generic', !/RequestTypeDerivationRuntimeExecutionOutcomeHandlers/.test(upstream) && !/toManifestProjectionDisposition\s*<\s*T/.test(upstream), 'no handler abstraction or generic result parameter');
check('preparation creates projected outcomes with the operation', /requestTypeDerivationRuntimeExecutionResultOperations\.projected/.test(preparation) && /toManifestProjectionDisposition:/.test(preparation), 'runtime result construction installs its own domain operation');
check('preparation creates blocked outcomes through the same owned operation', /requestTypeDerivationRuntimeExecutionResultOperations\.notProjectable/.test(preparation), 'integrity and semantic failures preserve their specific kind');
check('lowering consumes upstream operation', /derivation\.toManifestProjectionDisposition\(\)/.test(lowering), 'lowering consumes the upstream-owned domain operation directly');
check('lowering only eliminates projection disposition', /switch\s*\(disposition\.kind\)/.test(lowering) && !/switch\s*\(derivation\.kind\)/.test(lowering), 'remaining exhaustive elimination concerns the two domain dispositions');
check('lowered outcome preserves projectable derivation data', /derivation: projectable/.test(lowering) && /requestTypes: projectable\.projection/.test(lowering), 'verified projection and assessment remain attached');
check('blocked outcome preserves original blocked derivation data', /derivation: disposition\.derivation/.test(lowering) && /requestResolutionLedger/.test(lowering), 'failure evidence and source ledger remain available');
check('consumer-facing manifest ADT remains operated', /readonly continue: \(handlers: RouteManifestProjectionCompositionOutcomeHandlers\) => RouteManifest/.test(outcome), 'manifest outcomes still provide concrete follow-up behavior');
check('composition consumes lowering continuation', /result\.continue\(\{/.test(composition) && !/switch\s*\(/.test(composition), 'composition does not inspect lowering discriminants');
check('public upstream types are exported', /RequestTypeDerivationManifestProjectionDisposition/.test(rootIndex) && !/RequestTypeDerivationRuntimeExecutionOutcomeHandlers/.test(rootIndex), 'domain disposition contract is exported without obsolete handler API');
check('no generic visitor or never assertion introduced', !/toManifestProjectionDisposition\s*<\s*T|OutcomeHandlers\s*<\s*T|as\s+never/.test(upstream + preparation + lowering + composition), 'no generic reasoning primitive or assertion escape hatch');
check('runtime factory remains interface-first and frozen', /export const requestTypeDerivationOperationPreparationFactory:\s*RequestTypeDerivationOperationPreparationFactoryInterface\s*=\s*Object\.freeze/.test(preparation), 'factory follows export const name: Interface = Object.freeze(...)');
check('collections module preserves newline sentinel', collectionsBytes === 1, `actual size=${collectionsBytes} byte (preserved newline)`);
check('audit command registered', packageJson.scripts['audit:phase2811-upstream-domain-operated-derivation'] === 'node scripts/audits/audit-phase2811-upstream-domain-operated-derivation.cjs', 'audit command is reproducible');
process.stdout.write(`\nPhase 2811 upstream domain-operated derivation audit: ${passed}/18 passed; ${failed} failed.\n`);
if (failed > 0) process.exitCode = 1;
