const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const lowerer = read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInputs.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const resourceTypes = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const resourceScanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const channel = read('packages/core/src/types/upstream/channel.ts');
const channelProducer = read('packages/core/src/compiler/scanner/operations/channelProducer.ts');
const checks = [
  ['SourceDiscovery has a flat scanned readonly-array contract, with no Discovered<T> union', /export type SourceDiscovery<T>[\s\S]*kind: 'scanned'; readonly items: readonly T\[\]/.test(collections) && !/export type Discovered<T>|matchDiscovered|discovered_empty|discovered_many/.test(collections)],
  ['Source AST pipeline emits readonly arrays without sequence conversion', !/function sequence<T>/.test(pipeline) && !/sequence\(items\)/.test(pipeline) && /items: Object\.freeze\(\[\.\.\.items\]\)/.test(pipeline) && !/discovered_empty|discovered_many|\bSequence\s*</.test(pipeline)],
  ['Manifest lowerer contains no Sequence or collection conversion helper dependency', !/\bSequence\b|sequenceToArray|discoveredMany|matchDiscovered/.test(lowerer) && /discovery\.items/.test(lowerer)],
  ['Projection inputs consume discovery arrays directly', !/\bSequence\b|sequenceToArray|discoveredMany|matchDiscovered/.test(projection) && /discovery\.items/.test(projection)],
  ['Resource scanner response stores artifacts in readonly arrays', /items: readonly Artifact\[\]/.test(resourceTypes) && /items: resolvedArtifacts/.test(resourceScanner) && !/sequenceFromArray/.test(resourceScanner)],
  ['Channel semantic parameters are readonly arrays', /parameters: readonly RouteParameter\[\]/.test(channel) && /parameters: Object\.freeze\(\[\.\.\.input\.channel\.parameters\]\)/.test(channelProducer)],
  ['Targeted TypeScript files parse without syntax diagnostics', [lowerer, projection, pipeline, collections, resourceTypes, resourceScanner, channel, channelProducer].every((source, index) => { const file = ts.createSourceFile('audit' + index + '.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS); return file.parseDiagnostics.length === 0; })],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
console.log(`Phase 2768 collection-boundary audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
