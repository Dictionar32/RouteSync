const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (label, condition) => {
  checks.push({ label, passed: Boolean(condition) });
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
};

const solver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts');
const pipeline = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');

check('active lowering consumes the canonical source evidence produced by preflight', lowering.includes('sourceEvidence') && !lowering.includes('requestTypeDerivationSourceEvidenceInventory.inventory'));
check('active solver consumes the upstream request-resolution ledger rather than resolving again', solver.includes('requestResolutionLedger') && !solver.includes('requestTypeDerivationRequestResolution.resolve'));
check('request identity is joined by canonical source occurrence identity', solver.includes('canonicalRequestOccurrenceKey') && solver.includes('resolvedRequestEvidence'));
check('exact and normalized ledger outcomes resolve back to the exact source occurrence', solver.includes("case 'resolved_exact':") && solver.includes("case 'resolved_normalized':") && solver.includes('canonicalRequestOccurrenceKey(\n                resolvedRequestEvidence.source.source'));
check('missing and ambiguous outcomes fail closed before projection', solver.includes('cannot consume unresolved upstream request-resolution receipt') && solver.includes('throw new Error'));
check('projection pipeline passes both upstream ledgers into solver context', pipeline.includes('requestTypeDerivationProjectionPipeline: RequestTypeDerivationProjectionInterface = requestTypeDerivationSolver') && solver.includes('createDerivationContext(routes, resources, requests, interner, requestResolutionLedger, resourceResolutionLedger)'));
check('changed semantic path introduces no foundation dependency', !/semantic\/foundation/.test(solver + pipeline));
check('legacy relations dependency is explicitly identified as pre-existing, not introduced by resolution', solver.includes('from "../../../semantic/relations/relationalSequence"') && !/import[^;]*requestTypeDerivationRequestResolution/.test(solver));
check('audit does not mislabel full judgment authority or CLI cutover as complete', lowering.includes('requestTypeDerivationProjectionPipeline.derive') && !lowering.includes('createAuthorityBackedRouteManifestTypeLowering'));

const failures = checks.filter(result => !result.passed);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length} assertions passed\n`);
if (failures.length) process.exitCode = 1;
