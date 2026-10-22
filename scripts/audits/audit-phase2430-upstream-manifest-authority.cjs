const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const assertions = [];
const check = (name, condition) => assertions.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const authority = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts');
const executor = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2430_UPSTREAM_MANIFEST_AUTHORITY_AUDIT.md');

check('canonical upstream pipeline interface exists', contract.includes('interface RequestTypeDerivationSemanticPipelineInterface'));
check('contract closes over 32 semantic law identifiers', (contract.match(/'[^']+'/g) ?? []).some(() => contract.includes('source_occurrence_location_matches_evidence')) && contract.includes('REQUEST_TYPE_DERIVATION_LAW_IDS'));
check('existing assembler checks shared canonical contract identity', assembler.includes('composition.reasoning.contract === composition.contract') && assembler.includes('composition.authority.contract === composition.contract'));
check('authority adapter delegates semantic kernel rather than defining one', authority.includes('kernel.deriveJudgment(input)') && authority.includes('kernel.verify(input, judgment)'));
check('runtime executor validates assessment before projection', executor.indexOf('pipeline.validateAssessment(assessment)') < executor.indexOf('consumer.project(assessment.decision.premises.judgment)'));
check('active lowering still calls legacy projection pipeline', lowering.includes('requestTypeDerivationProjectionPipeline.derive'));
check('active projection calls active lowering', projection.includes('routeManifestTypeLowering.project(manifest)'));
check('scan command calls default projection', scan.includes('projectRouteSyncManifestForRouteManifest(completeManifest)'));
check('sync command calls default projection', sync.includes('projectRouteSyncManifestForRouteManifest(completeManifest)'));
check('audit report states producer and active-path blockers', docs.includes('absence of a production semantic producer') && docs.includes('active CLI projection still selects the legacy derivation path'));

for (const result of assertions) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`\n${assertions.filter(result => result.passed).length}/${assertions.length} assertions passed`);
if (assertions.some(result => !result.passed)) process.exitCode = 1;
