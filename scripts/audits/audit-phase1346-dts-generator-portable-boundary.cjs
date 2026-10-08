const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const rootConfig = JSON.parse(read('tsconfig.json'));
const dtsConfig = JSON.parse(read('tsconfig.dts.json'));
const buildConfig = read('tsdown.config.ts');
const checks = [
  ['root isolated declarations policy remains unchanged', rootConfig.compilerOptions.isolatedDeclarations === true],
  ['declaration config extends root config', dtsConfig.extends === './tsconfig.json'],
  ['declaration config allows inferred declarations', dtsConfig.compilerOptions.isolatedDeclarations === false],
  ['declaration config includes package source', dtsConfig.include.includes('packages/**/*.ts')],
  ['declaration generator uses tsc instead of platform-specific tsgo binary', buildConfig.includes("generator: 'tsc'") && !buildConfig.includes("generator: 'tsgo'")],
  ['declaration generator uses dedicated tsconfig', buildConfig.includes("tsconfig: 'tsconfig.dts.json'")],
  ['build command preserved', typeof packageJson.scripts.build === 'string'],
  ['phase 1345 audit command preserved', packageJson.scripts['audit:phase1345-dts-generator-boundary'] === 'node scripts/audits/audit-phase1345-dts-generator-boundary.cjs'],
  ['phase 1346 audit command registered', packageJson.scripts['audit:phase1346-dts-generator-portable-boundary'] === 'node scripts/audits/audit-phase1346-dts-generator-portable-boundary.cjs'],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
if (failures > 0) process.exitCode = 1;
