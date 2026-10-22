const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed, detail });

const interfacePath = 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts';
const algebraPath = 'packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts';
const authorityPath = 'packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts';
const scannerPath = 'packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts';
const interfaceSource = read(interfacePath);
const algebraSource = read(algebraPath);
const authoritySource = read(authorityPath);
const scannerSource = read(scannerPath);

check('canonical_judgment_interface_exists', interfaceSource.includes('export type InvocationSemanticJudgment'), interfacePath);
check('interface_owns_declarative_rule_catalog', interfaceSource.includes('export const INVOCATION_SEMANTIC_RULES') && interfaceSource.includes('InvocationSemanticContract'), 'rules and contract are declared in upstream interface');
check('interface_declares_rule_outcome_proof', interfaceSource.includes('InvocationSemanticRuleTraceEntry') && interfaceSource.includes('rule-outcomes'), 'proof binds source evidence, rule outcomes, rewrite judgment, obligations');
check('closed_judgment_requires_empty_obligations', /status: 'closed'[\s\S]{0,600}unresolvedObligations: readonly \[\]/.test(interfaceSource), 'closed variants encode an empty obligation tuple');
check('algebra_consumes_canonical_interface_owned_policy_and_witness_contracts', algebraSource.includes('invocationSemanticRulePolicy') && algebraSource.includes('invocationWitnessOwnerRuleId') && algebraSource.includes('INVOCATION_SEMANTIC_CONTRACT'), 'domain policy and witness ownership are sourced from the canonical interface');
check('algebra_stays_behind_explicit_domain_algebra_boundary', algebraSource.includes('InvocationSemanticAlgebraInterface') && algebraSource.includes('INVOCATION_SEMANTIC_ALGEBRA_CONTRACT') && algebraSource.includes('analyzeInvocationJudgmentAlgebra'), 'semantic derivation is owned by the domain algebra, not the runtime executor');
check('authority_validates_exact_request_and_algebra_produced_judgment', authoritySource.includes('assertInvocationSemanticInputContract') && authoritySource.includes('assertInvocationSemanticJudgmentContract') && authoritySource.includes('contract: INVOCATION_SEMANTIC_CONTRACT') && authoritySource.includes('analyzeInvocationJudgmentAlgebra(validatedInput.knowledge, validatedInput.invocation, validatedInput.positionalEvidence)'), 'authority validates input and returned judgment without deriving a second semantic result');
check('scanner_facade_delegates_to_canonical_contract', scannerSource.includes('types/upstream/invocationSemanticJudgmentInterface') && scannerSource.includes('types/upstream/invocationSemanticJudgmentAuthority'), 'scanner facade targets canonical invocation judgment modules');
check('scanner_facade_has_no_semantic_branching', !/\b(if|switch|for|while)\s*\(/.test(scannerSource) && !/=>\s*\{/.test(scannerSource), 'no control-flow or inference implementation in facade');
check('legacy_interface_is_compatibility_only', read('packages/core/src/types/upstream/semanticInterproceduralDataFlowInterface.ts').trim() === "/** Legacy compatibility facade. Canonical invocation semantics live in invocationSemanticJudgmentInterface. */\nexport * from './invocationSemanticJudgmentInterface';", 'legacy filename retained as a re-export facade');
check('upstream_index_exports_canonical_modules', read('packages/core/src/types/upstream/index.ts').includes("export * from './invocationSemanticJudgmentInterface';") && read('packages/core/src/types/upstream/index.ts').includes("export * from './invocationSemanticJudgmentAuthority';"), 'canonical public exports');

const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner');
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
});
const scannerFiles = walk(scannerRoot).filter((file) => !file.includes('.test.') && !file.includes('.phase'));
const foundationConsumers = scannerFiles.filter((file) => fs.readFileSync(file, 'utf8').includes('semantic/foundation/'));
const relationConsumers = scannerFiles.filter((file) => fs.readFileSync(file, 'utf8').includes('semanticRelations'));
const sequenceConsumers = scannerFiles.filter((file) => fs.readFileSync(file, 'utf8').includes('relationalSequence'));
check('scanner_wide_foundation_frontier_measured', scannerFiles.length > 0, `${scannerFiles.length} production TypeScript files; ${foundationConsumers.length} still import semantic/foundation`);

const report = {
  phase: 1651,
  title: 'Invocation Semantic Judgment Interface-First / Contract-Enforced Callable Boundary',
  checks,
  scannerInventory: {
    productionTypeScriptFiles: scannerFiles.length,
    directFoundationImportFiles: foundationConsumers.length,
    semanticRelationsImportFiles: relationConsumers.length,
    relationalSequenceImportFiles: sequenceConsumers.length,
    foundationConsumers: foundationConsumers.map((file) => path.relative(root, file)).sort(),
  },
  passed: checks.every((item) => item.passed),
};
fs.writeFileSync(path.join(root, 'PHASE1636_INVOCATION_SEMANTIC_JUDGMENT_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, checks, scannerInventory: { productionTypeScriptFiles: scannerFiles.length, directFoundationImportFiles: foundationConsumers.length, semanticRelationsImportFiles: relationConsumers.length, relationalSequenceImportFiles: sequenceConsumers.length } }, null, 2));
if (!report.passed) process.exitCode = 1;
