const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const manifestAdapter = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const coreExports = read('packages/core/src/index.ts');
const upstreamExports = read('packages/core/src/upstream.ts');
const checks = [
  ['upstream owns typed semantic preparation packet and operation interface', /interface RequestTypeDerivationSemanticInputPreparation\s*\{/.test(contract) && /interface RequestTypeDerivationSemanticInputPreparationInterface\s*\{/.test(contract)],
  ['producer follows export const name: existing interface operation pattern', /export const prepareRequestTypeDerivationSemanticInput: RequestTypeDerivationSemanticInputPreparationInterface\['prepare'\]/.test(preparation) && /export const requestTypeDerivationSemanticInputPreparation: RequestTypeDerivationSemanticInputPreparationInterface/.test(preparation)],
  ['semantic owner produces one canonical source inventory', /requestTypeDerivationSourceEvidenceInventory\.inventory\(input\)/.test(preparation)],
  ['semantic owner derives request and resource resolution ledgers from same inventory', /requestTypeDerivationRequestResolutionInventory\.resolve\(\{ \.\.\.input, inventory \}\)/.test(preparation) && /requestTypeDerivationResourceResolutionInventory\.resolve\(\{ \.\.\.input, inventory \}\)/.test(preparation)],
  ['preparation packet preserves exact input, source evidence and both assessments', ['input,', 'sourceEvidence:', 'requestResolutionLedger,', 'requestAssessment:', 'resourceResolutionLedger,', 'resourceAssessment:'].every(token => preparation.includes(token))],
  ['scanner preflight now adapts manifest and delegates semantic preparation', /routeFlowsFromManifest\(manifest\)/.test(manifestAdapter) && /requestTypeDerivationSemanticInputPreparation\.prepare\(input\)/.test(manifestAdapter) && !/requestTypeDerivationSourceEvidenceInventory\.inventory/.test(manifestAdapter)],
  ['semantic preparation explicitly disclaims judgment/proof ownership', /only the[\s\S]*reasoning capability may turn this packet[\s\S]*into a judgment/.test(preparation) && /not a semantic[\s\S]*judgment/.test(contract)],
  ['public core and upstream exports expose the new interface and operation', /RequestTypeDerivationSemanticInputPreparationInterface/.test(coreExports) && /requestTypeDerivationSemanticInputPreparation/.test(coreExports) && /RequestTypeDerivationSemanticInputPreparationInterface/.test(upstreamExports) && /requestTypeDerivationSemanticInputPreparation/.test(upstreamExports)],
  ['no forbidden foundation or relation imports introduced', !/semantic\/(foundation|relations|relation)/.test(contract + preparation + manifestAdapter)],
  ['implementation file exists at semantic owner path', exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Phase 2639 semantic input preparation interface-first audit: ${checks.filter(([, passed]) => passed).length}/${checks.length} passed`);
process.exitCode = checks.some(([, passed]) => !passed) ? 1 : 0;
