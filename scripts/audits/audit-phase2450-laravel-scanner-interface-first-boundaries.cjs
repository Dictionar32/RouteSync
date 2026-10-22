const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const sourceRoot = path.join(root, 'packages/core/src');
const files = [
  'compiler/scanner/wiring/laravelRouteScanner.ts',
  'compiler/scanner/upstream/routeDeclarationComposition.ts',
  'compiler/scanner/upstream/routeBoundaryEmitter.ts',
  'types/upstream/laravelRouteScannerInterface.ts',
  'types/upstream/resourceModelBindingSemanticInterface.ts',
  'compiler/semantic/resourceModelBindingAuthority.ts',
  'types/upstream/semanticRewriteAuthority.ts',
];
const findings = [];
const dependencyPattern = /(?:from\s*|import\s*\()(['"])([^'"]+)\1/g;

for (const relative of files) {
  const absolute = path.join(sourceRoot, relative);
  if (!fs.existsSync(absolute)) {
    findings.push({ file: relative, kind: 'missing_audit_target' });
    continue;
  }
  const source = fs.readFileSync(absolute, 'utf8');
  for (const match of source.matchAll(dependencyPattern)) {
    const specifier = match[2];
    if (specifier.includes('semantic/relations') || specifier.includes('semantic/foundation') || specifier.includes('subscanners')) {
      findings.push({ file: relative, kind: 'forbidden_dependency', specifier });
    }
  }
}

const report = {
  audit: 'phase2450_laravel_scanner_interface_first_boundaries',
  status: findings.length === 0 ? 'passed' : 'blocked',
  checkedFiles: files,
  findingCount: findings.length,
  findings,
  completedBoundaryMigration: [
    'resourceModelBindingSemanticInterface owns its closed rule/variable/pattern contract types and no longer imports implementation types from semantic/relations/semanticRewriteEngine',
  ],
  unresolvedBoundaryMigration: [
    'routeDeclarationComposition still obtains closure return semantics through controllerAstCanonical under subscanners',
    'resourceModelBindingAuthority and semanticRewriteAuthority still execute through semantic/relations; the type-only decoupling does not retire that engine',
  ],
  meaning: findings.length === 0
    ? 'The selected scanner path has no direct imports from relations, foundation, or subscanners; this does not establish repository-wide retirement.'
    : 'Migration remains blocked. Do not delete relations/foundation or claim scanner retirement until every listed dependency has an upstream-owned implementation and the full transitive path is verified.',
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (findings.length > 0) process.exitCode = 1;
