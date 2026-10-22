const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/laravelModelScanner.ts');
const sourceFilesPath = path.join(root, 'packages/core/src/compiler/scanner/sourceFiles.ts');
const oldScannerPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/ModelScanner.ts');
const exportsPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/index.ts');
const depsPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const sourceFiles = fs.readFileSync(sourceFilesPath, 'utf8');
const barrel = fs.readFileSync(exportsPath, 'utf8');
const deps = fs.readFileSync(depsPath, 'utf8');
const checks = [
  ['scanner implementation has a first-class compiler/scanner owner', fs.existsSync(scannerPath)],
  ['shared source acquisition is owned by compiler/scanner', fs.existsSync(sourceFilesPath) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/scannerUtils.ts'))],
  ['source acquisition no longer imports relation/foundation helpers', !/semantic\/relations|semantic\/foundation/.test(sourceFiles)],
  ['subscanner barrel no longer re-exports source acquisition utilities', !/collectPhpFiles.*sourceFiles|scannerUtils/.test(barrel)],
  ['legacy subscanner entrypoint is retired', !fs.existsSync(oldScannerPath)],
  ['legacy subscanner barrel no longer exports ModelScanner', !/export\s*\{\s*ModelScanner\s*\}\s*from/.test(barrel)],
  ['scanner exports the existing upstream interface as a typed operation', /export const laravelModelScanner:\s*LaravelModelScannerInterface\s*=\s*Object\.freeze/.test(scanner)],
  ['pipeline composition consumes the typed operation directly', /import \{ laravelModelScanner \} from "\.\.\/laravelModelScanner"/.test(deps) && /modelScanner:\s*laravelModelScanner/.test(deps)],
  ['model orchestration no longer imports relation helpers', !/semantic\/relations|semantic\/foundation/.test(scanner)],
  ['model orchestration no longer uses relation collection folds/projections', !/relationAsyncFold|relationProject/.test(scanner)],
  ['pipeline composition no longer adapts ModelScanner.scanCanonicalBundle', !/ModelScanner\.scanCanonicalBundle/.test(deps)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`RESULT ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
