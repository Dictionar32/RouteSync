import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'packages/core/src/compiler/scanner/StaticLaravelScanner.ts');
const source = fs.readFileSync(file, 'utf8');

const checks = {
  scannerResultMemoized: source.includes('let upstreamManifest: Promise<RouteSyncManifest> | undefined;'),
  executeUpstreamUsesMemo: /upstreamManifest \?\?= scanRouteSyncManifest\(sourceProject\)/.test(source),
  astUsesCanonicalExecution: /const manifest = await executeUpstream\(\);/.test(source),
  directSecondScanRemoved: (source.match(/scanRouteSyncManifest\(sourceProject\)/g) ?? []).length === 1,
  astCompatibilityRetained: source.includes("kind: 'manifest_ast'") && source.includes('definition: manifest'),
};

const passed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 841, audit: passed ? 'PASS' : 'FAIL', checks }, null, 2));
if (!passed) process.exit(1);
