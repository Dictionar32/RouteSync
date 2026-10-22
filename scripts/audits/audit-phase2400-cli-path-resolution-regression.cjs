const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sync = read('packages/cli/src/commands/sync.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const checks = [
  ['sync imports the Node path module before resolving route input', () => /import\s+path\s+from\s+['"]node:path['"]/.test(sync) && sync.includes('path.resolve(targetDir, options.input)')],
  ['sync does not reference an undeclared pathModule binding', () => !sync.includes('pathModule')],
  ['sync resolves invocation artifact from the CLI working directory', () => sync.includes("path.resolve(process.cwd(), 'routesync.invocations.json')")],
  ['sync resolves manifest and dataflow artifacts through the same imported path module', () => sync.includes("path.resolve(process.cwd(), 'routesync.manifest.json')") && sync.includes("path.resolve(process.cwd(), 'routesync.dataflow.json')") && sync.includes("path.resolve(process.cwd(), 'routesync.dataflow.ir.json')")],
  ['sync resolves IR artifact relative to its manifest destination', () => sync.includes("path.resolve(path.dirname(localManifestPath), 'routesync.ir.json')")],
  ['scan keeps output-relative invocation artifact behavior', () => scan.includes("path.resolve(path.dirname(outputPath), 'routesync.invocations.json')")],
  ['both CLI commands serialize the manifest-flow judgment without response reclassification', () => sync.includes('manifestFlow.invocationSemanticJudgments') && scan.includes('manifestFlow.invocationSemanticJudgments') && !sync.includes('response.kind ===') && !scan.includes('response.kind ===')],
  ['sync path resolution no longer relies on a runtime-only undeclared identifier', () => !/\bpathModule\s*\./.test(sync) && /import\s+path\s+from\s+['"]node:path['"]/.test(sync)],
];
let failed = 0;
for (const [name, run] of checks) {
  const ok = run();
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
