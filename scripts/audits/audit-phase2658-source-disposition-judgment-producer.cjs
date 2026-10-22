const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const reasoning = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const composition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const upstream = read('packages/core/src/upstream.ts');
const cli = read('packages/cli/src/index.ts');

check('producer is exported through the canonical interface-first declaration',
  /export const requestTypeDerivationSemanticReasoning:\s*RequestTypeDerivationSemanticReasoningInterface/.test(reasoning));
check('AST/source evidence enters through canonical preparation and identity inventory',
  /requestTypeDerivationSemanticInputPreparation/.test(composition) && /identityCollisionInventory/.test(reasoning) && /inventoryRequestTypeDerivationSourceEvidence/.test(inventory) && /input\.routes\.map/.test(inventory));
check('duplicate canonical identity follows upstream conflict policy and preserves occurrence witnesses',
  /conflictsFromIdentityCollisions/.test(reasoning) && /kind: 'conflict'/.test(reasoning) && /duplicate_resource_identity/.test(reasoning));
check('missing request/resource resolution can produce an incomplete judgment with proof ledger',
  /kind: 'incomplete'/.test(reasoning) && /unresolved: unresolved/.test(reasoning) && /sourceEvidence: preparedInput\.inventory/.test(reasoning));
check('ambiguous request identity can produce a conflict judgment with candidate witnesses',
  /kind: 'ambiguous_request_identity'/.test(reasoning) && /kind: 'conflict'/.test(reasoning) && /candidates: resolution\.candidates/.test(reasoning));
check('source dispositions cover route, resource and request domains in proof',
  /makeRouteReceipts/.test(reasoning) && /makeResourceReceipts/.test(reasoning) && /makeRequestReceipts/.test(reasoning));
check('proof closure counts expected and accounted source inventory explicitly',
  /expected: preparedInput\.inventory\.routes\.length, accounted: preparedInput\.inventory\.routes\.length/.test(reasoning) && /unresolved: unresolvedCount/.test(reasoning));
check('producer refuses to invent group results when contribution/fold receipts are missing',
  /action\/response contribution and group-fold production/.test(reasoning) && /RequestTypeDerivationSemanticProducerGapError/.test(reasoning));
check('duplicate resource collisions and route-level ambiguous/mismatched resource resolutions use typed conflict witnesses',
  /kind: 'duplicate_resource_identity'/.test(reasoning) && /kind: 'ambiguous_resource_identity'/.test(reasoning) && /kind: 'resource_identity_mismatch'/.test(reasoning));
check('independent verifier remains separate and does not self-certify unsupported laws',
  /export const requestTypeDerivationProofVerifier:\s*RequestTypeDerivationProofVerificationInterface/.test(verifier) && /34 canonical proof laws/.test(verifier));
check('composition connects preparation, reasoning, verifier, decision, authority and integrity',
  /preparation: requestTypeDerivationSemanticInputPreparation/.test(composition) && /reasoning: requestTypeDerivationSemanticReasoning/.test(composition) && /verifier: requestTypeDerivationProofVerifier/.test(composition) && /decision: requestTypeDerivationSemanticDecision/.test(composition) && /authority: requestTypeDerivationSemanticAuthority/.test(composition) && /integrity: requestTypeDerivationSemanticAuthorityIntegrity/.test(composition));
check('standalone CLI defaults to this composition and still validates contract/capability identity',
  /requestTypeDerivationSemanticComposition/.test(loader) && /isRequestTypeDerivationSemanticPipelineComposition/.test(loader) && /requestTypeDerivationSemanticComposition/.test(cli));
check('producer is exported at the upstream boundary',
  /requestTypeDerivationSemanticReasoning/.test(upstream) && /requestTypeDerivationProofVerifier/.test(upstream));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const passed = checks.filter(result => result.passed).length;
process.stdout.write(`\nPhase 2658 source-disposition judgment producer: ${passed}/${checks.length} assertions passed.\n`);
process.stdout.write('SCOPE: structural wiring audit only; it does not prove TypeScript compilation, runtime correctness, or complete 34-law verification.\n');
if (passed !== checks.length) process.exitCode = 1;
