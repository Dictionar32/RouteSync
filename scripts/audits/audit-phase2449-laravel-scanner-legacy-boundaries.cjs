const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const sourceRoot = path.join(root, 'packages/core/src');
const routeFiles = [
  'compiler/scanner/wiring/laravelRouteScanner.ts',
  'compiler/scanner/upstream/routeDeclarationComposition.ts',
  'compiler/scanner/upstream/routeBoundaryEmitter.ts',
  'types/upstream/laravelRouteScannerInterface.ts',
  'types/upstream/resourceModelBindingSemanticInterface.ts',
];
const findings = [];

for (const relative of routeFiles) {
  const file = path.join(sourceRoot, relative);
  if (!fs.existsSync(file)) {
    findings.push({ file: relative, kind: 'missing_audit_target' });
    continue;
  }
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:from\s*|import\s*\()(['"])([^'"]+)\1/g)) {
    const specifier = match[2];
    if (specifier.includes('semantic/relations') || specifier.includes('semantic/foundation') || specifier.includes('operations')) {
      findings.push({ file: relative, kind: 'forbidden_dependency', specifier });
    }
  }
}

const compositionFile = path.join(sourceRoot, 'compiler/scanner/upstream/routeDeclarationComposition.ts');
if (fs.existsSync(compositionFile)) {
  const source = fs.readFileSync(compositionFile, 'utf8');
  if (source.includes('controllerAstCanonical')) {
    findings.push({
      file: 'compiler/scanner/upstream/routeDeclarationComposition.ts',
      kind: 'legacy_closure_semantic_producer',
      specifier: '../operations/controller/controllerAstCanonical',
    });
  }
}

const report = {
  audit: 'phase2449_laravel_scanner_legacy_boundaries',
  status: findings.length === 0 ? 'passed' : 'blocked',
  checkedFiles: routeFiles,
  findingCount: findings.length,
  findings,
  meaning: findings.length === 0
    ? 'The selected active route-scanner boundary has no direct imports from relations, foundation, or operations.'
    : 'Do not delete relations/foundation yet. Each listed dependency needs a semantic-owner migration; do not hide it by moving the import or fabricate absent judgments.',
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (findings.length > 0) process.exitCode = 1;
