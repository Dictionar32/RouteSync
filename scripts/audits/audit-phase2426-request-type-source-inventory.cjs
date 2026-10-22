const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const producer = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const checks = [
  ['inventory operation is declared upstream', /interface RequestTypeDerivationSourceEvidenceInventoryInterface/.test(contract)],
  ['inventory consumes canonical RequestTypeDerivationInput', /inventory: \(input: RequestTypeDerivationInput\)/.test(contract)],
  ['route evidence preserves canonical declaration span', /span: route\.provenance\.declarationSpan/.test(producer)],
  ['resource evidence preserves AST source span', /span: resource\.source/.test(producer)],
  ['request evidence preserves AST source span', /span: request\.source/.test(producer)],
  ['occurrence keys derive from source coordinates, not traversal order', /sourceSpanIdentity\(file, start, end\)/.test(producer) && !/map\(\(.*index/.test(producer)],
  ['inventory does not import relation/foundation semantic helpers', !/semantic\/(relations|foundation)/.test(producer)],
  ['inventory does not claim judgment or proof production', !/RequestTypeDerivationJudgment|RequestTypeDerivationProof|verifiedLaws/.test(producer)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
