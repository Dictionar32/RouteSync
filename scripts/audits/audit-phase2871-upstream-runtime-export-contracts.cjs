const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const upstreamRoot = path.join(root, 'packages/core/src/types/upstream');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const stat = relative => fs.statSync(path.join(root, relative)).size;
const walkTypeScript = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory()
    ? walkTypeScript(absolute)
    : entry.isFile() && absolute.endsWith('.ts') && !absolute.includes(`${path.sep}__tests__${path.sep}`)
      ? [absolute]
      : [];
});
const exported = node => (node.modifiers ?? []).some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
const classifyArrow = name => {
  if (/^(reason|solve|analy[sz]e|judge|decide|infer|resolve|validate|assert|compile|close|derive|match|fold|bind|map|from|create|build|produce|project|semantic)/i.test(name)) {
    return 'domain-operation-or-constructor-review';
  }
  return 'unannotated-arrow-review';
};

const sourceFiles = walkTypeScript(upstreamRoot);
const inventory = [];
const counts = {
  productionTypeScriptFiles: sourceFiles.length,
  exportedFunctionDeclarations: 0,
  exportedVariableDeclarations: 0,
  explicitlyTypedExportedVariables: 0,
  unannotatedExportedVariables: 0,
  unannotatedExportedArrowVariables: 0,
  unannotatedExportedObjectVariables: 0,
  unannotatedExportedCallVariables: 0,
  otherUnannotatedExportedVariables: 0,
};

for (const absolute of sourceFiles) {
  const source = fs.readFileSync(absolute, 'utf8');
  const sourceFile = ts.createSourceFile(absolute, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const statement of sourceFile.statements) {
    if (!exported(statement)) continue;
    if (ts.isFunctionDeclaration(statement)) {
      counts.exportedFunctionDeclarations += 1;
      inventory.push({
        file: path.relative(root, absolute).split(path.sep).join('/'),
        line: sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1,
        name: statement.name?.text ?? '<anonymous>',
        syntax: 'export-function-declaration',
        priority: 'migrate-to-named-operation-interface-if-domain-runtime',
      });
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      counts.exportedVariableDeclarations += 1;
      const name = declaration.name.text;
      const file = path.relative(root, absolute).split(path.sep).join('/');
      const line = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile)).line + 1;
      if (declaration.type) {
        counts.explicitlyTypedExportedVariables += 1;
        continue;
      }
      counts.unannotatedExportedVariables += 1;
      let syntax = 'other-initializer';
      let priority = 'classify-before-changing';
      if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
        syntax = 'unannotated-arrow';
        priority = classifyArrow(name);
        counts.unannotatedExportedArrowVariables += 1;
      } else if (declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
        syntax = 'unannotated-object';
        counts.unannotatedExportedObjectVariables += 1;
      } else if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
        syntax = 'unannotated-call';
        counts.unannotatedExportedCallVariables += 1;
      } else {
        counts.otherUnannotatedExportedVariables += 1;
      }
      inventory.push({ file, line, name, syntax, priority });
    }
  }
}

const cliBoundary = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const builder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const trace = read('packages/core/src/types/upstream/PHASE2870_FULLY_TYPED_RUNTIME_SCANNER_OPERATIONS_TRACE.md');
const checks = {
  upstreamContainsNoExportFunctionDeclarations: counts.exportedFunctionDeclarations === 0,
  cliManifestScanFactoryIsInterfaceFirst: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliBoundary),
  cliManifestBuilderIsInterfaceFirst: /export const controllerInvocationManifestBuilder:\s*ControllerInvocationManifestBuilderInterface\s*=\s*Object\.freeze\(/.test(composition),
  compositionAuthorityIsInterfaceFirst: /export const controllerInvocationManifestCompositionAuthorityFactory:\s*ControllerInvocationManifestCompositionAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(composition),
  compositionUsesExistingDomainDependencies: /sourceProjectIdentityCanonicalization: ControllerSourceProjectIdentityCanonicalizationInterface/.test(compositionContract) && /manifestBuilderPreparation: ManifestBuilderOperationPreparationInterface/.test(compositionContract),
  manifestJudgmentsExposeDomainContinuation: /interface ManifestBuilderCompleteJudgment[\s\S]*?continueWith/.test(builder) && /interface ManifestBuilderSourceAstBlockedJudgment[\s\S]*?continueWith/.test(builder) && /interface ManifestBuilderSourceModelBlockedJudgment[\s\S]*?continueWith/.test(builder),
  cliTerminalsExposeDomainContinuation: /interface ControllerInvocationManifestTerminalOperationInterface[\s\S]*?continueForDriftAudit/.test(compositionContract),
  astFailureRemainsBlocked: /Exclude<LaravelSourceAstProjectionJudgment,\s*\{\s*readonly kind: 'laravel_source_ast_projection_complete'/.test(builder),
  upstreamBarrelMentionsSemanticDataflowKnowledge: /semanticDataflowKnowledge/.test(upstreamBarrel),
  upstreamBarrelDoesNotRemoveEmptyCollectionsModule: /export \* from '\.\/collections'/.test(upstreamBarrel) && stat('packages/core/src/types/upstream/collections.ts') === 0,
  traceDisclosesRemainingCompositionBranches: /still has local `if` decisions/.test(trace),
};

const report = {
  phase: 2871,
  title: 'Fully Typed Runtime Scanner Operations — AST Export Contract Inventory',
  counts,
  checks,
  passedChecks: Object.values(checks).filter(Boolean).length,
  totalChecks: Object.keys(checks).length,
  collectionsBytes: stat('packages/core/src/types/upstream/collections.ts'),
  interpretation: [
    'An unannotated exported arrow is an audit candidate, not proof that it should receive an interface. Classify domain operation, value constructor, constant/data, and internal helper first.',
    'Existing CLI manifest boundary exports are interface-first; this does not establish that every upstream export is compliant.',
    'The inventory uses the TypeScript compiler API for declaration classification; it does not run semantic typechecking or tests.',
  ],
  nextWorkOrder: [
    'First review unannotated arrows in the manifest/AST/judgment production path, then reuse existing authority and judgment contracts.',
    'For true domain operations, add or evolve a named domain interface and annotate the exported const; do not create generic helper interfaces.',
    'For constructors and vocabulary constants, preserve their domain/value contract rather than mechanically wrapping each in an operations interface.',
    'Add continuation operations to domain judgments at the producing authority boundary, then migrate consumers away from repeated discriminant dispatch.',
    'After each bounded migration, run package typecheck, targeted tests, build, and CLI manifest end-to-end tests using supported project dependencies.',
  ],
};

fs.writeFileSync(path.join(upstreamRoot, 'PHASE2871_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(upstreamRoot, 'PHASE2871_RUNTIME_EXPORT_INVENTORY.json'), `${JSON.stringify(inventory, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.passedChecks !== report.totalChecks) process.exitCode = 1;
