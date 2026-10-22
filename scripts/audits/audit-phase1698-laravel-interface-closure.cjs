const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [
  ['route interface returns closed judgment, not AST-only output', () => {
    const s = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
    return s.includes('Promise<LaravelRouteScanJudgment>') && s.includes("kind: 'laravel_route_scan_judgment'") && s.includes('readonly asts: readonly RouteAst[]') && s.includes('readonly flows: readonly RouteSemanticFlow[]');
  }],
  ['FormRequest judgment preserves source evidence for controller derivation', () => {
    const s = read('packages/core/src/types/upstream/laravelFormRequestScannerInterface.ts');
    return s.includes("import type { FormRequestSource } from '../domain/request'") && s.includes('readonly sources: readonly FormRequestSource[]') && s.includes('readonly definitions: readonly RequestDefinition[]');
  }],
  ['controller contract accepts source-backed FormRequest evidence', () => read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').includes('readonly formRequests: readonly FormRequestSource[]')],
  ['route judgment exported through public package barrel', () => read('packages/core/src/index.ts').includes('LaravelRouteScanJudgment')],
  ['legacy scanners remain until interface wiring and consumer migration', () => ['RouteScanner','ControllerScanner','ModelScanner','FormRequestScanner','ResourceScanner','ChannelScanner'].every(n => fs.existsSync(path.join(root, `packages/core/src/compiler/scanner/subscanners/${n}.ts`)))],
  ['no semantic foundation dependency introduced by interface changes', () => !['packages/core/src/types/upstream/laravelRouteScannerInterface.ts','packages/core/src/types/upstream/laravelFormRequestScannerInterface.ts'].some(p => read(p).includes('semantic/foundation'))],
];
let failed = 0;
for (const [name, check] of checks) {
  let ok = false;
  try { ok = Boolean(check()); } catch { ok = false; }
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} PASS\n`);
process.exitCode = failed ? 1 : 0;
