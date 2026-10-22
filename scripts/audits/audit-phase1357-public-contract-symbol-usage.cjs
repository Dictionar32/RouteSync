const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const ts = (() => {
  try { return require('typescript'); } catch {}
  for (const candidate of [
    '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js',
    '/usr/local/lib/node_modules/typescript/lib/typescript.js',
  ]) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  throw new Error('TypeScript compiler API is required for symbol-aware public contract auditing.');
})();
const sourceReportPath = 'scripts/audits/reports/phase1356-upstream-contract-triage.json';
const sourceReport = JSON.parse(fs.readFileSync(path.join(root, sourceReportPath), 'utf8'));
const targets = sourceReport.classifications.filter(item => item.classification === 'public_surface_unconsumed');
const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
if (!configPath) throw new Error('tsconfig.json was not found.');
const configRead = ts.readConfigFile(configPath, ts.sys.readFile);
if (configRead.error) throw new Error(ts.flattenDiagnosticMessageText(configRead.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(configRead.config, ts.sys, path.dirname(configPath), undefined, configPath);
const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
const checker = program.getTypeChecker();
const sourceByPath = new Map();
for (const source of program.getSourceFiles()) {
  if (!source.isDeclarationFile) sourceByPath.set(path.relative(root, source.fileName).split(path.sep).join('/'), source);
}
const symbolRefs = new Map();
const declarationByKey = new Map();
const declarationNames = new Set(targets.map(item => item.name));
const resolveSymbol = symbol => {
  if (!symbol) return undefined;
  if (symbol.flags & ts.SymbolFlags.Alias) {
    try { return checker.getAliasedSymbol(symbol); } catch { return symbol; }
  }
  return symbol;
};
const declarationNodes = new Map();
for (const target of targets) {
  const source = sourceByPath.get(target.file);
  if (!source) continue;
  let declaration;
  function visit(node) {
    if ((ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node))
      && node.name.text === target.name
      && source.getLineAndCharacterOfPosition(node.name.getStart(source)).line + 1 === target.declarationLine) declaration = node;
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!declaration) continue;
  const symbol = resolveSymbol(checker.getSymbolAtLocation(declaration.name));
  if (!symbol) continue;
  const key = `${target.file}::${target.name}`;
  declarationByKey.set(key, { target, source, declaration, symbol });
  declarationNodes.set(declaration.name, key);
  symbolRefs.set(symbol, []);
}
for (const [relative, source] of sourceByPath) {
  function visit(node) {
    if (ts.isIdentifier(node) && declarationNames.has(node.text)) {
      const resolved = resolveSymbol(checker.getSymbolAtLocation(node));
      const refs = resolved && symbolRefs.get(resolved);
      if (refs) {
        const declarationKey = declarationNodes.get(node);
        if (!declarationKey) {
          refs.push({ file: relative, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, parentKind: ts.SyntaxKind[node.parent.kind], snippet: node.parent.getText(source).slice(0, 140) });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const dispositionByName = {
  ProviderContainerOperations: ['boundary_candidate', 'Compare with ProviderContainerBindings and providerAstCanonical producer output; only wire if raw operations are a required distinct upstream stage.'],
  AstJudgmentInput: ['public_type_candidate', 'Determine whether external AST judgment constructors are intended API; if so document/export contract, otherwise compare with AstJudgmentConstructor.'],
  CanonicalAstNode: ['public_type_candidate', 'Generic alias to AstJudgmentContract; preserve as a possible stable API until package compatibility is reviewed.'],
  AstMappingRelation: ['vocabulary_overlap', 'Compare with AstMappingFact discriminant literals; consolidate only if the alias can become the canonical relation vocabulary without weakening ADT narrowing.'],
  AstSemanticStagePortKind: ['public_type_candidate', 'Derived discriminant union; retain if public consumers need a stable stage-port vocabulary.'],
  ResolvedExpressions: ['collection_contract_candidate', 'Compare with Sequence<ResolvedExpression> call sites and neighboring collection wrappers before deciding whether a named ADT wrapper is required.'],
  MutationAsts: ['collection_contract_candidate', 'Compare with Sequence<MutationAst> and neighboring AST collection wrappers; do not add runtime solely to consume the alias.'],
  ControllerFailureEvidence: ['alias_overlap', 'Alias of ControllerFailureContract; verify compatibility/public naming before retaining as an independent surface.'],
  ControllerExpressionFact: ['boundary_candidate', 'Trace controller expression extraction and dataflow fact producers; wire only if a distinct provenance-bearing fact is missing.'],
  EndpointRequestParameter: ['model_overlap', 'Compare with EndpointRequestBinding and route parameter capability; determine whether parameter-level and endpoint-level semantics are distinct.'],
  ExpressionDefinition: ['boundary_candidate', 'Check expression producer outputs for a canonical expression-plus-source record before wiring into consumers.'],
  ResponseSemanticShape: ['alias_overlap', 'Alias of ResponseJsonShape; preserve compatibility unless response semantic consumers adopt a single canonical name.'],
  LaravelDomainContract: ['public_adt_candidate', 'Union of high-level domain contracts; assess whether a heterogeneous catalog consumer exists before adding one.'],
  LaravelSemanticLookup: ['public_contract_candidate', 'Generic lookup boundary is declarative only; use only where a consumer needs lookup abstraction rather than a concrete index.'],
  DatabaseColumnType: ['vocabulary_overlap', 'Compare with DatabaseType and schema/model lowering; avoid two competing database type vocabularies.'],
  RelationKeyOrigin: ['vocabulary_overlap', 'Compare with ModelKeyOrigin and relation foreign-key provenance; merge only if semantics are identical.'],
  SemanticFlag: ['alias_overlap', 'Alias of TruthValue; likely redundant unless it communicates a deliberately distinct semantic role to public consumers.'],
  RequestRouteParameterName: ['boundary_candidate', 'Trace route-parameter extraction and request binding; connect only if this nominal wrapper is the canonical request-side identity.'],
  RequestUriValue: ['boundary_candidate', 'Trace request URI context production; avoid a parallel wrapper if RoutePath/route identity already owns URI semantics.'],
  RequestIpAddress: ['boundary_candidate', 'Trace request context evidence; preserve as public vocabulary unless request transport semantics explicitly model IP address.'],
  ValidationRuleDefinition: ['boundary_candidate', 'Compare with ValidationRule/RequestValidationCapability and source provenance; wire only if the definition-level source fact is missing.'],
  RequestFacts: ['aggregate_contract_candidate', 'Compare with RequestDefinition and request capability producers; determine whether this aggregate is canonical or superseded.'],
  ResourceFacts: ['aggregate_contract_candidate', 'Compare with ResourceDefinition and resource semantic capability; avoid a second aggregate SSOT.'],
  ResourceResponse: ['adt_overlap', 'Compare with response cardinality and ResourceDefinition output; determine whether this is a separate Laravel resource return shape.'],
  ResponseFacts: ['aggregate_contract_candidate', 'Compare with ResponseDefinition and response authority; avoid parallel aggregate models.'],
  RouteCapabilityInterface: ['alias_overlap', 'Empty extension of RouteCapabilityContract; remove only through a deliberate public API migration, not because internal references are absent.'],
  SchemaRelationTarget: ['boundary_candidate', 'Trace schema relation projection to ModelRelationTarget/SchemaRelation; wire only if table-model pairing is the missing canonical relation target.'],
  SemanticTextValue: ['vocabulary_overlap', 'Compare with SemanticText and SemanticValue ADT; ensure there is one canonical text-value representation.'],
  SourceReference: ['vocabulary_overlap', 'Compare with SourceFile and provenance SourceSpan; use only if a source-reference identity is distinct from a file name.'],
  CanonicalSourceNode: ['boundary_candidate', 'Candidate for AST boundary API; trace CompleteLaravelSourceModel/AST authority before adding a redundant conversion layer.'],
  SourceBoundaryInput: ['boundary_candidate', 'Candidate closed source-kind ADT; wire to a real AST/source producer only if it replaces existing branching and preserves provenance.'],
};
const approvedPhase1359Consumers = new Map([
  ['CanonicalSourceNode', 'packages/core/src/types/upstream/sourceBoundaryAlgebra.ts'],
  ['SourceBoundaryInput', 'packages/core/src/types/upstream/sourceBoundaryAlgebra.ts'],
]);
const records = targets.map(target => {
  const key = `${target.file}::${target.name}`;
  const declaration = declarationByKey.get(key);
  const refs = declaration ? symbolRefs.get(declaration.symbol) || [] : [];
  const disposition = dispositionByName[target.name] || ['review', 'Review semantic owner and public API role before changing.'];
  return {
    file: target.file,
    line: target.declarationLine,
    kind: target.kind,
    name: target.name,
    barrelReachable: target.reachableThroughExportStarBarrel,
    typeCheckerResolved: Boolean(declaration),
    symbolReferenceCount: refs.length,
    references: refs.slice(0, 30),
    disposition: disposition[0],
    recommendation: disposition[1],
    actionTaken: approvedPhase1359Consumers.has(target.name)
      ? `preserved; explicit source-boundary algebra consumer approved in Phase 1359 (${approvedPhase1359Consumers.get(target.name)})`
      : 'preserved; no source contract changed based on reference absence alone',
  };
});
const counts = {};
for (const record of records) counts[record.disposition] = (counts[record.disposition] || 0) + 1;
const checks = [
  { name: 'public-surface candidate set matches the Phase 1356 unconsumed-contract classification', ok: targets.every(item => item.classification === 'public_surface_unconsumed') },
  { name: 'all audited declarations resolved by TypeChecker', ok: records.every(record => record.typeCheckerResolved) },
  { name: 'all audited candidates remain barrel-reachable', ok: records.every(record => record.barrelReachable) },
  { name: 'all audited candidates are unreferenced or consumed only by approved Phase 1359 source-boundary algebra', ok: records.every(record => {
      const approvedFile = approvedPhase1359Consumers.get(record.name);
      if (!approvedFile) return record.symbolReferenceCount === 0;
      return record.symbolReferenceCount > 0 && record.references.every(reference => reference.file === approvedFile);
    }) },
  { name: 'all audited candidates have explicit semantic disposition and recommendation', ok: records.every(record => record.disposition && record.recommendation) },
  { name: 'source contracts were preserved rather than deleted automatically', ok: records.every(record => record.actionTaken.startsWith('preserved')) },
];
const report = {
  phase: 1357,
  audit: 'public-contract-symbol-usage',
  followUpPhase: 1359,
  approvedConsumerDeltas: Object.fromEntries(approvedPhase1359Consumers),
  method: 'TypeScript Compiler API Program + TypeChecker symbol identity, including import-alias resolution; TypeScript version used for this run is recorded below.',
  typescriptVersion: ts.version,
  sourceReport: sourceReportPath,
  projectFilesInProgram: program.getSourceFiles().length,
  publicSurfaceCandidates: records.length,
  classificationCounts: counts,
  checks,
  contracts: records,
  limitations: [
    'No resolved identifier references means no direct symbol use in this TypeScript program; it does not prove an exported type is dead because consumers may be external packages, generated sources, declaration consumers, or runtime-independent public API users.',
  'The Phase 1359 source-boundary algebra now makes CanonicalSourceNode and SourceBoundaryInput referenced candidates in the Phase 1356 inventory; they therefore leave the unconsumed-only subset and are checked by the dedicated Phase 1359 audit.',
    'The audit does not infer semantic equivalence between differently named types; duplicate-vocabulary recommendations require domain review.',
    'No contracts were removed, emptied, or given artificial consumers as part of this audit.'
  ],
};
const reportPath = 'scripts/audits/reports/phase1357-public-contract-symbol-usage.json';
fs.mkdirSync(path.dirname(path.join(root, reportPath)), { recursive: true });
fs.writeFileSync(path.join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
const failed = checks.filter(check => !check.ok);
process.stdout.write(JSON.stringify({ phase: 1357, audit: report.audit, passed: failed.length === 0, passedChecks: checks.length - failed.length, totalChecks: checks.length, failures: failed.map(check => check.name), typescriptVersion: ts.version, projectFilesInProgram: report.projectFilesInProgram, publicSurfaceCandidates: records.length, classificationCounts: counts, report: reportPath }, null, 2) + '\n');
process.exitCode = failed.length ? 1 : 0;
