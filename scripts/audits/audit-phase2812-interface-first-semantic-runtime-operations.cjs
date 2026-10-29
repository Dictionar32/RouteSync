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
const integrity = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAssessmentIntegrity.ts');
const semanticAuthority = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticAuthority.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const authority = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts');
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const pkg = JSON.parse(read('package.json'));
const collectionBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
check('assessment integrity runtime operation has named interface', /export interface RequestTypeDerivationSemanticAssessmentIntegrityOperationInterface/.test(integrity), 'validation responsibility has an explicit operation contract');
check('assessment integrity export is interface-first and frozen', /export const requestTypeDerivationSemanticAssessmentIntegrityOperation:\s*RequestTypeDerivationSemanticAssessmentIntegrityOperationInterface\s*=\s*Object\.freeze/.test(integrity), 'operation export is typed at the runtime boundary');
check('assessment validator factory is interface-first', /export const requestTypeDerivationSemanticAssessmentValidatorFactory:\s*RequestTypeDerivationSemanticAssessmentValidatorFactoryInterface\s*=\s*Object\.freeze/.test(integrity), 'factory no longer exports a standalone arrow function');
check('legacy exported assessment validator removed', !/export const validateRequestTypeDerivationSemanticAssessment\s*=/.test(integrity), 'call sites use the owning operation object');
check('semantic authority consumes named integrity operation', /requestTypeDerivationSemanticAssessmentIntegrityOperation\.validate\(/.test(semanticAuthority) && !/validateRequestTypeDerivationSemanticAssessment/.test(semanticAuthority), 'authority delegates coherence validation without duplicating it');
check('pipeline assembler consumes typed validator factory', /requestTypeDerivationSemanticAssessmentValidatorFactory\.create\(/.test(assembler) && !/createRequestTypeDerivationSemanticAssessmentValidator/.test(assembler), 'pipeline construction uses the interface-first factory');
check('authority factory has explicit interface', /export interface RequestTypeDerivationAuthorityFactoryInterface/.test(authority), 'authority construction has a named contract');
check('authority factory export is interface-first and frozen', /export const requestTypeDerivationAuthorityFactory:\s*RequestTypeDerivationAuthorityFactoryInterface\s*=\s*Object\.freeze/.test(authority), 'authority factory is an operation object');
check('legacy exported authority factory removed', !/export const createRequestTypeDerivationAuthority\s*=/.test(authority), 'no exported create-arrow API remains in this owner');
check('semantic outcome ADT owns a domain operation', /toManifestProjectionDisposition:/.test(upstream) && !/RequestTypeDerivationRuntimeExecutionOutcomeHandlers/.test(upstream), 'upstream outcome owns a direct domain operation without handler dispatch');
check('lowering consumes upstream domain operation', /derivation\.toManifestProjectionDisposition\(\)/.test(lowering), 'downstream consumes the ADT operation without supplying handlers');
check('exhaustive semantic assessment elimination remains intact', /switch\s*\(assessment\.kind\)/.test(preparation) && /const exhaustive: never = assessment/.test(preparation), 'producer preserves explicit exhaustive ADT construction');
check('no generic continuation or never assertion introduced', !/continueForManifestProjection\s*<\s*T|as\s+never/.test(integrity + semanticAuthority + assembler + authority + upstream + preparation + lowering), 'no generic reasoning primitive or assertion escape hatch added');
check('collections module preserves newline sentinel', collectionBytes === 1, `actual size=${collectionBytes} byte (preserved newline)`);
check('audit script registered', pkg.scripts['audit:phase2812-interface-first-semantic-runtime-operations'] === 'node scripts/audits/audit-phase2812-interface-first-semantic-runtime-operations.cjs', 'audit command is reproducible');
process.stdout.write(`\nPhase 2812 interface-first semantic runtime operations audit: ${passed}/15 passed; ${failed} failed.\n`);
if (failed > 0) process.exitCode = 1;
