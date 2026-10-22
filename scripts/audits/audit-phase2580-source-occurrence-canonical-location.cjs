const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const relative = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts';
const source = fs.readFileSync(path.join(root, relative), 'utf8');
const membership = source.match(/const sourceOccurrenceInputMembership = \([\s\S]*?\n};/);
const locationComparison = source.match(/const sameLocation = \([\s\S]*?\n};/);
const violationAssembly = source.match(/const sourceOccurrenceViolations = \([\s\S]*?\n};/);
const checks = [
  ['input membership is a closed ADT', source.includes("kind: 'source_occurrence_in_input'") && source.includes("kind: 'source_occurrence_not_in_input'")],
  ['route membership checks semantic identity and exact source coordinates', /identity\.semanticKey === source\.semanticKey[\s\S]*?sourceLine\.value === source\.source\.provenance\.sourceLine\.value[\s\S]*?span\.end\.value === sourceSpan\.end\.value/.test(membership?.[0] ?? '')],
  ['resource membership checks canonical identity and exact source span', /canonicalResourceIdentity\(candidate\.definition\.name\)[\s\S]*?identity\.semanticKey === source\.semanticKey[\s\S]*?candidate\.source\.end\.value === sourceSpan\.end\.value/.test(membership?.[0] ?? '')],
  ['request membership checks typed canonical identity and exact source span', /canonicalRequestIdentity\(candidate\.definition\.identity\)[\s\S]*?identity\.semanticKey === source\.semanticKey[\s\S]*?candidate\.source\.end\.value === sourceSpan\.end\.value/.test(membership?.[0] ?? '')],
  ['non-member evidence emits membership failure only, not fabricated location mismatch', /if \(membership\.kind === 'source_occurrence_not_in_input'\) return \[\]/.test(violationAssembly?.[0] ?? '')],
  ['location comparison uses canonical input location', /sameLocation\(source\.location, membership\.location\)/.test(violationAssembly?.[0] ?? '')],
  ['route location equality includes file, line and declaration span', /first\.file\.value\.value === second\.file\.value\.value[\s\S]*?first\.line\.value === second\.line\.value[\s\S]*?first\.span\.end\.value === second\.span\.end\.value/.test(locationComparison?.[0] ?? '')],
  ['membership counterexample retains candidate locations', /candidateLocations: membership\.candidateLocations/.test(violationAssembly?.[0] ?? '')],
  ['source guard delegates to complete verifier after local guard succeeds', /failure \?\? delegate\.verify\(inference\)\.result/.test(source)],
  ['active guard has no foundation/relation dependency', !/semantic\/(foundation|relation)/.test(source)],
  ['active guard does not wire the legacy RequestType solver', !/requestTypeDerivationSolver/.test(source)],
];
let failures = 0;
for (const [label, condition] of checks) {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!condition) failures += 1;
}
const syntax = ts.transpileModule(source, {
  fileName: path.basename(relative),
  compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
const syntaxErrors = (syntax.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
process.stdout.write(`${syntaxErrors.length === 0 ? 'PASS' : 'FAIL'} syntax transpilation ${relative}\n`);
failures += syntaxErrors.length;
process.stdout.write(`Phase 2580: ${checks.length + 1 - failures}/${checks.length + 1} assertions passed.\n`);
process.exitCode = failures === 0 ? 0 : 1;
