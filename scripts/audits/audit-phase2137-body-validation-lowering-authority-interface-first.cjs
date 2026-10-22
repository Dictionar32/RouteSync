const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const resolver = read('packages/core/src/compiler/scanner/subscanners/controller/controllerBodyResolver.ts');
const bodyInterface = read('packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts');
const bodyAuthority = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const actionContract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const schemaAuthority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const runtimeExecutor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['body resolver is evidence extraction, not schema semantic owner', !/RouteSemanticFlowValidationRuleSet|createRouteSchemaPayload|TypeInterner/.test(resolver)],
  ['body resolver contains no validation or schema derivation', !/RouteValidationRuleEntry|ScannedRouteValidationRuleEntry|validationSourceSpan|resolveKnownError/.test(resolver)],
  ['body authority attaches exact source identity and offsets to validation entries', /file: input\.sourceIdentity,[\s\S]*?start: numberValue\(validation\.source\.startOffset\),[\s\S]*?end: numberValue\(validation\.source\.endOffset\)/.test(bodyAuthority)],
  ['upstream interface explicitly states authority-owned lowering closure', /readonly contractVersion: 5/.test(bodyInterface) && /raw-typed-controller-body-evidence-is-consumed-by-the-existing-body-authority/.test(bodyInterface)],
  ['implementation matches the interface version and closure', /contractVersion: 5/.test(bodyAuthority) && /raw-typed-controller-body-evidence-is-consumed-by-the-existing-body-authority/.test(bodyAuthority)],
  ['body semantic authority owns validation-entry lowering', /RouteSemanticFlowValidationRuleSet\.create\(validationEntries, TypeInterner\.create\(\)\)\.fields/.test(bodyAuthority)],
  ['body semantic authority publishes canonical RouteSchemaPayload', /schema: createRouteSchemaPayload\(/.test(bodyAuthority)],
  ['body semantic judgment publishes the exact authority-derived source entries', /validationEntries,/.test(bodyAuthority)],
  ['action schema authority receives completed body judgment output', /inlineSchema: bodyJudgment\.schema/.test(actionContract) && /inlineValidationEntries: bodyJudgment\.validationEntries/.test(actionContract)],
  ['schema merge policy remains singular in schema judgment authority', /formRequestDerivation\(input\.requestEvidence\.source\.fields, input\.inlineSchema\)/.test(schemaAuthority) && /createRouteSchemaPayload/.test(schemaAuthority)],
  ['schema judgment retains inline entry provenance', /inlineValidationEntries: Object\.freeze\(\[\.\.\.input\.inlineValidationEntries\]\)/.test(schemaAuthority)],
  ['source identity correlation remains in body judgment', /sourceIdentity: input\.sourceIdentity/.test(bodyAuthority)],
  ['runtime executor remains an executor, not a schema derivation owner', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(runtimeExecutor) && !/RouteSemanticFlowValidationRuleSet|controllerBodyResolver/.test(runtimeExecutor)],
  ['no foundation or parallel inline-validation authority introduced', !/foundation|InlineValidationAuthority/.test(resolver + bodyInterface + bodyAuthority + actionContract)],
  ['Phase 2137 audit is registered in package scripts', typeof pkg.scripts['audit:phase2137-body-validation-lowering-authority-interface-first'] === 'string'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
