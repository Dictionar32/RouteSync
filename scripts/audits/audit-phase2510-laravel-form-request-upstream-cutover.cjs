const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition, evidence) => checks.push({ name, passed: Boolean(condition), evidence });

const scannerPath = 'packages/core/src/compiler/scanner/laravelFormRequestScanner.ts';
const producerPath = 'packages/core/src/compiler/scanner/operations/requestProducer.ts';
const internerPath = 'packages/core/src/compiler/types/TypeInterner.ts';
const upstreamInternerPath = 'packages/core/src/types/upstream/typeInternerInterface.ts';
const producerContractPath = 'packages/core/src/types/upstream/requestProducerInterface.ts';
const wiringPath = 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts';

const scanner = read(scannerPath);
const producer = read(producerPath);
const interner = read(internerPath);
const upstreamInterner = read(upstreamInternerPath);
const producerContract = read(producerContractPath);
const wiring = read(wiringPath);

check('FormRequest scanner is explicitly typed by its upstream interface',
  /export const laravelFormRequestScanner:\s*LaravelFormRequestScannerInterface/.test(scanner), scannerPath);
check('Active FormRequest scanner has no direct relations/foundation imports',
  !/semantic\/(?:relations|foundation)\//.test(scanner), scannerPath);
check('Active request producer has no direct relations/foundation imports',
  !/semantic\/(?:relations|foundation)\//.test(producer), producerPath);
check('TypeInterner implementation has no direct relations/foundation imports',
  !/semantic\/(?:relations|foundation)\//.test(interner), internerPath);
check('TypeInterner contract is upstream-owned',
  /export interface TypeInternerInterface/.test(upstreamInterner) && /TypeInternerInterface/.test(interner), upstreamInternerPath);
check('Request producer contract no longer imports concrete TypeInterner implementation',
  !/compiler\/types\/TypeInterner/.test(producerContract) && /TypeInternerInterface/.test(producerContract), producerContractPath);
check('Active wiring uses the typed FormRequest scanner directly',
  /import \{ laravelFormRequestScanner \} from "\.\.\/laravelFormRequestScanner"/.test(wiring) && /formRequestScanner:\s*laravelFormRequestScanner/.test(wiring), wiringPath);
check('Active wiring no longer imports legacy FormRequestScanner',
  !/subscanners\/FormRequestScanner|\{\s*FormRequestScanner\s*\}\s*from\s*["']\.\.\/subscanners/.test(wiring), wiringPath);

const unresolved = [
  'Request producer input is still parser-evidence-shaped; concrete evidence types are supplied at the scanner composition boundary.',
  'requestAstCanonical.ts and operations/form-request/* still directly import semantic/relations.',
  'TypeHasher.ts still imports semantic/relations; therefore the transitive TypeInterner dependency closure is not relation-free.',
  'The active Laravel pipeline still imports legacy subscanners for response, schema, migration, DTO, query, service, middleware, and provider.',
];

for (const result of checks) {
  process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name} — ${result.evidence}\n`);
}
process.stdout.write(`\nFocused assertions: ${checks.filter(item => item.passed).length}/${checks.length}\n`);
process.stdout.write('Known unresolved architecture debt:\n');
for (const item of unresolved) process.stdout.write(`- OPEN: ${item}\n`);

const reportPath = path.join(root, 'PHASE2510_LARAVEL_FORM_REQUEST_UPSTREAM_CUTOVER_AUDIT.json');
fs.writeFileSync(reportPath, JSON.stringify({ phase: 2510, checks, unresolved }, null, 2) + '\n');
if (checks.some(item => !item.passed)) process.exitCode = 1;
