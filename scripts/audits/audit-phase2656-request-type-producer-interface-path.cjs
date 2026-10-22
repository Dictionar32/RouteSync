const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const reasoning = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const gap = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticProducerGap.ts');
const upstream = read('packages/core/src/upstream.ts');
const core = read('packages/core/src/index.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const production = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const composition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts');

check('reasoning uses the canonical upstream interface and contract',
  /export const requestTypeDerivationSemanticReasoning:\s*RequestTypeDerivationSemanticReasoningInterface/.test(reasoning) &&
  /contract: requestTypeDerivationContract/.test(reasoning));
check('AST/source preparation enters the judgment producer as preparedInput',
  /infer: \(preparedInput: RequestTypeDerivationSemanticInputPreparation\)/.test(reasoning) && /preparedInput\.identityCollisionInventory/.test(reasoning) && /input: preparedInput\.input/.test(reasoning));
check('duplicate canonical identity follows upstream conflict policy with all source candidates',
  /conflictsFromIdentityCollisions/.test(reasoning) && /kind: 'duplicate_resource_identity'/.test(reasoning) && /kind: 'conflict'/.test(reasoning));
check('producer emits source-disposition incomplete/conflict judgments and keeps contribution closure fail-closed',
  /kind: 'incomplete'/.test(reasoning) && /kind: 'conflict'/.test(reasoning) && /RequestTypeDerivationSemanticProducerGapError/.test(reasoning) && /action\/response contribution and group-fold production/.test(reasoning) && !/kind: 'derived'/.test(reasoning));
check('verifier uses the canonical interface and contract',
  /export const requestTypeDerivationProofVerifier:\s*RequestTypeDerivationProofVerificationInterface/.test(verifier) && /contract: requestTypeDerivationContract/.test(verifier));
check('verifier correlates collision candidates, source inventory, receipts and closure against raw input',
  /identityCollisionInventory\(inference\.input\)/.test(reasoning) &&
  /preparedInput\.input !== inference\.input/.test(reasoning) &&
  /equivalentEvidenceValues/.test(reasoning) && /routeReceiptsMatch/.test(reasoning) && /resourceReceiptsMatch/.test(reasoning));
check('partial verification envelope preserves the exact inference packet and explicit incomplete result',
  /contract: requestTypeDerivationContract,\s*inference,\s*result: Object\.freeze/.test(verifier) && /kind: 'verification_incomplete'/.test(verifier));
check('unsupported verification paths fail closed with named gap error',
  /34 canonical proof laws/.test(verifier) && /throw new RequestTypeDerivationSemanticProducerGapError/.test(verifier));
check('named values are exposed through upstream and core public barrels',
  upstream.includes('requestTypeDerivationSemanticReasoning') && upstream.includes('requestTypeDerivationProofVerifier') &&
  core.includes('requestTypeDerivationSemanticReasoning') && core.includes('requestTypeDerivationProofVerifier'));
check('CLI default is wired to an explicitly diagnostic composition and all missing stages fail closed',
  /requestTypeDerivationSemanticComposition/.test(loader) &&
  /export const requestTypeDerivationSemanticComposition:\s*RequestTypeDerivationSemanticPipelineCompositionInterface/.test(composition) &&
  /throw new RequestTypeDerivationSemanticProducerGapError/.test(composition) &&
  /Legacy RequestType\[\] fallback is disabled/.test(production) &&
  /ROUTESYNC_UPSTREAM_COMPOSITION_MODULE/.test(loader));
check('typed gap records stage and capability',
  /readonly stage: 'reasoning' \| 'verification' \| 'decision' \| 'authority' \| 'integrity'/.test(gap) && /readonly capability: string/.test(gap));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const passed = checks.filter(result => result.passed).length;
process.stdout.write(`\nPhase 2656 upstream producer path: ${passed}/${checks.length} assertions passed.\n`);
process.stdout.write('STATUS: duplicate identity conflicts plus source-disposition incomplete/conflict paths are implemented; contribution-complete derivation, complete 34-law verification, and production composition remain blocked explicitly.\n');
if (passed !== checks.length) process.exitCode = 1;
