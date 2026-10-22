const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const guard = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');

const routeCoordinates = guard.slice(guard.indexOf("case 'route': {", guard.indexOf('const sourceOccurrenceInputMembership')), guard.indexOf("case 'resource': {", guard.indexOf('const sourceOccurrenceInputMembership')));
assert('route source occurrence compares sourceFile identity against original input', routeCoordinates.includes('candidate.provenance.sourceFile.value.value === source.source.provenance.sourceFile.value.value'));
assert('route source occurrence compares sourceLine identity against original input', routeCoordinates.includes('candidate.provenance.sourceLine.value === source.source.provenance.sourceLine.value'));
assert('route source occurrence still binds canonical semantic identity and declaration span', routeCoordinates.includes('identity.semanticKey === source.semanticKey') && routeCoordinates.includes('span.file.value.value === sourceSpan.file.value.value') && routeCoordinates.includes('span.start.value === sourceSpan.start.value') && routeCoordinates.includes('span.end.value === sourceSpan.end.value'));
assert('canonical occurrence identity derives from source coordinates, not traversal order', inventory.includes('sourceSpanIdentity(span.file.value.value, span.start.value, span.end.value)') && !inventory.includes('index.toString()'));
assert('canonical semantic law inventory remains the single upstream contract', (contract.match(/  '[a-z_]+',/g) || []).length >= 34 && contract.includes('RequestTypeDerivationRequiredLawCoverage'));
assert('CLI scan and sync resolve the upstream semantic pipeline before source acquisition', cliScan.indexOf('requestTypeDerivationSemanticPipelineResolution.resolve(') >= 0 && cliScan.indexOf('requestTypeDerivationSemanticPipelineResolution.resolve(') < cliScan.indexOf('createLaravelSourceProjectIdentity(targetDir)') && cliSync.indexOf('requestTypeDerivationSemanticPipelineResolution.resolve(') >= 0 && cliSync.indexOf('requestTypeDerivationSemanticPipelineResolution.resolve(') < cliSync.indexOf('createLaravelSourceProjectIdentity(targetDir)'));

for (const check of checks) process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}\n`);
process.stdout.write(`\nPhase 2559: ${checks.filter(check => check.passed).length}/${checks.length} structural assertions passed.\n`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
