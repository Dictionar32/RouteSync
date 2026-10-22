const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const passed = [];
const has = (file, pattern, label) => pattern.test(read(file)) ? passed.push(label) : failures.push(`${file}: missing ${label}`);
const lacks = (file, pattern, label) => pattern.test(read(file)) ? failures.push(`${file}: forbidden ${label}`) : passed.push(label);
has('packages/core/src/types/upstream/semanticReconciliation.ts', /interface\s+SemanticReconciliationAlgebraInterface/, 'reconciliation algebra is declared in the type contract');
has('packages/core/src/types/upstream/semanticReconciliation.ts', /type\s+RelationApplicability\s*=\s*[\s\S]*unsupported_relation/, 'applicability is a closed ADT');
has('packages/core/src/types/upstream/semanticReconciliationAlgebra.ts', /semanticReconciliationAlgebra:\s*SemanticReconciliationAlgebraInterface/, 'one canonical algebra implements the contract');
for (const method of ['applicability', 'candidates', 'canonicalKey', 'status', 'effectiveKey', 'schemaEvidence']) {
  has('packages/core/src/types/upstream/semanticReconciliationAlgebra.ts', new RegExp(`\\b${method}\\b`), `algebra owns ${method} reasoning`);
}
for (const forbidden of [/const candidatesFor\s*=/, /const canonicalKey\s*=\s*\(relation/, /const status\s*=\s*\(/, /supportedDirectForeignKeyRelation/, /matches\.length\s*[><=]/]) {
  lacks('packages/core/src/types/upstream/semanticReconciliationAuthority.ts', forbidden, `authority does not reimplement ${String(forbidden)}`);
}
has('packages/core/src/types/upstream/semanticReconciliationAuthority.ts', /semanticReconciliationAlgebra\.candidates\(evidence\)/, 'authority consumes algebra candidate judgment');
has('packages/core/src/types/upstream/semanticReconciliationAuthority.ts', /semanticReconciliationAlgebra\.status\(relation, applicability, matches\)/, 'authority consumes algebra status judgment');
has('packages/core/src/types/upstream/semanticReconciliationAuthority.ts', /semanticReconciliationAlgebra\.effectiveKey\(relation, status, canonicalKey\)/, 'authority consumes algebra key judgment');
has('packages/core/src/types/upstream/index.ts', /semanticReconciliationAlgebra/, 'public upstream boundary exposes the canonical algebra');
lacks('packages/core/src/compiler/scanner/semantic/model/modelSemanticDefinition.ts', /candidatesFor|canonicalKey\(|matches\.length/, 'model semantic builder does not duplicate reconciliation decisions');
const result = { audit: 'phase1351-semantic-reconciliation-algebra', passed: failures.length === 0, passedChecks: passed.length, failures };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
