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
  throw new Error('TypeScript compiler API is required for the AST-aware contract audit.');
})();
const passed = [];
const failures = [];
const requireText = (relative, needle, label) => {
  if (fs.readFileSync(path.join(root, relative), 'utf8').includes(needle)) passed.push(label);
  else failures.push(`${relative}: missing ${label}`);
};
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const relative = path.posix.join(dir, entry.name);
  if (entry.isDirectory()) {
    if (['node_modules', 'dist', 'coverage', '.next', '.git'].includes(entry.name)) return [];
    return walk(relative);
  }
  return /\.(?:ts|tsx|mts|cts)$/.test(entry.name) ? [relative] : [];
});
const priorInventory = JSON.parse(fs.readFileSync(path.join(root, 'scripts/audits/reports/phase1354-upstream-contract-usage.json'), 'utf8'));
const priorCandidateKeys = new Set(priorInventory.unreferencedCandidates.map(item => `${item.file}::${item.name}`));
const sourcePaths = walk('packages');
const sourceByPath = new Map();
for (const relative of sourcePaths) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8');
  sourceByPath.set(relative, ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS));
}
const upstreamPaths = walk('packages/core/src/types/upstream').filter(file => sourceByPath.has(file));
const declarationRecords = [];
const declarationByFileName = new Map();
const declarationNamePattern = /^(?:type|interface)$/;
for (const relative of upstreamPaths) {
  const source = sourceByPath.get(relative);
  function visit(node) {
    if ((ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      const kind = ts.isTypeAliasDeclaration(node) ? 'type' : 'interface';
      if (declarationNamePattern.test(kind)) {
        const record = { file: relative, kind, name: node.name.text, declarationStart: node.name.getStart(source), declarationLine: source.getLineAndCharacterOfPosition(node.name.getStart(source)).line + 1 };
        declarationRecords.push(record);
        declarationByFileName.set(`${relative}::${record.name}`, record);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

// Build export-star reachability from the upstream barrel and package entry points.
const resolveRelativeModule = (fromFile, specifier) => {
  if (!specifier.startsWith('.')) return undefined;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, `${base}.cts`, `${base}/index.ts`, `${base}/index.tsx`];
  return candidates.find(candidate => sourceByPath.has(candidate));
};
const starEdges = new Map();
for (const [relative, source] of sourceByPath) {
  const targets = [];
  function visit(node) {
    if (ts.isExportDeclaration(node) && !node.exportClause && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = resolveRelativeModule(relative, node.moduleSpecifier.text);
      if (target) targets.push(target);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  starEdges.set(relative, targets);
}
const barrelRoots = [
  'packages/core/src/types/upstream/index.ts',
  'packages/core/src/index.ts',
  'packages/sdk/src/index.ts',
  'packages/react/src/index.ts',
  'packages/cli/src/index.ts',
].filter(file => sourceByPath.has(file));
const reachableFiles = new Set();
for (const rootFile of barrelRoots) {
  const queue = [rootFile];
  const seen = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    reachableFiles.add(current);
    queue.push(...(starEdges.get(current) || []));
  }
}
const isTypePosition = (identifier) => {
  let current = identifier.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isTypeNode(current) || ts.isTypeAliasDeclaration(current) || ts.isInterfaceDeclaration(current) || ts.isTypeParameterDeclaration(current)) return true;
    if (ts.isExpression(current) || ts.isStatement(current)) return false;
    current = current.parent;
  }
  return false;
};
const identifiersByName = new Map();
for (const [relative, source] of sourceByPath) {
  function visit(node) {
    if (ts.isIdentifier(node)) {
      const list = identifiersByName.get(node.text) || [];
      list.push({ relative, source, identifier: node });
      identifiersByName.set(node.text, list);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const triage = [];
for (const record of declarationRecords) {
  const refs = [];
  for (const occurrence of identifiersByName.get(record.name) || []) {
      const { relative, source, identifier } = occurrence;
      if (relative === record.file && identifier.getStart(source) === record.declarationStart) continue;
      const parent = identifier.parent;
      const importExport = ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent) || ts.isImportClause(parent) || ts.isNamespaceImport(parent);
      refs.push({ file: relative, line: source.getLineAndCharacterOfPosition(identifier.getStart()).line + 1, sameFile: relative === record.file, typePosition: isTypePosition(identifier), importExport, text: parent.getText(source).slice(0, 120) });
  }
  const externalRefs = refs.filter(ref => !ref.sameFile);
  const externalTypeRefs = externalRefs.filter(ref => ref.typePosition).length;
  const externalRuntimeRefs = externalRefs.filter(ref => !ref.typePosition && !ref.importExport).length;
  const barrelReachable = reachableFiles.has(record.file);
  const externalImportExportRefs = externalRefs.filter(ref => ref.importExport).length;
  let classification;
  let recommendation;
  if (externalRefs.length) {
    classification = 'externally_referenced';
    recommendation = 'Trace the referenced producer/consumer and preserve unless ownership or duplication is proven.';
  } else if (refs.length) {
    classification = 'same_file_only';
    recommendation = 'Inspect whether this is an internal helper/alias, recursive ADT member, or a contract that lacks downstream wiring.';
  } else if (barrelReachable) {
    classification = 'public_surface_unconsumed';
    recommendation = 'Publicly exposed but no identifier consumer was found; check API intent and runtime/type-only role before changing.';
  } else {
    classification = 'no_reference_no_barrel';
    recommendation = 'Highest-priority semantic review candidate; do not delete until declarations, tests, generated code, and package API are checked.';
  }
  triage.push({ ...record, phase1354Candidate: priorCandidateKeys.has(`${record.file}::${record.name}`), classification, sameFileReferenceCount: refs.filter(ref => ref.sameFile).length, externalIdentifierReferenceCount: externalRefs.length, externalTypeReferenceCount: externalTypeRefs, externalRuntimeReferenceCount: externalRuntimeRefs, externalImportExportReferenceCount: externalImportExportRefs, reachableThroughExportStarBarrel: barrelReachable, references: refs.slice(0, 20), recommendation });
}
const counts = {};
for (const item of triage) counts[item.classification] = (counts[item.classification] || 0) + 1;
const candidates = triage.filter(item => item.phase1354Candidate);
const candidateClassificationCounts = {};
for (const item of candidates) candidateClassificationCounts[item.classification] = (candidateClassificationCounts[item.classification] || 0) + 1;
const report = {
  phase: 1356,
  audit: 'upstream-contract-triage',
  method: 'TypeScript AST identifier-occurrence scan plus relative export-star reachability; not a TypeChecker symbol-resolution proof',
  roots: barrelRoots,
  upstreamFiles: upstreamPaths.length,
  exportedTypeInterfaceDeclarations: triage.length,
  candidateSetFromPhase1354: candidates.length,
  classificationCounts: counts,
  candidateClassificationCounts,
  classifications: triage,
  noExternalIdentifierCandidates: candidates,
  caveat: 'Identifier occurrences are syntactic evidence only. Same-name shadowing and semantic symbol identity are not resolved. Never treat this report alone as proof that a declaration is dead or should be deleted/emptied.',
};
const reportPath = 'scripts/audits/reports/phase1356-upstream-contract-triage.json';
fs.mkdirSync(path.dirname(path.join(root, reportPath)), { recursive: true });
fs.writeFileSync(path.join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);

requireText('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', 'export const operationIdentityCapabilityAlgebra: OperationIdentityCapabilityRuntimeAlgebraInterface', 'runtime algebra is concrete rather than type-only');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts', 'algebra.fromRoute(input)', 'operation identity authority delegates runtime behavior');
requireText('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'astSemanticInterfaceFacts(stageInterface)', 'AST pipeline consumes stage facts through its contract algebra');
requireText('packages/core/src/types/upstream/astDataflowInterface.ts', 'DataFlowAuthorityInterface<', 'AST dataflow contract reuses canonical read-only dataflow authority');
requireText('packages/core/src/types/upstream/semanticDataflowAuthority.ts', 'relationFixedPoint', 'semantic dataflow closure remains upstream-owned');
requireText('packages/core/src/types/upstream/index.ts', "export * from './route'", 'upstream barrel publicly exposes route contracts');
requireText('packages/core/src/index.ts', "export { operationIdentityCapabilityAlgebra }", 'core barrel exposes concrete operation identity runtime algebra');
if (candidates.length !== priorInventory.unreferencedCandidates.length) failures.push(`expected ${priorInventory.unreferencedCandidates.length} candidates carried from Phase 1354; AST triage found ${candidates.length}`);
const result = { phase: 1356, audit: 'upstream-contract-triage', passed: failures.length === 0, passedChecks: passed.length, failures, inventory: { upstreamFiles: upstreamPaths.length, exportedTypeInterfaceDeclarations: triage.length, candidateSetFromPhase1354: candidates.length, classificationCounts: counts, candidateClassificationCounts, report: reportPath } };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
