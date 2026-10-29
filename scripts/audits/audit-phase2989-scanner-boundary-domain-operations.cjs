const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, passed, detail = '') => checks.push({ name, passed: Boolean(passed), detail });

const boundary = read('packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts');
const boundaryInterface = read('packages/core/src/types/upstream/scannerStatementBoundaryInterface.ts');
const astRuntime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const packageJson = JSON.parse(read('package.json'));

check('boundary algebra has no deleted generic relation imports', !/from ['"][^'"]*(?:semanticRelations|relationalSequence|relationMembership)['"]/.test(boundary));
check('boundary runtime export is interface typed', /export const scannerStatementBoundaryContractAlgebra:\s*ScannerStatementBoundaryInterface\s*=\s*Object\.freeze/.test(boundary));
check('legacy boundary facade is interface typed', /export const scannerStatementBoundaryAlgebra:\s*StatementBoundaryAlgebra\s*=\s*Object\.freeze/.test(boundary));
check('exported boundary operations do not use exported function declarations', !/^export\s+function\s+/m.test(boundary));
check('delimiter lookup is a domain-owned continuation judgment', /type DelimiterLookup\s*=/.test(boundary) && /const delimiterLookup/.test(boundary) && /continueWith/.test(boundary));
check('terminator detection is a domain-owned judgment', /type TerminatorPosition\s*=/.test(boundary) && /const terminatorPosition/.test(boundary));
check('invalid cursor is represented by a continuation judgment', /type StartCursorJudgment\s*=/.test(boundary) && /const startCursorJudgment/.test(boundary));
check('public statement boundary contract is a closed judgment union', /export type StatementBoundaryJudgment<Token>\s*=/.test(boundaryInterface) && /kind: 'terminator'/.test(boundaryInterface) && /kind: 'end_of_input'/.test(boundaryInterface) && /kind: 'malformed'/.test(boundaryInterface));
check('PHP AST runtime consumes the canonical boundary algebra', /scannerStatementBoundaryContractAlgebra\.resolve/.test(astRuntime));
check('CLI scan consumes the composition manifest scan operation', /manifestScanOperation\.scan\(/.test(cliScan));
check('CLI scan operation is explicitly interface typed', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze/.test(cliOperation));
check('manifest composition continues the upstream manifest judgment', /judgment\.continueWith\(/.test(composition) && /ManifestBuilderJudgment/.test(composition));
check('deleted generic relation foundations remain absent', !exists('packages/core/src/semantic/relations/relationMembership.ts') && !exists('packages/core/src/semantic/relations/relationalSequence.ts') && !exists('packages/core/src/semantic/relations/semanticRelations.ts'));
check('Phase 2989 audit command is registered', packageJson.scripts?.['audit:phase2989-scanner-boundary-domain-operations'] === 'node scripts/audits/audit-phase2989-scanner-boundary-domain-operations.cjs');

const passed = checks.filter(item => item.passed).length;
const result = { phase: 2989, passed, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE2989_SCANNER_BOUNDARY_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}\n`);
process.stdout.write(`\nPhase 2989 audit: ${passed}/${checks.length} passed\n`);
if (passed !== checks.length) process.exitCode = 1;
