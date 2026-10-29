const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const scopes = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const files = [];
const walk = directory => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(target);
  }
};
scopes.forEach(scope => walk(path.join(root, scope)));

const counts = {
  typescriptFiles: files.length,
  exportedFunctionDeclarations: 0,
  exportedArrowVariableDeclarations: 0,
  exportedFunctionExpressionVariableDeclarations: 0,
  genericContinueWithArrowImplementations: 0,
  ifStatements: 0,
  switchStatements: 0,
  forStatements: 0,
  whileStatements: 0,
  conditionalExpressions: 0,
  nullishCoalescingExpressions: 0,
  strictEqualityExpressions: 0,
  mapPropertyCalls: 0,
  reducePropertyCalls: 0,
  arrayLiteralExpressions: 0,
  stringKeywordTypes: 0,
  numberKeywordTypes: 0,
  booleanKeywordTypes: 0,
  undefinedKeywordTypes: 0,
  nullKeywordTypes: 0,
  anyKeywordTypes: 0,
  unknownKeywordTypes: 0,
  voidKeywordTypes: 0,
  asExpressions: 0,
  typePredicateDeclarations: 0,
  lookupIdentifiers: 0,
  visitorIdentifiers: 0,
};
const hasExport = node => node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && hasExport(node)) counts.exportedFunctionDeclarations++;
    if (ts.isVariableStatement(node) && hasExport(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isArrowFunction(declaration.initializer)) counts.exportedArrowVariableDeclarations++;
        if (ts.isFunctionExpression(declaration.initializer)) counts.exportedFunctionExpressionVariableDeclarations++;
      }
    }
    if (ts.isArrowFunction(node) && node.typeParameters?.some(parameter => parameter.name.text === 'Result') && node.parent?.getText(source).includes('continueWith')) counts.genericContinueWithArrowImplementations++;
    if (ts.isIfStatement(node)) counts.ifStatements++;
    if (ts.isSwitchStatement(node)) counts.switchStatements++;
    if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) counts.forStatements++;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) counts.whileStatements++;
    if (ts.isConditionalExpression(node)) counts.conditionalExpressions++;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) counts.nullishCoalescingExpressions++;
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind)) counts.strictEqualityExpressions++;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      if (node.expression.name.text === 'map') counts.mapPropertyCalls++;
      if (node.expression.name.text === 'reduce') counts.reducePropertyCalls++;
    }
    if (ts.isArrayLiteralExpression(node)) counts.arrayLiteralExpressions++;
    if (node.kind === ts.SyntaxKind.StringKeyword) counts.stringKeywordTypes++;
    if (node.kind === ts.SyntaxKind.NumberKeyword) counts.numberKeywordTypes++;
    if (node.kind === ts.SyntaxKind.BooleanKeyword) counts.booleanKeywordTypes++;
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) counts.undefinedKeywordTypes++;
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.nullKeywordTypes++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) counts.anyKeywordTypes++;
    if (node.kind === ts.SyntaxKind.UnknownKeyword) counts.unknownKeywordTypes++;
    if (node.kind === ts.SyntaxKind.VoidKeyword) counts.voidKeywordTypes++;
    if (ts.isAsExpression(node)) counts.asExpressions++;
    if (ts.isTypePredicateNode(node)) counts.typePredicateDeclarations++;
    if (ts.isIdentifier(node) && node.text === 'lookup') counts.lookupIdentifiers++;
    if (ts.isIdentifier(node) && /visitor/i.test(node.text)) counts.visitorIdentifiers++;
    ts.forEachChild(node, visit);
  };
  visit(source);
}

const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const terminalPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const terminal = fs.readFileSync(terminalPath, 'utf8');
const upstreamSources = files.filter(file => file.includes(`${path.sep}packages${path.sep}core${path.sep}src${path.sep}types${path.sep}upstream${path.sep}`));
const coreUpstreamImportsCli = upstreamSources.some(file => /from\s+['"][^'"]*packages\/cli|from\s+['"]@routesync\/cli/.test(fs.readFileSync(file, 'utf8')));
const deletedRelations = ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'];
const report = {
  phase: 3106,
  scope: scopes,
  auditMode: 'TypeScript compiler AST inventory plus static checks of the real PHP controller discovery-to-manifest boundary; counts do not authorize mechanical deletion',
  counts,
  runtimeTrace: [
    'packages/cli/src/commands/scan.ts and sync.ts',
    'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts: controllerInvocationManifestCompositionAuthorityFactory.create / canonicalProjectCompositionOperation.compose',
    'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts: LaravelControllerSourceDiscoveryResult operations',
    'filesystem adapter: fs.realpath / fs.readdir / fs.lstat and Dirent classification',
    'discoveredSourceReadSettlementOperation.readAll and source-document identity binding',
    'source invocation semantic pipeline and semantic judgment inventory',
    'manifestBuilderOperationPreparation and CLI terminal manifest operation',
    'CLI manifest consumer / generator output',
  ],
  manifestBoundary: {
    canonicalProjectCompositionUsesDiscoveryContinueWith: /return discovery\.continueWith\(/.test(composition),
    boundaryHasBlockedProjection: /onBlocked:\s*blockedDiscovery\s*=>[\s\S]*?sourceDiscoveryBlocked/.test(composition),
    boundaryHasCompleteProjection: /onComplete:\s*completeDiscovery\s*=>[\s\S]*?discoveredSourcesContinuationOperation\.continue/.test(composition),
    upstreamHasNamedCompleteDiscoveryOperation: /continueCompleteDiscovery/.test(upstream),
    upstreamOwnsSourceInventoryOperation: /includeSource:\s*\(sourceFile: SourceFile\)/.test(upstream),
    upstreamOwnsBlockedEvidenceOperation: /block:\s*\(blocker: LaravelControllerSourceDiscoveryBlocker\)/.test(upstream),
    cliTerminalKeepsBlockedDiscoveryEvidence: /discovery:\s*Extract<LaravelControllerSourceDiscoveryResult,\s*\{\s*readonly kind: 'laravel_controller_source_discovery_blocked'\s*\}>/.test(terminal),
    interpretation: 'The upstream-to-CLI manifest projection remains an explicit boundary. The manifest contract belongs to CLI; moving it into core would reverse dependency direction. A neutral, core-owned projection contract is a candidate only if it removes the generic continuation without losing blocker/source provenance.',
  },
  dependencyDirection: {
    coreUpstreamImportsCli,
    noDeletedRelationFoundationRestored: !deletedRelations.some(name => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name))),
  },
  migrationPlan: [
    'Batch A: remove generic continuation from discovery blocker/result ADTs using variant-owned domain operations; update runtime callers and evidence-preservation tests together.',
    'Batch B: introduce a neutral upstream-owned manifest-input contract only if it does not import CLI manifest types and preserves complete/blocked/source identity evidence.',
    'Batch C: migrate exported function declarations and exported arrow values to named interface-typed const exports by domain package, beginning with runtime scanner dependencies.',
    'Batch D: classify primitive/control-flow occurrences by role; replace domain reasoning with data models while retaining necessary parser/lexer mechanics and exact PHP semantics.',
    'Batch E: typecheck, targeted tests, full tests, then PHP -> CLI -> manifest -> generator E2E.',
  ],
  verification: {
    syntaxTranspileVerified: false,
    fullTypecheckVerified: false,
    fullTestSuiteVerified: false,
    phpToCliManifestGeneratorE2eVerified: false,
  },
};
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/PHASE3106_MANIFEST_BOUNDARY_AND_PRIMITIVE_FRONTIER_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
