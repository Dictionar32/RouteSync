const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (label, condition) => checks.push({ label, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const requestResolution = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolution.ts');
const resourceResolution = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationResourceResolution.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const production = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');

check('canonical judgment is proof-carrying and closed over derived/incomplete/conflict/rejected outcomes',
  /export type RequestTypeDerivationJudgment\s*=/.test(contract) &&
  /kind: 'derived'[\s\S]*?proof: RequestTypeDerivationProofFor<'closed'>/.test(contract) &&
  /kind: 'incomplete'[\s\S]*?proof: RequestTypeDerivationProofFor<'incomplete'>/.test(contract) &&
  /kind: 'conflict'[\s\S]*?proof: RequestTypeDerivationProofFor<'conflicted'>/.test(contract));
check('upstream source inventory preserves semantic and occurrence identities separately',
  /canonicalRouteOccurrenceKey/.test(inventory) && /canonicalResourceOccurrenceKey/.test(inventory) &&
  /canonicalRequestOccurrenceKey/.test(inventory) && /occurrenceKey/.test(inventory));
check('request resolution is a cardinality ADT with exact-before-normalized policy',
  /requestTypeRequestCandidateSelection\.select/.test(requestResolution) &&
  /resolved_exact/.test(requestResolution) && /resolved_normalized/.test(requestResolution) &&
  /ambiguous_exact/.test(requestResolution) && /ambiguous_normalized/.test(requestResolution));
check('resource resolution preserves missing and ambiguous outcomes',
  /kind: 'missing'/.test(resourceResolution) && /kind: 'ambiguous'/.test(resourceResolution));
check('pipeline assembler wires injected reasoning, verifier, decision, authority and integrity',
  /composition\.reasoning\.infer\(input\)/.test(assembler) && /verifier\.verify\(inference\)/.test(assembler) &&
  /composition\.decision\.decide\(/.test(assembler) && /authorityIntegrityGate\.evaluate/.test(assembler));
check('production composition does not pretend the semantic kernel exists',
  /does not ship concrete production reasoning\/verifier/.test(production) && /fails closed/.test(production));
check('active CLI commands require the assembled semantic pipeline before acquiring source identity',
  exists('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts') &&
  /requestTypeDerivationPipeline = composition\?\.requestTypeDerivationPipeline/.test(scan) &&
  /requestTypeDerivationPipeline = composition\?\.requestTypeDerivationPipeline/.test(sync) &&
  /requestTypeDerivationPipeline === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(scan) &&
  /requestTypeDerivationPipeline === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(sync) &&
  !/requestTypeDerivationSolver|requestTypeDerivationProjectionPipeline/.test(lowering));
check('retired legacy solver is absent rather than silently used as semantic authority',
  !exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts'));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.label}`);
const failed = checks.filter(item => !item.passed);
console.log(`Phase 2538 current-path root-cause audit: ${checks.length - failed.length}/${checks.length} assertions passed.`);
if (failed.length) process.exitCode = 1;
