const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

const compileModule = (sourcePath, overrides = {}) => {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiled = new Module(sourcePath, module);
  compiled.filename = sourcePath;
  compiled.paths = Module._nodeModulePaths(path.dirname(sourcePath));
  const originalRequire = compiled.require.bind(compiled);
  compiled.require = (specifier) => Object.hasOwn(overrides, specifier) ? overrides[specifier] : originalRequire(specifier);
  compiled._compile(javascript, sourcePath);
  return compiled.exports;
};

const interfacePath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const interfaceModule = compileModule(interfacePath);
const coveragePath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationCoverage.ts');
const coverageModule = compileModule(coveragePath, {
  '../../../types/upstream/requestTypeDerivationInterface': interfaceModule,
});
const authorityPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts');
const authorityModule = compileModule(authorityPath, {
  '../../../types/upstream/requestTypeDerivationInterface': interfaceModule,
  './requestTypeDerivationCoverage': coverageModule,
});
const { createRequestTypeDerivationAuthority } = authorityModule;
const lawIds = interfaceModule.REQUEST_TYPE_DERIVATION_LAW_IDS;
assert.equal(lawIds.length, 33, 'canonical law registry must contain all 33 semantic laws');
assert.equal(new Set(lawIds).size, lawIds.length, 'canonical law registry must not contain duplicate laws');
const requiredLaws = Object.fromEntries(lawIds.map((lawId) => [lawId, 'required']));
const verifiedLaws = Object.fromEntries(lawIds.map((lawId) => [lawId, 'verified']));
const contract = { kind: 'request_type_derivation_contract', authority: 'upstream', closed: true, reasoning: 'declarative_source_relation_closure', policy: {}, laws: requiredLaws };
const input = { routes: [], resources: [], requests: [] };
const derived = { kind: 'derived', groups: [], proof: {} };
const invalidInput = { kind: 'invalid_input', reason: 'duplicate_source_identity', evidence: {} };
const valid = { kind: 'valid', proofKind: 'request_type_derivation_proof', verifiedLaws };
const failed = { kind: 'invalid', law: 'route_has_explicit_request_binding', reason: 'explicit_request_binding_not_preserved', evidence: {} };
const confirmed = { kind: 'rejection_confirmed', reason: 'duplicate_source_identity', evidence: {} };
const execute = (judgment, verification, selectedContract = contract) => createRequestTypeDerivationAuthority(selectedContract, {
  deriveJudgment: () => judgment,
  verify: () => verification,
}).derive(input);

const cases = [
  ['derived judgment + exhaustive valid proof', execute(derived, valid).kind, 'verified'],
  ['invalid input + confirmed rejection', execute(invalidInput, confirmed).kind, 'input_rejected'],
  ['invalid input + verifier counterexample', execute(invalidInput, failed).kind, 'rejection_verification_failed'],
  ['derived judgment + verifier counterexample', execute(derived, failed).kind, 'verification_failed'],
  ['derived judgment + rejection confirmation', execute(derived, confirmed).kind, 'authority_inconsistent'],
  ['invalid input + valid verification', execute(invalidInput, valid).kind, 'authority_inconsistent'],
  ['invalid input + mismatched rejection reason', execute(invalidInput, { ...confirmed, reason: 'unsupported_policy' }).kind, 'authority_inconsistent'],
  ['invalid input + mismatched rejection evidence', execute(invalidInput, { ...confirmed, evidence: { reason: 'different' } }).reason, 'rejection_witness_mismatch'],
  ['contract missing a required law', execute(derived, valid, { ...contract, laws: {} }).reason, 'contract_law_coverage_incomplete'],
  ['verification missing a verified law', execute(derived, { ...valid, verifiedLaws: {} }).reason, 'verified_law_coverage_incomplete'],
];
for (const [name, actual, expected] of cases) assert.equal(actual, expected, name);
console.log(JSON.stringify({ phase: 1576, behavioralCases: cases.length, passed: cases.length, cases: cases.map(([name, actual]) => ({ name, actual, passed: true })) }, null, 2));
