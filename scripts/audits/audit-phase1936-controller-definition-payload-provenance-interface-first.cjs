const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const projection = read('packages/core/src/compiler/scanner/lexer/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['definition projection interface declares matched-payload source binding', /readonly sourceBinding:/.test(authorityInterface) && /matched-payload-source-file/.test(authorityInterface)],
  ['definition projection uses the exact matched payload source file', /sourceFile: input\.correspondence\.payload\.source\.file/.test(projection) && !/dependencies\.invocationJudgment\.sourceFile/.test(projection)],
  ['definition projection no longer accepts a parallel invocation judgment source channel', !/readonly invocationJudgment:/.test(projection) && !/invocationJudgment,/.test(wiring)],
  ['analyzer supplies only parameter semantics to the projection factory', /definitionProjectionAuthorityFor: \(\s*parameterSemantics:/.test(analyzer) && /definitionProjectionAuthorityFor\(parameterSemantics\)/.test(analyzer)],
  ['authority validates payload source identities before binding correspondence', authority.indexOf('sourceCorrelation.statementPayloads.forEach') < authority.indexOf('const bindings =') && /requireSameSourceFileIdentity\(sourceCorrelation\.sourceFile, payload\.source\.file\)/.test(authority)],
  ['resolved binding judgment retains matched correspondence and definition together', /readonly correspondence: Extract<[\s\S]*readonly kind: 'binding_payload_correspondence_matched'[\s\S]*readonly definition: ControllerVariableDefinition/.test(read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts'))],
  ['authority contract declares definition source binding closure', /readonly definitionProjectionSourceBinding:/.test(authorityInterface) && /definition-projector-consumes-the-matched-correspondence-payload-source-file/.test(authorityInterface)],
  ['semantic model contract records projection provenance ownership', /readonly version: 11/.test(model) && /definition-expression-projection-consumes-the-exact-matched-payload-source-file/.test(model)],
  ['Laravel scanner contract removes the duplicate source channel', /readonly version: 101/.test(scanner) && /no-longer-accepts-a-second-invocation-judgment-source-channel/.test(scanner)],
  ['contract versions remain coherent', /readonly contractVersion: 13/.test(authorityInterface) && /readonly version: 13/.test(authorityInterface) && /contractVersion: 13,/.test(authority) && /readonly version: 101/.test(scanner) && /version: 101,/.test(scanner)],
  ['audit command is registered', Boolean(packageJson.scripts['audit:phase1936-controller-definition-payload-provenance-interface-first'])],
  ['no new type assertions or semantic-foundation dependency', !/\sas\s/.test(authority + projection + analyzer) && !/semantic\/foundation/.test(authority + authorityInterface + model + scanner + projection + analyzer + wiring)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
