const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['schema evidence carries source, origin, inline entries and a domain continuation', () => /schemaOrigin: ControllerActionSchemaDerivation\['kind'\]/.test(read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts')) && /inlineValidationEntries: readonly RouteValidationRuleEntry\[\]/.test(read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts')) && /continueToSchema: \(\) => RouteSchemaPayload/.test(read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts'))],
  ['schema authority publishes one canonical evidence value', () => /routeRequestEvidence,\s*forRouteRequest: \(\) => routeRequestEvidence/s.test(read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts'))],
  ['semantic action judgment retains schema evidence', () => /readonly schemaEvidence: ControllerActionSchemaRouteRequestEvidence<SourceFile>/.test(read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts'))],
  ['all route-selection outcomes expose evidence continuation', () => (read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').match(/continueToRouteSchemaEvidence/g) || []).length === 4],
  ['matched correlation returns canonical source-owned evidence', () => /continueToRouteSchemaEvidence: \(\) => first\.judgment\.semantic\.schemaEvidence/.test(read('packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts'))],
  ['route composition passes schema evidence to boundary', () => /schemaEvidence: target\.action\.schemaEvidence/.test(read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts')) && /const schemaEvidence = actionJudgmentSelection\.continueToRouteSchemaEvidence\(\)/.test(read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts'))],
  ['boundary resolver preserves schema evidence', () => /schemaEvidence: params\.schemaEvidence/.test(read('packages/core/src/compiler/semantic/route-boundary/boundaryInputResolution.ts'))],
  ['binding builder preserves schema evidence', () => /schemaEvidence: params\.schemaEvidence/.test(read('packages/core/src/compiler/semantic/route-boundary/bindingBuilder.ts'))],
  ['CLI route serializer preserves binding projection', () => /binding: route\.binding/.test(read('packages/cli/src/generators/ManifestSerializer.ts'))],
  ['no exported function added in audited route/manifest runtime path', () => !['packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts','packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts','packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts','packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts','packages/cli/src/manifestScanOperationInterface.ts','packages/cli/src/generators/ManifestSerializer.ts'].some(file => /export\s+function\s+\w+\s*\(/.test(read(file)))],
  ['collections remains intentionally empty', () => fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['deleted relation foundation modules are not restored', () => !['relationMembership.ts','relationalSequence.ts','semanticRelations.ts'].some(file => fs.existsSync(path.join(root,'packages/core/src/semantic/relations',file)))],
];
let failures = 0;
for (const [label, check] of checks) {
  const passed = Boolean(check());
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
