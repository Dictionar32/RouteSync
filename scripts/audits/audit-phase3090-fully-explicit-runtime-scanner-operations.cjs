const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const previousAudit = path.join(root, 'scripts/audits/audit-phase3089-fully-explicit-runtime-scanner-operations.cjs');
const result = spawnSync(process.execPath, [previousAudit], { cwd: root, encoding: 'utf8' });
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status || 1);
}
const audit = JSON.parse(result.stdout);
const reportPath = path.join(root, 'reports/PHASE3090_RUNTIME_EXPORT_INVENTORY.json');
fs.writeFileSync(reportPath, `${JSON.stringify({ ...audit, phase: 3090, title: 'Fully Explicit Simplicity Typed Runtime Scanner Operations — migration frontier' }, null, 2)}\n`);
process.stdout.write(JSON.stringify({
  phase: 3090,
  scanKind: audit.scanKind,
  exportedFunctionDeclarations: audit.exportedDeclarationInventory.exportedFunctionDeclaration.count,
  exportedArrowConstants: audit.exportedDeclarationInventory.exportedArrowConstant.count,
  repositoryWideExportConversion: false,
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
  report: 'reports/PHASE3090_RUNTIME_EXPORT_INVENTORY.json',
}, null, 2) + '\n');
