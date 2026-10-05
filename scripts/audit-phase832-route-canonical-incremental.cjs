const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'packages', 'cli', 'src');
const packages = path.join(root, 'packages');

function files(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) out.push(...files(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const production = files(cli);
const allProduction = files(packages).filter(p => !p.includes(`${path.sep}tests${path.sep}`) && !p.includes(`${path.sep}__tests__${path.sep}`));
const text = p => fs.readFileSync(p, 'utf8');
const rel = p => path.relative(root, p).replace(/\\/g, '/');

const legacyFactoryRefs = production
  .filter(p => /RouteSemanticFlowFactory|scannedRouteDescriptor|scannedManifestDescriptor/.test(text(p)))
  .map(rel);

const activeIncrementalRefs = production
  .filter(p => /utils\/incremental/.test(text(p)))
  .map(rel);

const preserved = [
  'packages/cli/src/utils/incremental/descriptors/scannedRouteDescriptor.ts',
  'packages/cli/src/utils/incremental/descriptors/scannedManifestDescriptor.ts'
].map(p => ({ path: p, exists: fs.existsSync(path.join(root, p)), bytes: fs.existsSync(path.join(root, p)) ? fs.statSync(path.join(root, p)).size : -1 }));

const coreFactory = path.join(root, 'packages/core/src/compiler/scanner/descriptors/route/RouteSemanticFlowFactory.ts');
const coreFactoryRefs = allProduction
  .filter(p => p !== coreFactory && /RouteSemanticFlowFactory/.test(text(p)))
  .map(rel);

const canonicalImports = production
  .filter(p => /@routesync\/core/.test(text(p)) && /RouteSemanticFlow/.test(text(p)))
  .map(rel);

const result = {
  phase: 832,
  canonicalRouteAuthority: 'packages/core/src/types/domain/routes.ts::RouteSemanticFlow',
  activeIncrementalEntrypoints: activeIncrementalRefs,
  legacyFactoryProductionRefs: legacyFactoryRefs,
  coreLegacyFactoryExternalRefs: coreFactoryRefs,
  preservedLegacyDescriptors: preserved,
  canonicalCliConsumers: canonicalImports,
  legacyFactoryReachabilityClosed: legacyFactoryRefs.length === 0 && coreFactoryRefs.length === 0,
  preservedLegacyFilesEmpty: preserved.every(x => x.exists && x.bytes === 0),
  recommendation: 'Keep legacy route descriptor files preserved and empty; route semantics remain owned by core RouteSemanticFlow/RouteManifest.'
};

console.log(JSON.stringify(result, null, 2));
if (!result.legacyFactoryReachabilityClosed || !result.preservedLegacyFilesEmpty) process.exitCode = 1;
