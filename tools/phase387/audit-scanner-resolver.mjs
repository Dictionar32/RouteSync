import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('packages/core/src/compiler/scanner');
const forbidden = /\b(?:if|for|while|switch|map|filter|reduce|flatMap|undefined|null)\b|\?\?|===|!==|\bas\s+unknown\b/g;
const files = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
  const target = path.join(dir, entry.name);
  entry.isDirectory() ? walk(target) : target.endsWith('.ts') && files.push(target);
});
walk(root);
const rows = files.map(file => ({ file: path.relative(process.cwd(), file), violations: (fs.readFileSync(file, 'utf8').match(forbidden) ?? []).length }));
const clean = rows.filter(row => row.violations === 0).length;
const report = { phase: 387, scope: 'packages/core/src/compiler/scanner', files: rows.length, zeroViolationFiles: clean, violationFiles: rows.length - clean, totalViolations: rows.reduce((sum, row) => sum + row.violations, 0), rows };
fs.writeFileSync('tools/phase387/scanner-resolver-authority-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ phase: report.phase, files: report.files, zeroViolationFiles: report.zeroViolationFiles, violationFiles: report.violationFiles, totalViolations: report.totalViolations }, null, 2));
