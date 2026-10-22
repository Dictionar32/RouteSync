const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contracts = [
  ['laravelRouteScannerInterface.ts', 'laravel_route_scanner', 'LaravelRouteScannerInterface'],
  ['laravelControllerScannerInterface.ts', 'laravel_controller_scanner', 'LaravelControllerScannerInterface'],
  ['laravelModelScannerInterface.ts', 'laravel_model_scanner', 'LaravelModelScannerInterface'],
  ['laravelFormRequestScannerInterface.ts', 'laravel_form_request_scanner', 'LaravelFormRequestScannerInterface'],
  ['laravelResourceScannerInterface.ts', 'laravel_resource_scanner', 'LaravelResourceScannerInterface'],
  ['laravelChannelScannerInterface.ts', 'laravel_channel_scanner', 'LaravelChannelScannerInterface'],
];
const upstream = path.join(root, 'packages/core/src/types/upstream');
const barrel = fs.readFileSync(path.join(upstream, 'index.ts'), 'utf8');
const coreIndex = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const failures = [];
for (const [file, kind, name] of contracts) {
  const target = path.join(upstream, file);
  if (!fs.existsSync(target)) { failures.push(`${file}: missing`); continue; }
  const source = fs.readFileSync(target, 'utf8');
  if (!source.includes(`readonly kind: '${kind}'`)) failures.push(`${file}: missing domain kind`);
  if (!source.includes('readonly closed: true')) failures.push(`${file}: missing closed contract marker`);
  if (!source.includes(`interface ${name}`)) failures.push(`${file}: missing interface ${name}`);
  if (!source.includes('readonly scan:')) failures.push(`${file}: missing scan operation`);
  if (!barrel.includes(`'./${file.replace(/\.ts$/, '')}'`)) failures.push(`${file}: not exported by upstream barrel`);
  if (!coreIndex.includes(`./types/upstream/${file.replace(/\.ts$/, '')}`)) failures.push(`${file}: not exported by core entrypoint`);
  if (/\bany\b/.test(source)) failures.push(`${file}: contains any`);
}
const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner/subscanners');
for (const name of ['RouteScanner.ts','ControllerScanner.ts','ModelScanner.ts','FormRequestScanner.ts','ResourceScanner.ts','ChannelScanner.ts']) {
  if (!fs.existsSync(path.join(scannerRoot, name))) failures.push(`${name}: legacy implementation unexpectedly missing before wiring cutover`);
}
if (failures.length) {
  console.error('Phase 1696 interface-first audit: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Phase 1696 interface-first audit: PASS (6 closed contracts; public exports verified; legacy scanners intentionally retained pending wiring migration)');
}
