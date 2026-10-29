const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const schema = read('packages/core/src/types/domain/validationRules.ts');
const bodyInterface = read('packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts');
const bodyAuthority = read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts');
const actionAuthority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['RouteSchemaPayload owns source-bound validation entries', /readonly validationEntries: readonly RouteValidationRuleEntry\[\]/.test(schema)],
  ['schema factory freezes validation provenance', /validationEntries: Object\.freeze\(\[\.\.\.validationEntries\]\)/.test(schema)],
  ['empty schema publishes a closed empty provenance collection', /validationEntries: Object\.freeze\(\[\]\)/.test(schema)],
  ['body authority passes original entries into canonical schema', /validationEntries/.test(bodyAuthority) && /createRouteSchemaPayload\([\s\S]*?validationEntries/.test(bodyAuthority)],
  ['body judgment closure explicitly covers downstream schema projection', /contractVersion: 5/.test(bodyInterface) && /source-identity-and-validation-provenance-remain-closed-through-schema-projection/.test(bodyInterface)],
  ['body authority matches the upstream closure contract', /contractVersion: 5/.test(bodyAuthority) && /source-identity-and-validation-provenance-remain-closed-through-schema-projection/.test(bodyAuthority)],
  ['FormRequest and inline merge retains inline source entries', /inlineSchema\.validationEntries/.test(actionAuthority) && /createRouteSchemaPayload\([\s\S]*?inlineSchema\.validationEntries/.test(actionAuthority)],
  ['schema emptiness does not misclassify provenance-only metadata as a schema', /schema\.fields\.length \+ schema\.messages\.length \+ schema\.attributes\.length/.test(actionAuthority)],
  ['schema merge policy remains in the single action-schema authority', /formRequestDerivation/.test(actionAuthority) && /formRequestDerivation\(input\.requestEvidence\.source\.fields, input\.inlineSchema\)/.test(actionAuthority)],
  ['no additional semantic authority or foundation layer was introduced', !/InlineValidationAuthority|semantic\/foundation|relation\/foundation/.test(bodyAuthority + actionAuthority)],
  ['Phase 2138 audit is registered', typeof pkg.scripts['audit:phase2138-schema-provenance-closure-interface-first'] === 'string'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
