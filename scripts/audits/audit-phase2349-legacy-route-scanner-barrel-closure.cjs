const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const barrel = read('packages/core/src/compiler/scanner/subscanners/index.ts');
const routeScanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const routeWiring = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeInterface = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const retirement = read('packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const checks = [
  ['legacy RouteScanner is no longer exported from internal subscanner barrel', !/export\s*\{\s*RouteScanner\s*\}\s*from\s*["']\.\/RouteScanner["']/.test(barrel)],
  ['legacy source file is retained rather than deleted', fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'))],
  ['canonical pipeline imports the existing wired route scanner', /import\s*\{\s*laravelRouteScanner\s*\}\s*from\s*["']\.\/laravelRouteScanner["']/.test(pipeline)],
  ['canonical pipeline dependency object uses the existing route scanner', /routeScanner:\s*laravelRouteScanner/.test(pipeline)],
  ['canonical scanner wiring is typed by LaravelRouteScannerInterface', /export\s+const\s+laravelRouteScanner:\s*LaravelRouteScannerInterface/.test(routeWiring)],
  ['existing scanner interface remains closed', /readonly\s+closed:\s*true/.test(routeInterface)],
  ['retirement map assigns route domain to existing upstream boundary', /upstreamBoundary:\s*'LaravelRouteScannerInterface'/.test(retirement)],
  ['retirement map requires all route consumers to use upstream judgment', /retirementCondition:\s*'all-route-consumers-use-upstream-route-evidence-and-binding-judgment'/.test(retirement)],
  ['no source-level RouteScanner import remains outside its own file or barrel', (() => {
    const roots = ['packages/core/src', 'packages/cli/src'];
    const matches = [];
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && /\.(ts|tsx|mts|cts)$/.test(entry.name) && !full.endsWith('/subscanners/RouteScanner.ts') && !full.endsWith('/subscanners/index.ts')) {
          const source = fs.readFileSync(full, 'utf8');
          if (/from\s*["'][^"']*subscanners\/RouteScanner["']|from\s*["'][^"']*subscanners["'][^\n]*RouteScanner/.test(source) || /new\s+RouteScanner\s*\(/.test(source)) matches.push(path.relative(root, full));
        }
      }
    };
    for (const dir of roots) walk(path.join(root, dir));
    return matches.length === 0;
  })()],
  ['legacy file is not silently represented as the canonical implementation', /export\s+class\s+RouteScanner/.test(routeScanner) && !routeWiring.includes("from '../subscanners/RouteScanner'")],
  ['no new foundation dependency in changed contract/wiring files', !/semantic\/foundation/.test(barrel + routeWiring + routeInterface)],
  ['no duplicate V2 route scanner contract introduced', !/LaravelRouteScannerInterfaceV2|RouteScannerV2/.test(barrel + routeWiring + routeInterface)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2349 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2349 audit failed');
