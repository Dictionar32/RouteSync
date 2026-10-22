const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const relative = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts';
const source = fs.readFileSync(path.join(root, relative), 'utf8');
const inventoryProducer = source.match(/const inputEvidenceKeys = \([\s\S]*?\n};/);
const upstreamContract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const upstreamProducer = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts'), 'utf8');
const coreIndex = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const violationProducer = source.match(/const sourceOccurrenceViolations = \([\s\S]*?\n};/);
const checks = [
  ['key projection is declared on the upstream inventory contract', /readonly evidenceKeys: \(input: RequestTypeDerivationInput\) => readonly RequestTypeEvidenceKey\[\]/.test(upstreamContract)],
  ['upstream key producer has the contract-owned operation type', /requestTypeDerivationSourceEvidenceKeys: RequestTypeDerivationSourceEvidenceInventoryInterface\['evidenceKeys'\]/.test(upstreamProducer)],
  ['core public entry exports the upstream key operation', /export \{ requestTypeDerivationSourceEvidenceInventory, requestTypeDerivationSourceEvidenceKeys \}/.test(coreIndex)],
  ['upstream key producer delegates to canonical inventory construction', /const inventory = inventoryRequestTypeDerivationSourceEvidence\(input\)/.test(upstreamProducer)],
  ['route semantic keys are included upstream', /inventory\.routes\.map\(evidence => evidence\.semanticKey\)/.test(upstreamProducer)],
  ['resource semantic keys are included upstream', /inventory\.resources\.map\(evidence => evidence\.semanticKey\)/.test(upstreamProducer)],
  ['request semantic keys are included upstream', /inventory\.requests\.map\(evidence => evidence\.semanticKey\)/.test(upstreamProducer)],
  ['key ledger is frozen upstream', /return Object\.freeze\(\[/.test(upstreamProducer)],
  ['source occurrence law consumes upstream key producer', /const expectedKeys = requestTypeDerivationSourceEvidenceInventory\.evidenceKeys\(input\)/.test(violationProducer?.[0] ?? '')],
  ['compiler verifier no longer owns a duplicate key producer', !/const inputEvidenceKeys =/.test(source)],
  ['canonical identity logic is not reimplemented in the verifier', !/const inputEvidenceKeys[\s\S]*?\.map\(.*(?:canonicalRouteIdentity|canonicalResourceIdentity|canonicalRequestIdentity)/.test(source)],
  ['active verifier does not import semantic foundation/relation', !/semantic\/(?:foundation|relation)/.test(source)],
  ['active verifier does not import the legacy solver', !/requestTypeDerivationSolver/.test(source)],
];
let failures = 0;
for (const [label, condition] of checks) {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!condition) failures += 1;
}
for (const file of [relative, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts', 'packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts', 'packages/core/src/index.ts']) {
  const syntax = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    fileName: path.basename(file),
    compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  const syntaxErrors = (syntax.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
  process.stdout.write(`${syntaxErrors.length === 0 ? 'PASS' : 'FAIL'} syntax transpilation ${file}\n`);
  failures += syntaxErrors.length;
}
process.stdout.write(`Phase 2581: ${checks.length + 4 - failures}/${checks.length + 4} assertions passed.\n`);
process.exitCode = failures === 0 ? 0 : 1;
