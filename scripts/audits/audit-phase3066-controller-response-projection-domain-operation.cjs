const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const controllerAdt = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const routeComposition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const responseProjection = routeComposition.match(/const responseProjectionForTarget = \([\s\S]*?\n};/);
const schemaRegression = spawnSync(process.execPath, [path.join(root, 'scripts/audits/audit-phase3065-route-schema-evidence-domain-continuation.cjs')], { cwd: root, encoding: 'utf8' });
const firstOutput = source => Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => {
  const index = source.indexOf(token);
  return index < 0 ? Number.POSITIVE_INFINITY : index;
}));
const checks = {
  responseProjectionHandlerIsDomainNamed: /interface LaravelControllerScanResponseProjectionHandlers<Result>/.test(controllerAdt),
  completeJudgmentExposesResponseProjectionOperation: /LaravelControllerScanCompleteJudgmentData & Readonly<\{[\s\S]*?continueToResponseProjection/.test(controllerAdt),
  blockedJudgmentExposesResponseProjectionOperation: /LaravelControllerScanBlockedJudgment = LaravelControllerScanBlockedJudgmentData & Readonly<\{[\s\S]*?continueToResponseProjection/.test(controllerAdt),
  completeConstructorDispatchesToCompleteHandler: /continueToResponseProjection:[\s\S]*?handlers\.onComplete\(result\)/.test(controllerAdt),
  blockedConstructorDispatchesToBlockedHandler: /continueToResponseProjection:[\s\S]*?handlers\.onBlocked\(result\)/.test(controllerAdt),
  matchedRouteSelectionUsesResponseProjectionOperation: Boolean(responseProjection && /controllerScan\.continueToResponseProjection\(/.test(responseProjection[0])),
  matchedRouteSelectionDoesNotInspectControllerScanKind: Boolean(responseProjection && !/controllerScan\.kind/.test(responseProjection[0])),
  blockedControllerScanRemainsExplicitlyBlocked: Boolean(responseProjection && /onBlocked: \(\) => Object\.freeze\(\{ kind: 'controller_response_projection_blocked'/.test(responseProjection[0])),
  completeControllerScanPreservesControllerIdentityCorrelation: Boolean(responseProjection && /controller\.identity\.value\.value === selection\.publication\.controller\.value\.value/.test(responseProjection[0])),
  unmatchedAmbiguousAndInvalidActionJudgmentsRemainDistinct: Boolean(responseProjection && ['unmatched_action_judgment', 'ambiguous_action_judgments', 'invalid_action_judgment_publication'].every(kind => responseProjection[0].includes(kind))),
  routePolicyCatalogOperationRemainsOnControllerAdt: /continueToRoutePolicyCatalog/.test(controllerAdt),
  sourceAstContinuationRemainsOnControllerAdt: /continueToSourceAstProjection/.test(controllerAdt),
  cliScanBlockedGatePrecedesOutputWrites: cliScan.indexOf('const completeManifest = scannedManifest.continueForDriftAudit') >= 0 && cliScan.indexOf('const completeManifest = scannedManifest.continueForDriftAudit') < firstOutput(cliScan) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(cliScan),
  cliSyncBlockedGatePrecedesOutputWrites: cliSync.indexOf('const completeManifest = scannedManifest.continueForDriftAudit') >= 0 && cliSync.indexOf('const completeManifest = scannedManifest.continueForDriftAudit') < firstOutput(cliSync) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(cliSync),
  noDeletedRelationFoundationRestoration: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  protectedCollectionsInvariantStillOneNewlineByte: collections.length === 1 && collections[0] === 10,
  phase3065SchemaEvidenceRegressionPasses: schemaRegression.status === 0 && /14\/14 checks passed/.test(schemaRegression.stdout),
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3066,
  title: 'Fully Explicit Typed Runtime Scanner Operations — controller response projection domain operation',
  status: failed.length ? 'FAIL' : 'PASS',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  runtimeTrace: [
    'PHP controller source → LaravelControllerScanJudgment complete/blocked ADT',
    'Route declaration composition correlates a matched action publication with controller identity',
    'LaravelControllerScanJudgment.continueToResponseProjection(handlers) selects the exact scanner-owned continuation',
    'Complete outcome projects the response product; blocked outcome preserves an explicit unavailable response projection',
    'Route boundary retains response projection outcome before upstream manifest construction',
    'CLI scan/sync manifest-blocked gates remain before output writes',
  ],
  verification: {
    structuralAudit: failed.length ? 'FAIL' : 'PASS',
    priorPhase3065SchemaEvidenceAudit: schemaRegression.status === 0 ? 'PASS — 14/14' : 'FAIL',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    changedFilesSyntaxTranspile: 'PASS for schema interface, schema authority, route composition, and controller scanner interface',
    strictTypeScript: 'BLOCKED by missing ambient type definitions: chai, deep-eql, estree, fs-extra, jsonfile, node, react',
    globalPrimitiveElimination: 'NOT_CLAIMED',
  },
  remainingRisks: [
    'The new continuation removes the controllerScan.kind decision from one matched-action response projection path only; other primitive decisions remain in route and parser domains.',
    'Controller identity matching and candidate cardinality handling remain local operations because they concern route-publication correlation, not scanner judgment dispatch.',
    'Structural assertions do not prove an executed PHP → CLI → manifest/IR runtime.',
    'Strict TypeScript validation is blocked by missing ambient type definitions; syntax transpilation passed for the changed TypeScript files.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log(JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3066_CONTROLLER_RESPONSE_PROJECTION_DOMAIN_OPERATION_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (failed.length) process.exit(1);
