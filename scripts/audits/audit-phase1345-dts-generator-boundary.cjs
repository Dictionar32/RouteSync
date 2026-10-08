const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const rootConfig = JSON.parse(read('tsconfig.json'));
const dtsConfig = JSON.parse(read('tsconfig.dts.json'));
const buildConfig = read('tsdown.config.ts');
const checks = [
  ['root strict isolated declarations remain enabled', rootConfig.compilerOptions.isolatedDeclarations === true],
  ['declaration-only config extends root config', dtsConfig.extends === './tsconfig.json'],
  ['declaration-only config disables isolated declaration transform', dtsConfig.compilerOptions.isolatedDeclarations === false],
  ['declaration-only config includes package source', dtsConfig.include.includes('packages/**/*.ts')],
  ['tsdown declaration generator avoids the missing TypeScript Go native binary', buildConfig.includes("generator: 'tsc'") && !buildConfig.includes("generator: 'tsgo'")],
  ['tsdown declaration generator uses declaration-specific tsconfig', buildConfig.includes("tsconfig: 'tsconfig.dts.json'")],
  ['build script preserved', typeof packageJson.scripts.build === 'string'],
  ['previous phase 1344 audit preserved', typeof packageJson.scripts['audit:phase1344-semantic-interface-wiring-and-bridge-exports'] === 'string'],
  ['audit script registered', packageJson.scripts['audit:phase1345-dts-generator-boundary'] === 'node scripts/audits/audit-phase1345-dts-generator-boundary.cjs'],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
if (failures > 0) process.exitCode = 1;
