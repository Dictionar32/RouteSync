const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const occurrenceVerifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const checks = [
  ['canonical route identity is an exported operation typed by the existing upstream interface', /export const canonicalRouteIdentity: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalRouteIdentity'\]/.test(inventory)],
  ['canonical resource identity is an exported operation typed by the existing upstream interface', /export const canonicalResourceIdentity: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalResourceIdentity'\]/.test(inventory)],
  ['canonical request identity is an exported operation typed by the existing upstream interface', /export const canonicalRequestIdentity: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalRequestIdentity'\]/.test(inventory)],
  ['route occurrence identity is an exported operation typed by the existing upstream interface', /export const canonicalRouteOccurrenceKey: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalRouteOccurrenceKey'\]/.test(inventory)],
  ['resource occurrence identity is an exported operation typed by the existing upstream interface', /export const canonicalResourceOccurrenceKey: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalResourceOccurrenceKey'\]/.test(inventory)],
  ['request occurrence identity is an exported operation typed by the existing upstream interface', /export const canonicalRequestOccurrenceKey: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalRequestOccurrenceKey'\]/.test(inventory)],
  ['source inventory production is an exported operation typed by the existing upstream interface', /export const inventoryRequestTypeDerivationSourceEvidence: RequestTypeDerivationSourceEvidenceInventoryInterface\['inventory'\]/.test(inventory)],
  ['aggregate inventory delegates to the named identity and inventory operations', /inventory: inventoryRequestTypeDerivationSourceEvidence/.test(inventory) && /const identity = canonicalRouteIdentity/.test(inventory) && /const identity = canonicalResourceIdentity/.test(inventory) && /const identity = canonicalRequestIdentity/.test(inventory)],
  ['occurrence key preserves source file as an encoded tuple component', /encodeURIComponent\(file\)/.test(inventory) && /sourceSpanIdentity\(span\.file\.value\.value, span\.start\.value, span\.end\.value\)/.test(inventory)],
  ['identity and occurrence key are separate upstream contract domains', /RequestTypeCanonicalIdentity/.test(contract) && /RequestTypeSourceOccurrenceKey/.test(contract)],
  ['source occurrence verifier consumes the canonical inventory operations', /requestTypeDerivationSourceEvidenceInventory\.canonicalRouteIdentity/.test(occurrenceVerifier) && /requestTypeDerivationSourceEvidenceInventory\.canonicalResourceIdentity/.test(occurrenceVerifier) && /requestTypeDerivationSourceEvidenceInventory\.canonicalRequestIdentity/.test(occurrenceVerifier)],
  ['no semantic/foundation dependency was added to source inventory', !/semantic\/foundation|semantic\/relations/.test(inventory)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
const result = ts.transpileModule(inventory, { fileName: 'requestTypeDerivationSourceEvidenceInventory.ts', compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
console.log(`${errors.length === 0 ? 'PASS' : 'FAIL'} TypeScript syntax transpilation: upstream identity operation algebra`);
failures += errors.length;
console.log(`Phase 2571: ${checks.length + 1 - failures}/${checks.length + 1} assertions passed.`);
process.exitCode = failures ? 1 : 0;
