const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lowerer = path.join(root, 'src/compiler/scanner/upstream/routeManifestLowerer.ts');
const scanner = path.join(root, 'src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const source = fs.readFileSync(lowerer, 'utf8');
const scannerSource = fs.readFileSync(scanner, 'utf8');
const checks = {
  lowererImportsChannelScanner: /ChannelScanner/.test(source),
  lowererScansChannels: /ChannelScanner\.scan/.test(source),
  lowererReadsCanonicalChannelAsts: /manifest\.ast\.ast\.channels\.items/.test(source),
  sourceAstScannerCanonicalChannelScan: /ChannelScanner\.scanCanonicalAsts\(sourceProject\)/.test(scannerSource),
  lowererHasChannelProjection: /channelDescriptorsFromManifest/.test(source),
  lowererUsesForbiddenChannelTernary: /\?\s*false\s*:\s*true/.test(source),
};
const pass = !checks.lowererImportsChannelScanner && !checks.lowererScansChannels && checks.lowererReadsCanonicalChannelAsts && checks.sourceAstScannerCanonicalChannelScan && checks.lowererHasChannelProjection && !checks.lowererUsesForbiddenChannelTernary;
console.log(JSON.stringify({ phase: 840, pass, ...checks }, null, 2));
if (!pass) process.exit(1);
