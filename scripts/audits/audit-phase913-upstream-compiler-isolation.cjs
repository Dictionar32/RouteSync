const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const upstream = path.join(root, 'packages/core/src/types/upstream');
const forbiddenImport = /(?:from\s+['\"][^'\"]*compiler\/|import\s*\(\s*['\"][^'\"]*compiler\/)/;
const forbiddenNames = /\b(?:RouteDeclarationAst|ControllerMethodAst|ControllerParameterAst|ControllerParameterAttributeAst|ProviderSourceAst)\b/;

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.ts') && !full.includes(`${path.sep}__tests__${path.sep}`)) files.push(full);
  }
}
walk(upstream);

const compilerImports = [];
const concreteAstLeaks = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (forbiddenImport.test(text)) compilerImports.push(path.relative(root, file));
  if (forbiddenNames.test(text)) concreteAstLeaks.push(path.relative(root, file));
}

const ecomCandidates = [
  path.join(root, 'examples/ecomerce-shop-source'),
  path.join(root, 'examples/ecommerce-shop-source'),
];
const missingEcommerceFixtures = ecomCandidates.filter((candidate) => !fs.existsSync(candidate));

const result = {
  phase: 913,
  upstreamProductionFiles: files.length,
  upstreamCompilerImports: compilerImports,
  upstreamConcreteAstLeaks: concreteAstLeaks,
  compilerIsolationClean: compilerImports.length === 0 && concreteAstLeaks.length === 0,
  missingEcommerceFixtures: missingEcommerceFixtures.map((p) => path.relative(root, p)),
  fixturePolicy: 'do_not_invent_missing_ecommerce_fixture',
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.compilerIsolationClean) process.exitCode = 1;
