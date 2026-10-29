const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const checks = [
  ['inventory closure takes one named input object', /interface InventoryClosureOperationInput\s*\{[\s\S]*?readonly inventoryResult:[\s\S]*?readonly routeSelection:[\s\S]*?readonly manifestBuilderPreparation:/m.test(source) && /close:\s*\(input: InventoryClosureOperationInput\)/m.test(source)],
  ['canonical project operation takes named input object', /interface CanonicalProjectCompositionOperationInput\s*\{[\s\S]*?readonly sourceProject:[\s\S]*?readonly routeSelection:[\s\S]*?readonly dependencies:/m.test(source) && /compose:\s*\(input: CanonicalProjectCompositionOperationInput\)/m.test(source)],
  ['discovered source continuation preserves named provenance fields', /interface DiscoveredSourcesContinuationOperationInput\s*\{[\s\S]*?readonly discoveredSources:[\s\S]*?readonly discoverySourceProject:[\s\S]*?readonly sourceProject:[\s\S]*?readonly routeSelection:[\s\S]*?readonly dependencies:/m.test(source) && /continue:\s*\(input: DiscoveredSourcesContinuationOperationInput\)/m.test(source)],
  ['complete document continuation preserves named provenance fields', /interface CompleteDocumentsContinuationOperationInput\s*\{[\s\S]*?readonly documents:[\s\S]*?readonly discoverySourceProject:[\s\S]*?readonly sourceProject:[\s\S]*?readonly routeSelection:[\s\S]*?readonly dependencies:/m.test(source) && /continue:\s*\(input: CompleteDocumentsContinuationOperationInput\)/m.test(source)],
  ['route selection reaches manifest builder input', /kind:\s*'manifest_builder_input',[\s\S]*?invocationInventoryReceipt:\s*validatedInventory\.receipt,[\s\S]*?routeSelection,/m.test(source)],
  ['inventory receipt only enters builder after validated continuation', /onValidated:\s*async validatedInventory[\s\S]*?invocationInventoryReceipt:\s*validatedInventory\.receipt/m.test(source)],
  ['terminal result continues through ADT operation', /fromManifestBuilderJudgment:\s*judgment\s*=>\s*judgment\.continueWith\(/m.test(source)],
  ['no exported function declarations in composition runtime file', !/^\s*export\s+function\s+/m.test(source)],
  ['collections.ts remains whitespace-only', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).toString().trim().length === 0],
  ['deleted relation foundations remain absent', !['relationMembership.ts','relationalSequence.ts','semanticRelations.ts'].some(name => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
];
const result = { phase: 3011, audit: 'manifest-runtime-provenance-named-input-context', passed: checks.filter(([, ok]) => ok).length, total: checks.length, checks: checks.map(([name, pass]) => ({ name, pass })) };
const output = path.join(root, 'PHASE3011_AUDIT.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.passed !== result.total) process.exitCode = 1;
