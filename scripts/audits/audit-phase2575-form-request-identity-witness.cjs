const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const pipeline = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const cli = read('packages/cli/src/upstreamCompositionInterface.ts');
const checks = [
  ['canonical request identity preserves FormRequest concrete type in the closed ADT', /readonly identityKind: 'form_request_identity'/.test(contract) && /readonly formType: Extract<RequestAst/.test(contract)],
  ['canonical FormRequest semantic key includes its concrete type', /request:form:\$\{encodeURIComponent\(identity\.request\.value\.value\)\}:\$\{encodeURIComponent\(identity\.formType\.value\.value\)\}/.test(inventory)],
  ['verifier recomputes canonical request identity from source evidence', /canonicalRequestIdentity\(source\.source\.identity\)/.test(verifier)],
  ['verifier checks source identity kind and semantic key', /source\.canonicalIdentity\.identityKind === canonical\.identityKind/.test(verifier) && /source\.semanticKey === canonical\.semanticKey/.test(verifier)],
  ['verifier checks concrete FormRequest type against canonical identity', /source\.canonicalIdentity\.formType\.value\.value === canonical\.formType\.value\.value/.test(verifier)],
  ['FormRequest mismatch remains a failed proof check, not a repair or fallback', /if \(!commonIdentityMatches\) return false/.test(verifier) && !/legacyRequestTypeDerivationSolver/.test(verifier)],
  ['pipeline assembler continues to delegate complete proof verification', /const verification = verifier\.verify\(inference\)/.test(pipeline)],
  ['CLI composition requires an injected semantic pipeline', /requestTypeDerivationPipeline/.test(cli)],
  ['active upstream identity and verifier path adds no semantic foundation/relation dependency', !/semantic\/(foundation|relation)/.test(inventory + verifier)],
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
console.log(`Phase 2575: ${checks.length + 3 - failures}/${checks.length + 3} assertions passed.`);
process.exitCode = failures ? 1 : 0;
