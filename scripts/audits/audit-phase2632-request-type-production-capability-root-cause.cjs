const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const productionComposition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const sourceInventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const sourceOccurrenceVerifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const authority = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts');
const cliFactory = read('packages/cli/src/upstreamCompositionFactory.ts');
const cliEntry = read('packages/cli/src/index.ts');
const legacySolverFiles = fs.readdirSync(path.join(root, 'packages/core/src/compiler/semantic'))
  .filter(name => /requestTypeDerivationSolver/.test(name));

check('canonical-contract-defines-closed-34-law-set', /REQUEST_TYPE_DERIVATION_LAW_IDS\s*=\s*\[/.test(contract) && (contract.match(/^\s*'[^']+',?\s*$/gm) || []).length >= 34);
check('canonical-contract-has-reasoning-and-verifier-capabilities', /interface RequestTypeDerivationSemanticReasoningInterface/.test(contract) && /interface RequestTypeDerivationProofVerificationInterface/.test(contract));
check('assembler-only-connects-injected-capabilities', /composition\.reasoning\.infer\(input\)/.test(assembler) && /verifier\.verify\(inference\)/.test(assembler) && /composition\.decision\.decide\(/.test(assembler));
check('production-factory-explicitly-does-not-provide-missing-kernel', /does not ship concrete production reasoning\/verifier\//.test(productionComposition) && /fails closed/.test(productionComposition));
check('source-inventory-is-identity-inventory-not-judgment-producer', /does not[\s*]+resolve requests, classify routes, produce semantic judgments, or claim proof/.test(sourceInventory));
check('source-occurrence-verifier-delegates-other-laws', /delegate\.verify\(inference\)\.result/.test(sourceOccurrenceVerifier) && /remaining laws remain the delegate verifier's responsibility/.test(sourceOccurrenceVerifier));
check('authority-is-adapter-around-injected-kernel', /kernel\.deriveJudgment\(input\)/.test(authority) && /kernel\.verify\(input, judgment\)/.test(authority));
check('cli-composition-does-not-manufacture-semantic-capabilities', /does not manufacture reasoning, verification, decisions, or authority/.test(cliFactory));
check('standalone-cli-loads-host-composition-and-fails-closed', /loadRouteSyncStandaloneComposition/.test(cliEntry) && /composition_module_missing/.test(cliEntry) && /process\.exitCode = 1/.test(cliEntry));
check('no-production-reasoning-kernel-is-hidden-in-legacy-solver-file', legacySolverFiles.length === 0);
check('existing-upstream-source-identity-inventory-is-exported', /requestTypeDerivationSourceEvidenceInventory/.test(sourceInventory) && /export const inventoryRequestTypeDerivationSourceEvidence/.test(sourceInventory));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
const failed = checks.filter(item => !item.passed);
console.log(`Phase 2632 RequestType production capability root-cause audit: ${checks.length - failed.length}/${checks.length} assertions passed.`);
if (failed.length) process.exitCode = 1;
