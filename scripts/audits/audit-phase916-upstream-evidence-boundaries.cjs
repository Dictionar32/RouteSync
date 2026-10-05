const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const upstream = path.join(root, 'packages/core/src/types/upstream');
const producers = {
  controller: path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts'),
  provider: path.join(root, 'packages/core/src/compiler/scanner/subscanners/providerProducer.ts'),
};

const forbiddenCompilerImport = /(?:from\s+['"][^'"]*compiler\/|import\s*\(\s*['"][^'"]*compiler\/)/;
const concreteAstNames = /\b(?:RouteDeclarationAst|ControllerMethodAst|ControllerParameterAst|ControllerParameterAttributeAst|ProviderSourceAst|ProviderAttributeAst|ProviderMethodAst|AstIdentifier)\b/;

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.ts') && !full.includes(`${path.sep}__tests__${path.sep}`)) files.push(full);
  }
}
walk(upstream);

const upstreamCompilerImports = [];
const upstreamConcreteAstLeaks = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (forbiddenCompilerImport.test(text)) upstreamCompilerImports.push(path.relative(root, file));
  if (concreteAstNames.test(text)) upstreamConcreteAstLeaks.push(path.relative(root, file));
}

const producerLeaks = [];
for (const [name, file] of Object.entries(producers)) {
  const text = fs.readFileSync(file, 'utf8');
  if (concreteAstNames.test(text) || /controllerAstCanonical/.test(text)) producerLeaks.push(name);
}

const evidenceContracts = [
  'routeDeclarationEvidence.ts',
  'controllerEvidence.ts',
  'providerEvidence.ts',
].map(file => path.join(upstream, file));
const evidenceContractsPresent = evidenceContracts.every(fs.existsSync);
const application = fs.readFileSync(path.join(upstream, 'application.ts'), 'utf8');
const providerEvidenceStillEmbedded = /\bProviderSourceEvidence\b/.test(application);

const ecomCandidates = [
  path.join(root, 'examples/ecomerce-shop-source'),
  path.join(root, 'examples/ecommerce-shop-source'),
];
const missingEcommerceFixtures = ecomCandidates.filter(candidate => !fs.existsSync(candidate));

const result = {
  phase: 916,
  upstreamProductionFiles: files.length,
  upstreamCompilerImports,
  upstreamConcreteAstLeaks,
  producerConcreteAstLeaks: producerLeaks,
  evidenceContractsPresent,
  providerEvidenceStillEmbedded,
  missingEcommerceFixtures: missingEcommerceFixtures.map(p => path.relative(root, p)),
  fixturePolicy: 'do_not_invent_missing_ecommerce_fixture',
  clean: upstreamCompilerImports.length === 0 && upstreamConcreteAstLeaks.length === 0 && producerLeaks.length === 0 && evidenceContractsPresent && !providerEvidenceStillEmbedded,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.clean) process.exitCode = 1;
