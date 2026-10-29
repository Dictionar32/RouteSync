const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const authority = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const producerRelations = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const publicApi = read('packages/core/src/index.ts');
const checks = [
  ['resource authority consumes the existing canonical declaration evidence', /declaration: RouteDeclarationEvidence/.test(authority)],
  ['duplicate resource-only evidence contract is gone', !/RouteResourceDeclarationEvidence|route_resource_declaration_evidence/.test(authority + publicApi)],
  ['resource path is resolved by authority from canonical evidence', /input\.declaration\.path\.replace/.test(authority)],
  ['resource prefix is projected by authority from canonical evidence', /input\.declaration\.prefix\.map\(createRoutePath\)/.test(authority)],
  ['resource modifiers come from canonical declaration evidence', /input\.declaration\.resource/.test(authority)],
  ['scanner passes existing declaration evidence to authority', /routeDeclarationEvidenceFromAst\(declaration, file\)/.test(scanner) && /declaration: evidence/.test(scanner)],
  ['existing AST-to-evidence projection is shared with producer boundary', /export const routeDeclarationEvidenceFromAst/.test(producerRelations) && /routeDeclarationEvidenceFromAst\(declaration, file\)/.test(scanner)],
  ['authority does not import semantic foundation or relation', !/semantic\/(?:foundation|relation|relations)/.test(authority)],
  ['resource branch no longer builds registration in scanner', !/resourceRegistrationFromDeclaration\(declaration/.test(scanner)],
  ['no new parallel resource evidence type is publicly exported', !/RouteResourceDeclarationEvidence/.test(publicApi)],
];
let passed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
