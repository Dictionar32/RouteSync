const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner');
const outputJson = path.join(root, 'PHASE1550_SCANNER_REASONING_INVENTORY.json');
const outputMarkdown = path.join(root, 'PHASE1550_SCANNER_REASONING_INVENTORY.md');
const auditPath = path.join(root, 'PHASE1550_AUDIT.json');
const sourceFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const full = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(full);
  else if (/\.tsx?$/.test(entry.name)) sourceFiles.push(full);
});
walk(scannerRoot);
sourceFiles.sort();

const patterns = [
  ['direct_solver_execution', /\b(?:solveSemanticRelationsDetailed|solveSemanticRelations)\s*\(/g],
  ['semantic_closure_entrypoint', /\b(?:solveSemanticConstraintProgram|solveSemanticBehavior|closeCanonicalSemanticRelations|closeCanonicalSemanticTheory)\s*\(/g],
  ['semantic_inference_or_resolution', /\b(?:infer[A-Z]\w*|derive[A-Z]\w*|resolve[A-Z]\w*|classify[A-Z]\w*|constraintHold|constraintsHold|semanticDecision|semanticResolution|semanticJudgment|candidateSelection|precedence)\b/g],
  ['relation_calculus_or_closure', /\b(?:SemanticRelation|semanticRelation|relationProgram|relationTheory|semanticRewrite|semanticConstraint|closure|saturat(?:ed|ion)|fixedPoint|leastFixedPoint|derivation)\b/g],
  ['ast_or_domain_classification', /\b(?:astClassifier|Classifier|classif(?:y|ication)|OriginResolver|ModelResolver|RouteCrudClassifier|semanticTypeCanonical|resourceTypeDeriver)\b/g],
  ['evidence_collection_or_adaptation', /\b(?:Evidence|evidence|Adapter|adapter|extract[A-Z]\w*|parse[A-Z]\w*|Scanner|scanner|token)\b/g],
  ['runtime_or_execution_boundary', /\b(?:RuntimeExecutor|runtimeBinding|execute[A-Z]\w*|AuthorityInterface|semanticAuthority|Engine)\b/g],
];
const files = sourceFiles.map(full => {
  const content = fs.readFileSync(full, 'utf8');
  const relativePath = path.relative(root, full).split(path.sep).join('/');
  const lines = content.split(/\r?\n/);
  const hits = {};
  for (const [category, regex] of patterns) {
    regex.lastIndex = 0;
    const matches = [];
    lines.forEach((line, index) => {
      regex.lastIndex = 0;
      if (regex.test(line)) matches.push({ line: index + 1, text: line.trim().slice(0, 220) });
    });
    if (matches.length) hits[category] = matches;
  }
  const directSolverCalls = [];
  lines.forEach((line, index) => {
    if (/\b(?:solveSemanticRelationsDetailed|solveSemanticRelations)\s*\(/.test(line)) {
      directSolverCalls.push({ line: index + 1, text: line.trim().slice(0, 220) });
    }
  });
  const imports = lines.filter(line => /^\s*import\b/.test(line) && /(?:types\/upstream|semantic\/foundation|compiler\/scanner)/.test(line)).map(line => line.trim().slice(0, 220));
  const isTest = /(?:\.test\.|\.spec\.|__test__|__tests__)/.test(relativePath);
  const categories = Object.keys(hits);
  const role = isTest ? 'test' : directSolverCalls.length ? 'direct-solver-candidate' : categories.includes('semantic_inference_or_resolution') || categories.includes('relation_calculus_or_closure') || categories.includes('ast_or_domain_classification') ? 'semantic-reasoning-candidate' : categories.includes('evidence_collection_or_adaptation') ? 'evidence-or-adapter-candidate' : categories.includes('runtime_or_execution_boundary') ? 'runtime-or-wiring-candidate' : 'other';
  return { path: relativePath, test: isTest, role, categories, directSolverCalls, hits, relevantImports: imports };
});
const countBy = key => files.reduce((counts, file) => {
  const values = key === 'role' ? [file.role] : file[key];
  values.forEach(value => { counts[value] = (counts[value] || 0) + 1; });
  return counts;
}, {});
const directCalls = files.flatMap(file => file.directSolverCalls.map(call => ({ path: file.path, ...call })));
const nonTestDirectCalls = directCalls.filter(call => !/(?:\.test\.|\.spec\.|__test__|__tests__)/.test(call.path));
const inventory = {
  phase: 1550,
  generatedAt: new Date().toISOString(),
  scope: 'Every TypeScript/TSX file under packages/core/src/compiler/scanner; heuristic inventory, not a proof that all reasoning has been identified.',
  totals: { sourceFiles: files.length, productionFiles: files.filter(file => !file.test).length, testFiles: files.filter(file => file.test).length, filesWithReasoningSignals: files.filter(file => file.categories.some(category => ['semantic_inference_or_resolution', 'relation_calculus_or_closure', 'ast_or_domain_classification', 'direct_solver_execution'].includes(category))).length, filesWithDirectSolverCalls: files.filter(file => file.directSolverCalls.length).length, productionFilesWithDirectSolverCalls: [...new Set(nonTestDirectCalls.map(call => call.path))].length },
  roleCounts: countBy('role'),
  categoryFileCounts: patterns.reduce((result, [category]) => ({ ...result, [category]: files.filter(file => file.categories.includes(category)).length }), {}),
  directSolverCalls: directCalls,
  productionDirectSolverCalls: nonTestDirectCalls,
  files,
};
fs.writeFileSync(outputJson, JSON.stringify(inventory, null, 2) + '\n');
const markdown = [
  '# Phase 1550 — Scanner Reasoning Inventory',
  '',
  '> Generated by a source-tree heuristic scan. It accounts for every scanner TS/TSX file, but category labels are leads for manual ownership tracing, not proof that a file is semantically pure.',
  '',
  '## Coverage',
  '',
  `- Total TS/TSX files: **${inventory.totals.sourceFiles}**`,
  `- Production files: **${inventory.totals.productionFiles}**`,
  `- Test files: **${inventory.totals.testFiles}**`,
  `- Files with reasoning signals: **${inventory.totals.filesWithReasoningSignals}**`,
  `- Production files with direct solver calls: **${inventory.totals.productionFilesWithDirectSolverCalls}**`,
  '',
  '## Signal categories',
  '',
  ...Object.entries(inventory.categoryFileCounts).map(([category, count]) => `- \`${category}\`: ${count} files`),
  '',
  '## Direct solver calls in production files',
  '',
  ...(nonTestDirectCalls.length ? nonTestDirectCalls.map(call => `- \`${call.path}:${call.line}\` — \`${call.text}\``) : ['- None found by the configured direct-call patterns.']),
  '',
  '## Reasoning candidates',
  '',
  ...files.filter(file => !file.test && ['direct-solver-candidate', 'semantic-reasoning-candidate'].includes(file.role)).map(file => `- \`${file.path}\` — ${file.role}; signals: ${file.categories.join(', ') || 'none'}`),
  '',
  '## Interpretation',
  '',
  '- Evidence adapters may inspect AST shape; that alone is not a semantic ownership violation.',
  '- Solver invocation, candidate selection, precedence, inference, constraint filtering, closure, and domain classification require an explicit upstream authority owner.',
  '- Files categorized as candidates must be traced through imports and consumers before migration; this inventory intentionally does not auto-move code.',
  '- Phase 1550 moves constraint calculus ownership to `types/upstream` and routes the behavior kernel’s generic relation closure through the upstream runtime executor. Other semantic producers remain migration frontiers.',
].join('\n');
fs.writeFileSync(outputMarkdown, markdown + '\n');

const constraintFacade = fs.readFileSync(path.join(scannerRoot, 'lexer/routeAst/semanticConstraintCalculus.ts'), 'utf8');
const behaviorKernel = fs.readFileSync(path.join(scannerRoot, 'lexer/routeAst/semanticRelationalBehaviorKernel.ts'), 'utf8');
const scannerSemanticFacades = ['semanticConstraintCalculus.ts', 'semanticRelationProgram.ts', 'semanticRelationTheory.ts', 'semanticRelationalBehaviorCatalog.ts', 'semanticRelationalBehaviorKernel.ts', 'semanticClosureEngine.ts'].map(name => ({ name, content: fs.readFileSync(path.join(scannerRoot, 'lexer/routeAst', name), 'utf8') }));
const resourceMappingConsumers = ['resourceSemanticMappingRelations.ts', 'resourceUpstreamExpressionMappings.ts'].map(name => ({ name, content: fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/resource', name), 'utf8') }));
const upstreamSemanticOwners = ['semanticConstraintAuthority.ts', 'semanticRewriteAuthority.ts', 'semanticRelationProgram.ts', 'semanticRelationTheory.ts', 'semanticRelationalBehaviorCatalog.ts', 'semanticRelationalBehaviorKernel.ts', 'semanticClosureEngine.ts'].map(name => ({ name, content: fs.readFileSync(path.join(root, 'packages/core/src/types/upstream', name), 'utf8') }));
const authority = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticConstraintAuthority.ts'), 'utf8');
const executor = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticRewriteRuntimeExecutor.ts'), 'utf8');
const checks = [
  { name: 'all-scanner-typescript-files-accounted-for', passed: files.length > 0 && files.every(file => fs.existsSync(path.join(root, file.path))), detail: `${files.length} TS/TSX files have an inventory record.` },
  { name: 'constraint-calculus-scanner-path-is-facade', passed: !/solveSemanticRelationsDetailed\s*\(/.test(constraintFacade) && !/function\s+constraintsHold|const\s+constraintsHold/.test(constraintFacade), detail: 'Scanner compatibility module contains exports only, not constraint reasoning or solver orchestration.' },
  { name: 'relational-reasoning-cluster-is-upstream-owned', passed: scannerSemanticFacades.every(file => /^\/\*\* Compatibility facade/.test(file.content) && !/solveSemanticRelationsDetailed\s*\(|const\s+constraintsHold|const\s+canonicalize/.test(file.content)), detail: 'Six scanner entrypoints are compatibility facades; relation program validation, theory, catalog, kernel, closure, and constraint calculus implementations live upstream.' },
  { name: 'upstream-semantic-owners-do-not-import-scanner', passed: upstreamSemanticOwners.every(file => !/from ['"][^'"]*compiler\/scanner/.test(file.content)), detail: 'The moved upstream semantic owners do not depend back on scanner implementation modules.' },
  { name: 'constraint-authority-uses-foundation-solver', passed: /solveSemanticRelationsDetailed/.test(authority) && /constraintsHold/.test(authority), detail: 'Constraint filtering and iterative closure live in upstream authority and reuse the foundation solver.' },
  { name: 'executor-delegates-to-authority', passed: /authority\.resolveConstraints/.test(executor) && /authority\.resolveRelations/.test(executor), detail: 'Runtime executor delegates constraint and generic relation execution to one injected authority.' },
  { name: 'behavior-kernel-does-not-call-solver-directly', passed: !/solveSemanticRelationsDetailed\s*\(/.test(behaviorKernel), detail: 'Scanner behavior-kernel facade no longer owns generic relation closure.' },
  { name: 'resource-mapping-consumers-use-runtime-interface', passed: resourceMappingConsumers.every(file => /semanticRewriteRuntimeExecutor/.test(file.content) && /executeRelations/.test(file.content) && !/createSemanticRewriteRuntimeExecutor/.test(file.content) && !/solveSemanticRelations\s*\(/.test(file.content)), detail: 'Resource mapping consumers use the canonical upstream runtime binding, do not instantiate per-consumer executors, and do not invoke the solver directly.' },
  { name: 'inventory-explicitly-preserves-unmigrated-frontiers', passed: markdown.includes('Other semantic producers remain migration frontiers.'), detail: 'The report does not claim the entire scanner has been purged of semantic reasoning.' },
];
const audit = { phase: 1550, title: 'Scanner reasoning inventory and upstream authority consolidation', passed: checks.filter(check => check.passed).length, total: checks.length, inventory: inventory.totals, checks };
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n');
for (const check of checks) process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}\n`);
process.stdout.write(`Inventory: ${inventory.totals.sourceFiles} files; ${inventory.totals.productionFilesWithDirectSolverCalls} production files with direct solver calls.\n`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
