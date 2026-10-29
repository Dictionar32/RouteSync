const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const target = 'packages/core/src/types/upstream/scannerStatementControlAlgebra.ts';
const source = read(target);
const transpiled = ts.transpileModule(source, {
  fileName: path.join(root, target),
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
});
const syntaxDiagnostics = (transpiled.diagnostics ?? []).map(diagnostic => ({
  code: diagnostic.code,
  message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
}));
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  genericContinueWithRemovedFromScannerControl: !/continueWith\s*:|\.continueWith\s*</.test(source),
  genericResultHandlerContractsRemoved: !/onPresent|onAbsent|onRecognized|onUnrecognized|<Result>/.test(source),
  tokenPresenceHasExplicitDomainOperation: /type TokenHeadJudgment[\s\S]*?toScannerStatementControlJudgment/.test(source),
  keywordRecognitionHasNamedDomainCatalog: /controlKeywordCatalog/.test(source) && /recognizeControlKeyword/.test(source),
  semanticOutcomeIsClosedAndTyped: /ScannerStatementControlJudgment<Token>/.test(source) && /kind: 'structured'/.test(source) && /kind: 'not_structured'/.test(source) && /control: recognized\.control/.test(source),
  noMapSideChannel: !/new Map\s*</.test(source) && !/ReadonlyMap/.test(source),
  publicRuntimeContractRemainsInterfaceFirst: /export const scannerStatementControlContractAlgebra:\s*ScannerStatementControlInterface\s*= Object\.freeze/.test(source),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  changedFileTranspilesWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
};
const regressions = [
  ['phase3070', 'scripts/audits/audit-phase3070-controller-invocation-input-domain-operations.cjs'],
  ['phase3069', 'scripts/audits/audit-phase3069-integration-to-controller-judgment-domain-operation.cjs'],
  ['phase3068', 'scripts/audits/audit-phase3068-upstream-pipeline-domain-integration.cjs'],
].map(([phase, script]) => {
  const run = spawnSync(process.execPath, [path.join(root, script)], { cwd: root, encoding: 'utf8' });
  return { phase, status: run.status === 0 ? 'PASS' : 'FAIL', output: `${run.stdout || ''}${run.stderr || ''}`.slice(-1400) };
});
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3071,
  title: 'Fully Explicit Typed Runtime Scanner Operations — structured statement control evidence',
  status: failed.length === 0 && regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  regressions,
  runtimeTrace: [
    'The CLI/runtime scanner supplies source tokens and the token-to-source-spelling operation to the upstream scanner control algebra.',
    'Token-head evidence is represented as a closed present/absent judgment rather than a generic Result continuation.',
    'Present-token evidence is interpreted through the named control-keyword catalog; PHP spellings map to typed ScannerStatementControlKind values.',
    'The catalog outcome exposes the domain operation toScannerStatementControlJudgment, yielding structured or not_structured evidence without a generic visitor/handler bundle.',
    'The resulting ScannerStatementControlJudgment is returned through the existing ScannerStatementControlInterface and remains consumable by the scanner runtime.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    regressions: regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
    strictTypeScript: 'NOT_CLAIMED — syntax transpilation does not establish whole-program type correctness.',
    vitestRuntime: 'NOT_RUN — workspace Vitest installation is incomplete.',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    globalPrimitiveElimination: 'NOT_CLAIMED — lexical recognition still requires an explicit token catalog and presence boundary; this phase removes generic continuations and the Map side channel from this scanner algebra only.',
  },
  remainingRisks: [
    'The control-keyword catalog currently uses array search and a presence check; this is an isolated lexical-recognition boundary, not a claim that all primitive operators have been removed.',
    'Other upstream scanner algebra modules still contain generic continuation operations, including statement-boundary and source-identity paths; each requires its own runtime trace before migration.',
    'Full PHP → CLI → manifest/IR execution remains unverified.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
for (const regression of regressions) console.log(`${regression.phase} regression: ${regression.status}`);
if (syntaxDiagnostics.length) console.error(JSON.stringify(syntaxDiagnostics, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3071_SCANNER_CONTROL_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exit(1);
