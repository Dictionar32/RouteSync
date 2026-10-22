const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const resolver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolution.ts');
const checks = [
  ['canonical request identity is a closed ADT split by HTTP versus FormRequest identity', /identityKind: 'http_request_identity'/.test(contract) && /identityKind: 'form_request_identity'/.test(contract)],
  ['HTTP request semantic identity includes its identity kind', /request:http:\$\{encodeURIComponent\(identity\.request\.value\.value\)\}/.test(inventory)],
  ['FormRequest semantic identity includes identity kind and concrete form type', /request:form:\$\{encodeURIComponent\(identity\.request\.value\.value\)\}:\$\{encodeURIComponent\(identity\.formType\.value\.value\)\}/.test(inventory)],
  ['request identity operation is exhaustive over the upstream identity ADT', /switch \(identity\.kind\)/.test(inventory) && /const exhaustive: never = identity/.test(inventory)],
  ['inventory still routes request evidence through canonical identity operation', /const identity = canonicalRequestIdentity\(request\.definition\.identity\)/.test(inventory)],
  ['source-occurrence verifier validates identity kind as well as semantic key', /source\.canonicalIdentity\.identityKind === canonical\.identityKind/.test(verifier) && /source\.semanticKey === canonical\.semanticKey/.test(verifier)],
  ['source-occurrence verifier compares the concrete FormRequest type rather than trusting its semantic key alone', /source\.canonicalIdentity\.formType\.value\.value === canonical\.formType\.value\.value/.test(verifier)],
  ['request resolver retains request-name cardinality behavior instead of inventing fallback', /requests\.filter\(request => request\.canonicalIdentity\.requestName\.value\.value === query\)/.test(resolver)],
  ['no semantic foundation/relation dependency added to canonical inventory', !/semantic\/(foundation|relation)/.test(inventory)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [name, source] of [['contract', contract], ['inventory', inventory], ['verifier', verifier]]) {
  const result = ts.transpileModule(source, { fileName: `${name}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  console.log(`${errors.length === 0 ? 'PASS' : 'FAIL'} TypeScript syntax transpilation: ${name}`);
  failures += errors.length;
}
console.log(`Phase 2574: ${checks.length + 3 - failures}/${checks.length + 3} assertions passed.`);
process.exitCode = failures ? 1 : 0;
