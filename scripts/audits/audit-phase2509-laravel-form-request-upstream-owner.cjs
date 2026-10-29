const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const scanner = 'packages/core/src/compiler/scanner/laravelFormRequestScanner.ts';
const producer = 'packages/core/src/compiler/scanner/operations/requestProducer.ts';
const wiring = 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts';
const upstream = 'packages/core/src/types/upstream/laravelFormRequestScannerInterface.ts';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['new scanner owner exists', fs.existsSync(path.join(root, scanner))],
  ['wiring selects new scanner owner', read(wiring).includes('from "../laravelFormRequestScanner"') && read(wiring).includes('formRequestScanner: laravelFormRequestScanner') && read(scanner).includes('export const laravelFormRequestScanner: LaravelFormRequestScannerInterface')],
  ['active wiring does not import legacy FormRequestScanner barrel', !read(wiring).includes('from "../operations"')],
  ['producer implementation is outside operations', fs.existsSync(path.join(root, producer))],
  ['producer uses upstream producer interface', read(producer).includes('RequestProducerInterface') && read(producer).includes('RequestProducerInput')],
  ['upstream scanner contract remains authoritative', read(upstream).includes('interface LaravelFormRequestScannerInterface') && read(upstream).includes('LaravelFormRequestScanInput')],
  ['migrated scanner has no direct semantic/foundation import', !read(scanner).includes('semantic/foundation')],
  ['migrated producer has no direct semantic/foundation import', !read(producer).includes('semantic/foundation')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const relationFiles = [scanner, producer,
  'packages/core/src/compiler/scanner/operations/requestAstCanonical.ts',
  ...fs.readdirSync(path.join(root, 'packages/core/src/compiler/scanner/operations/form-request')).map(name => `packages/core/src/compiler/scanner/operations/form-request/${name}`)
].filter(file => fs.existsSync(path.join(root, file)) && read(file).includes('semantic/relations'));
console.log(`INFO migrated FormRequest path still has direct semantic/relations imports in ${relationFiles.length} files`);
console.log('INFO this audit checks ownership/wiring and direct imports only; it does not prove transitive relation/foundation closure or runtime behavior');
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
