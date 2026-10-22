const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const exists = (name) => fs.existsSync(path.join(root, name));
const packageJson = JSON.parse(read('package.json'));
const rootConfig = JSON.parse(read('tsconfig.json'));
const buildConfig = read('tsdown.config.ts');
const checks = [
  ['root declaration generation remains enabled', rootConfig.compilerOptions.declaration === true],
  ['root isolated declaration policy remains explicit', rootConfig.compilerOptions.isolatedDeclarations === true],
  ['tsdown is configured to emit declarations', /dts:\s*true/.test(buildConfig)],
  ['tsdown declaration generation uses the canonical root tsconfig', /tsconfig:\s*['"]tsconfig.json['"]/.test(buildConfig) && !/tsconfig:\s*['"]tsconfig.dts.json['"]/.test(buildConfig)],
  ['no phantom declaration config is required by this audit', !exists('tsconfig.dts.json')],
  ['build command is preserved', packageJson.scripts.build === 'tsdown'],
  ['audit script remains registered', packageJson.scripts['audit:phase1345-dts-generator-boundary'] === 'node scripts/audits/audit-phase1345-dts-generator-boundary.cjs'],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
if (failures > 0) process.exitCode = 1;
