'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const authorityLowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const projectionComposition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const publicIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['upstream inventory contract owns route identity operation', /readonly canonicalRouteIdentity:\s*\(identity: RouteSemanticFlow\['identity'\]\) => RequestTypeCanonicalRouteIdentity/.test(contract)],
  ['upstream inventory contract owns resource identity operation', /readonly canonicalResourceIdentity:\s*\(identity: ResourceAst\['definition'\]\['name'\]\) => RequestTypeCanonicalResourceIdentity/.test(contract)],
  ['upstream inventory contract owns request identity operation', /readonly canonicalRequestIdentity:\s*\(identity: RequestAst\['definition'\]\['identity'\]\) => RequestTypeCanonicalRequestIdentity/.test(contract)],
  ['route/resource/request identities are closed discriminated ADTs', ['canonical_route_identity', 'canonical_resource_identity', 'canonical_request_identity'].every(kind => contract.includes(`kind: '${kind}'`))],
  ['every evidence reference carries its correlated canonical identity ADT', /semanticKey: `route:\$\{string\}`;\s*readonly canonicalIdentity: RequestTypeCanonicalRouteIdentity/.test(contract) && /semanticKey: `resource:\$\{string\}`;\s*readonly canonicalIdentity: RequestTypeCanonicalResourceIdentity/.test(contract) && /semanticKey: `request:\$\{string\}`;\s*readonly canonicalIdentity: RequestTypeCanonicalRequestIdentity/.test(contract)],
  ['resource identity normalizes case at the upstream owner and retains ResourceName type', /SemanticValueFactory\.resourceName\(identity\.value\.value\.toLowerCase\(\)\)/.test(inventory) && /canonicalName,\s*semanticKey: `resource:\$\{canonicalName\.value\.value\}`/.test(inventory)],
  ['inventory implementation lives in the active semantic implementation layer and consumes the upstream contract', inventory.includes('Canonical source-evidence inventory') && inventory.includes('RequestTypeDerivationSourceEvidenceInventoryInterface')],
  ['inventory is exported as a value explicitly typed by the existing upstream interface', /export const requestTypeDerivationSourceEvidenceInventory:\s*RequestTypeDerivationSourceEvidenceInventoryInterface = Object\.freeze\(/.test(inventory)],
  ['inventory no longer exports a factory function or free identity helper', !/export const createRequestTypeDerivationSourceEvidenceInventory/.test(inventory) && !/export const requestTypeResourceSemanticIdentity/.test(inventory)],
  ['route evidence delegates semantic identity to its upstream operation', /const identity = canonicalRouteIdentity\(route\.identity\)[\s\S]*?semanticKey: identity\.semanticKey,[\s\S]*?canonicalIdentity: identity/.test(inventory)],
  ['resource evidence delegates semantic identity to its upstream operation', /const identity = canonicalResourceIdentity\(resource\.definition\.name\)[\s\S]*?semanticKey: identity\.semanticKey,[\s\S]*?canonicalIdentity: identity/.test(inventory)],
  ['request evidence delegates semantic identity to its upstream operation', /const identity = canonicalRequestIdentity\(request\.definition\.identity\)[\s\S]*?semanticKey: identity\.semanticKey,[\s\S]*?canonicalIdentity: identity/.test(inventory)],
  ['verifier validates route identity through the inventory contract', /canonicalRouteIdentity\(source\.source\.identity\)/.test(verifier) && /source\.canonicalIdentity\.routeName/.test(verifier)],
  ['verifier validates resource identity through the inventory contract', /canonicalResourceIdentity\(source\.source\.identity\)/.test(verifier) && /source\.canonicalIdentity\.canonicalName/.test(verifier)],
  ['resource identity failures produce the canonical semantic-law judgment with typed expected/actual ADTs', /kind: 'resource_identity_mismatch'/.test(verifier) && /law: 'resource_identity_is_canonical'/.test(verifier) && /expectedCanonicalIdentity: violation\.expected/.test(verifier) && /actualCanonicalIdentity: violation\.source\.canonicalIdentity/.test(verifier)],
  ['upstream resource identity failure judgment preserves typed expected and actual canonical identities', /expectedCanonicalIdentity: RequestTypeCanonicalResourceIdentity/.test(contract) && /actualCanonicalIdentity: RequestTypeCanonicalResourceIdentity/.test(contract) && /actualCanonicalKey: RequestTypeGroupKey/.test(contract)],
  ['verifier validates request identity through the inventory contract', /canonicalRequestIdentity\(source\.source\.identity\)/.test(verifier) && /source\.canonicalIdentity\.requestName/.test(verifier)],
  ['input evidence inventory is recomputed through the canonical evidence-key operation', /requestTypeDerivationSourceEvidenceInventory\.evidenceKeys\(input\)/.test(verifier) && /sourceEvidenceMatchesInventory/.test(verifier) && /inventoryMatchesInput/.test(verifier)],
  ['source occurrence membership matches canonical identity plus source coordinates', /sourceOccurrenceInputMembership/.test(verifier) && /span\.file\.value\.value === sourceSpan\.file\.value\.value/.test(verifier) && /span\.start\.value === sourceSpan\.start\.value/.test(verifier) && /span\.end\.value === sourceSpan\.end\.value/.test(verifier)],
  ['manifest preflight enters canonical semantic preparation before lowering', /requestTypeDerivationSemanticInputPreparation\.prepare\(input\)/.test(preflight) && /semanticInput: prepared/.test(preflight)],
  ['authority-backed lowering consumes prepared input through the injected semantic pipeline', /operationPreparation\.prepare\(preflight\.semanticInput\)/.test(authorityLowering) && /createAuthorityBackedRouteManifestProjection/.test(projectionComposition)],
  ['semantic inventory and verifier have no forbidden foundation/relation imports', !/semantic\/(?:foundation|relation|relations)/.test(inventory) && !/semantic\/(?:foundation|relation|relations)/.test(verifier)],
  ['public core barrel exports the inventory contract and canonical identity ADTs', /RequestTypeDerivationSourceEvidenceInventoryInterface, RequestTypeCanonicalIdentity, RequestTypeCanonicalRouteIdentity, RequestTypeCanonicalResourceIdentity, RequestTypeCanonicalRequestIdentity/.test(publicIndex)],
  ['phase audit is registered as a package script', packageJson.scripts['audit:phase2530-route-evidence-semantic-identity'] === 'node scripts/audits/audit-phase2530-route-evidence-semantic-identity.cjs'],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = Number(failed.length > 0);
