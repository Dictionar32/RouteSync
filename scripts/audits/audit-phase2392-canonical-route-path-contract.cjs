const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const routeEmitter = read('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts');
const producerRelations = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const allSource = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (entry.name.endsWith('.ts')) allSource.push({ file: relative, source: fs.readFileSync(path.join(root, relative), 'utf8') });
  }
};
walk('packages/core/src');
const noLegacyReference = !allSource.some(({ source }) => /routePathParser|ResolvedRoutePath|routeContextTracker|routeEmitter\.phase48/.test(source));
checks.push(['legacy path parser and context tracker have no source references', noLegacyReference]);
checks.push(['legacy path parser implementation retired', !exists('packages/core/src/compiler/scanner/operations/route-scanner/routePathParser.ts')]);
checks.push(['unused route context tracker retired', !exists('packages/core/src/compiler/scanner/operations/route-scanner/routeContextTracker.ts')]);
checks.push(['obsolete phase-48 test targeting removed API retired', !exists('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.phase48.test.ts')]);
checks.push(['route emitter consumes canonical upstream resolved-path ADT', routeEmitter.includes('ResolvedLaravelRoutePath') && routeEmitter.includes('types/upstream/routePathResolution')]);
checks.push(['route producer boundary projection consumes canonical upstream resolved-path ADT', producerRelations.includes('ResolvedLaravelRoutePath') && producerRelations.includes('types/upstream/routePathResolution')]);
checks.push(['route emitter still returns canonical RouteBoundaryContract', routeEmitter.includes('RouteBoundaryContract')]);
checks.push(['canonical upstream route-path authority remains the resolution owner', exists('packages/core/src/types/upstream/routePathResolutionAuthority.ts') && exists('packages/core/src/types/upstream/routePathResolution.ts')]);
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
