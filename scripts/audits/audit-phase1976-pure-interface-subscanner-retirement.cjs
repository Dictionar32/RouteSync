const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const source = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['retirement module contains the domain ADT', source.includes('export type LaravelSubscannerRetirementDomain =')],
  ['retirement module contains the interface declaration', source.includes('export interface LaravelSubscannerRetirementInterface')],
  ['retirement module contains no runtime const declarations', !/^\s*(?:export\s+)?const\s/m.test(source)],
  ['retirement module contains no function or class implementation', !/^\s*(?:export\s+)?(?:function|class)\s/m.test(source)],
  ['runtime registry is removed from the module', !source.includes('LARAVEL_SUBSCANNER_RETIREMENT_CONTRACT')],
  ['runtime registry is not re-exported by package barrel', !barrel.includes("export { LARAVEL_SUBSCANNER_RETIREMENT_CONTRACT } from './types/upstream/laravelSubscannerRetirementInterface';")],
  ['existing type contract remains exported', barrel.includes("export type { LaravelSubscannerRetirementDomain, LaravelSubscannerRetirementInterface } from './types/upstream/laravelSubscannerRetirementInterface';")],
  ['no relation/foundation subscanner path introduced', !source.includes('subscanners/relation') && !source.includes('subscanners/foundation')],
];
const report = {
  phase: 1976,
  title: 'Pure interface subscanner retirement contract',
  scope: 'interface-only; no runtime/scanner/wiring edits',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
