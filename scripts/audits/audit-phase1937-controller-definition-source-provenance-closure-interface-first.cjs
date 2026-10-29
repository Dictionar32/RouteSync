const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const contract = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const projection = read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['authority projects a definition before validating its source identity', /const definition = input\.definitionProjectionAuthority\.project/.test(authority) && /requireSameSourceFileIdentity\(input\.sourceCorrelation\.sourceFile, definition\.source\.file\)/.test(authority)],
  ['definition source identity validation occurs before the resolved binding judgment is returned', authority.indexOf('requireSameSourceFileIdentity(input.sourceCorrelation.sourceFile, definition.source.file)') < authority.indexOf("kind: 'controller_dataflow_binding_semantics_resolved'")],
  ['definition source identity validation uses the existing typed source-file relation', /laravelSourceIdentitySemantics\.relateSourceFiles/.test(authority) && /requireSameSourceFileIdentity\(input\.sourceCorrelation\.sourceFile, definition\.source\.file\)/.test(authority)],
  ['validation precedes variable-flow composition', authority.indexOf('requireSameSourceFileIdentity(input.sourceCorrelation.sourceFile, definition.source.file)') < authority.indexOf('controllerSemanticVariableFlowCompositionAuthority.compose')],
  ['validation precedes integrated-response publication', authority.indexOf('requireSameSourceFileIdentity(input.sourceCorrelation.sourceFile, definition.source.file)') < authority.indexOf('invocationSemanticIntegratedResponseComposition.integrate')],
  ['authority interface declares definition provenance closure', /readonly definitionProvenanceClosure:/.test(contract) && /every-resolved-definition-source-file-must-relate-to-the-canonical-sourceFile-after-projection/.test(contract)],
  ['definition projection still consumes exact matched payload source identity', /sourceFile: input\.correspondence\.payload\.source\.file/.test(projection) && !/dependencies\.invocationJudgment/.test(projection)],
  ['resolved binding keeps correspondence and exact projected definition together', /readonly correspondence: Extract<[\s\S]*readonly kind: 'binding_payload_correspondence_matched'[\s\S]*readonly definition: ControllerVariableDefinition/.test(read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts'))],
  ['model contract records definition-source validation before flow publication', /readonly version: 11/.test(model) && /projected-definition-source-file-is-validated-before-variable-flow-publication/.test(model)],
  ['Laravel scanner boundary documents upstream ownership and advances coherently', /readonly version: 101/.test(scanner) && /upstream-validates-the-projected-definition-source-file-before-variable-flow-publication/.test(scanner) && !/requireSameSourceFileIdentity/.test(analyzer)],
  ['authority, model, and scanner versions are coherent', /readonly contractVersion: 13/.test(contract) && /readonly version: 13/.test(contract) && /contractVersion: 13,/.test(authority) && /readonly version: 11/.test(model) && /version: 11,/.test(model) && /readonly version: 101/.test(scanner) && /version: 101,/.test(scanner)],
  ['audit command is registered and no assertion/foundation dependency is introduced', Boolean(packageJson.scripts['audit:phase1937-controller-definition-source-provenance-closure-interface-first']) && !/\sas\s/.test(authority + projection + analyzer) && !/semantic\/foundation/.test(authority + contract + model + scanner + projection + analyzer)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
