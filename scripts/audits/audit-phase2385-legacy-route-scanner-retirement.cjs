const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourceRoot = path.join(root, 'packages/core/src');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
});
const sourceFiles = walk(sourceRoot).filter(file => !file.includes(`${path.sep}docs${path.sep}`));
const source = sourceFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const assertions = [
  ['legacy RouteScanner implementation removed', !fs.existsSync(path.join(sourceRoot, 'compiler/scanner/operations/RouteScanner.ts'))],
  ['legacy subscanner routeProducer alias removed', !fs.existsSync(path.join(sourceRoot, 'compiler/scanner/operations/routeProducer.ts'))],
  ['tests consume canonical upstream routeProducer', read('packages/core/src/compiler/scanner/__test__/upstream-contracts/upstream-interface-elevation.phase52.test.ts').includes("from '../../../../types/upstream/routeProducer'") && read('packages/core/src/compiler/scanner/wiring/upstream-interface-elevation.phase52.test.ts').includes("from '../../../types/upstream/routeProducer'")],
  ['no import of deleted RouteScanner remains', !source.includes("operations/RouteScanner") && !source.includes("from './RouteScanner'") && !source.includes('from "./RouteScanner"')],
  ['no import of deleted compatibility routeProducer remains', !source.includes("operations/routeProducer'") && !source.includes('operations/routeProducer\"') && !source.includes("from './routeProducer'") && !source.includes('from "./routeProducer"')],
  ['canonical upstream producer remains the implementation owner', fs.existsSync(path.join(sourceRoot, 'types/upstream/routeProducer.ts'))],
];
for (const [name, pass] of assertions) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${assertions.filter(([, pass]) => pass).length}/${assertions.length}\n`);
if (assertions.some(([, pass]) => !pass)) process.exitCode = 1;
