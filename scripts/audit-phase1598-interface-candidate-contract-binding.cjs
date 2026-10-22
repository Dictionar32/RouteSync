const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__test__/requestTypeDerivationCandidateContractInterface.phase1598.test.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['candidate envelope binds contract and proof', /interface RequestTypeDerivationSemanticAuthorityCandidateFor<[\s\S]*?readonly contract: TContract;[\s\S]*?readonly proof: RequestTypeDerivationSemanticAuthorityCandidate;/.test(source)],
  ['decision returns contract-bound candidate', /readonly decide:[\s\S]*?RequestTypeDerivationSemanticDecisionPremises<TContract>[\s\S]*?RequestTypeDerivationSemanticAuthorityCandidateFor<TContract>/.test(source)],
  ['authority evaluates contract-bound candidate', /readonly evaluate:[\s\S]*?candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract>/.test(source)],
  ['type test compares decision and authority candidate surfaces', /toEqualTypeOf<DecisionCandidate>/.test(test) && /AuthorityCandidate/.test(test)],
  ['scope note explicitly says migration readiness is not established', /Migration readiness: \*\*not established\*\*/.test(fs.readFileSync(path.join(root, 'PHASE1598_INTERFACE_CANDIDATE_CONTRACT_BINDING.md'), 'utf8'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
