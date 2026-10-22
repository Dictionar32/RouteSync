const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const test = read('packages/core/src/compiler/semantic/request-type-derivation/__test__/requestTypeDerivationInventoryAstGate.phase2677.test.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const semanticComposition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts');
const standalone = read('packages/cli/src/index.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const loaderTest = read('packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['runtime regression exercises the public proof verifier', /requestTypeDerivationProofVerifier\.verify\(tampered\)/.test(test)],
  ['test forges inventory semantic key and canonical identity together', /semanticKey: 'resource:forged'[\s\S]*canonicalIdentity:[\s\S]*semanticKey: 'resource:forged'/.test(test)],
  ['test uses a single source resource to produce a natural derived judgment', /resources: Object\.freeze\(\[resourceAst\(1, 10\)\]\)/.test(test) && /expect\(inference\.judgment\.kind\)\.toBe\('derived'\)/.test(test)],
  ['test preserves the producer-created judgment while tampering only inventory', !/judgment:\s*\{[\s\S]*kind:\s*'derived'/.test(test) && /preparedInput:\s*\{[\s\S]*inventory:/.test(test)],
  ['test asserts typed verification-stage producer gap', /RequestTypeDerivationSemanticProducerGapError/.test(test) && /stage: 'verification'/.test(test)],
  ['verifier gates every judgment on inventory-to-AST identity', /const judgment = inference\.judgment;[\s\S]{0,500}if \(!requestTypeDerivationInventoryMatchesAst\(inference\.preparedInput\)\)/.test(verifier)],
  ['scan and sync both consume injected pipeline and manifest preflight', /composition\.requestTypeDerivationPipeline/.test(scan) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(scan) && /composition\.requestTypeDerivationPipeline/.test(sync) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(sync)],
  ['standalone CLI fails closed when host-owned semantic composition is missing', /composition_module_missing/.test(standalone) && /ROUTESYNC_UPSTREAM_COMPOSITION_MODULE/.test(standalone)],
  ['in-repository semantic composition wires executable decision, authority, and integrity producers', /createRequestTypeDerivationSemanticDecision\(requestTypeDerivationContract\)/.test(semanticComposition) && /createRequestTypeDerivationSemanticAuthority\(requestTypeDerivationContract\)/.test(semanticComposition) && /createRequestTypeDerivationSemanticAuthorityIntegrity\(/.test(semanticComposition)],
  ['phase 2677 audit is registered in package scripts', pkg.scripts?.['audit:phase2677-cli-manifest-upstream-runtime-regression'] === 'node scripts/audits/audit-phase2677-cli-manifest-upstream-runtime-regression.cjs'],
  ['CLI loader validates mandatory executable source preparation before reasoning', /const preparation = member\(value, 'preparation'\)[\s\S]*member\(preparation, 'prepare'\)[\s\S]*=== 'function'/.test(loader)],
  ['runtime tests reject a host composition without source preparation', /rejects a host composition without executable source preparation/.test(loaderTest)],
  ['CLI loader checks every canonical decision rule at runtime', /REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS\.every\(ruleId => member\(value, ruleId\) === 'required'\)/.test(loader)],
  ['CLI loader checks executable contract-equivalence capability', /member\(member\(integrity, 'contractEquivalence'\) as object, 'equivalent'\)[\s\S]*=== 'function'/.test(loader)],
  ['runtime tests reject incomplete authority rule coverage', /rejects a host composition whose decision rule inventory is incomplete/.test(loaderTest)],
  ['runtime tests reject missing contract equivalence operation', /rejects an integrity capability without executable contract equivalence/.test(loaderTest)],
];
let failed = 0;
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) failed++;
}
console.log(`Phase 2677 runtime-regression source audit: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
