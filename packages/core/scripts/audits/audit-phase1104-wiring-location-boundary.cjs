const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const src = p => path.join(root, p);
const read = p => fs.readFileSync(src(p), 'utf8');
const exists = p => fs.existsSync(src(p));

const wiringFiles = [
  'src/compiler/scanner/wiring/routeManifestLowerer.ts',
  'src/compiler/scanner/wiring/routeManifestProjection.ts',
  'src/compiler/scanner/wiring/routeManifestProjectionInputs.ts',
  'src/compiler/scanner/wiring/routeManifestProjectionInterface.ts',
  'src/compiler/scanner/wiring/routeManifestTypeLowering.ts',
  'src/compiler/scanner/wiring/routeManifestTypeLoweringInterface.ts',
];
const legacyPaths = wiringFiles.map(p => p.replace('/wiring/', '/upstream/'));
const legacyUpstreamDir = src('src/compiler/scanner/upstream');
const projection = read(wiringFiles[1]);
const lowering = read(wiringFiles[4]);
const projectionInterface = read(wiringFiles[3]);
const lowerer = read(wiringFiles[0]);
const subscannerIndex = read('src/compiler/scanner/subscanners/index.ts');
const upstream = fs.readdirSync(src('src/types/upstream')).filter(x => x.endsWith('.ts'));
const upstreamTexts = upstream.map(x => read(`src/types/upstream/${x}`));
const checks = {
  wiringSurfaceExists: wiringFiles.every(exists),
  legacyPathsPreservedEmpty: legacyPaths.every(p => !exists(p)) && (!fs.existsSync(legacyUpstreamDir) || fs.readdirSync(legacyUpstreamDir).length === 0),
  projectionHasNoTypeDeriver: !projection.includes('TypeDeriver'),
  projectionBoundaryIsDirectional: projectionInterface.includes('InterfaceDependencyBoundary<RouteSyncManifest, RouteManifestProjection>'),
  loweringOwnsCompilerTypes: lowering.includes("from '../subscanners/RequestTypeDeriver'") && lowering.includes("from '../subscanners/SemanticTypeDeriver'") && lowering.includes('RequestTypeDeriver.derive') && lowering.includes('SemanticTypeDeriver.derive'),
  lowererConsumesProjection: lowerer.includes('projection: RouteManifestProjection') && lowerer.includes('projection.requestTypes') && lowerer.includes('projection.semanticTypes'),
  typeDeriverNotBarrelExported: !subscannerIndex.includes('export { TypeDeriver }'),
  upstreamNoCompilerImports: upstreamTexts.every(t => !/(from\s+['"][^'"]*(?:compiler|cli|sdk)[^'"]*['"])/.test(t)),
  upstreamDoesNotImportBoundary: upstreamTexts.every(t => !t.includes('InterfaceDependencyBoundary') && !t.includes('DataFlowProjectionInterface')),
};
console.log(JSON.stringify({...checks, PASSED: Object.values(checks).every(Boolean)}, null, 2));
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
