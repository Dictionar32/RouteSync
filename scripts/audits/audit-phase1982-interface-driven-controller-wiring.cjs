const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const wiringPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationResponseWiringInterface.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['wiring is expressed as a TypeScript interface', wiring.includes('export interface LaravelControllerInvocationResponseWiringInterface<')],
  ['wiring binds the canonical controller artifact', wiring.includes('readonly artifact: Artifact;')],
  ['invocation projection is indexed from the artifact', wiring.includes("Artifact['invocationJudgment']")],
  ['response projection is indexed from the artifact and invocation subtype', wiring.includes("Artifact['responseJudgment']") && wiring.includes('LaravelControllerResponseSemanticJudgmentFor<Artifact[\'invocationJudgment\']>')],
  ['source correlation and outcome preservation are explicit', wiring.includes('sourceCorrelation:') && wiring.includes('outcomePreservation:')],
  ['wiring module contains no runtime values or implementations', !/^\s*(?:export\s+)?(?:const|function|class)\s/m.test(wiring)],
  ['retirement contract references the wiring interface', retirement.includes('readonly invocationResponseWiring: LaravelControllerInvocationResponseWiringInterface;')],
  ['public barrel exports wiring types only', barrel.includes("export type { LaravelControllerInvocationResponseWiringArtifact, LaravelControllerInvocationResponseWiringInterface } from './types/upstream/laravelControllerInvocationResponseWiringInterface';")],
  ['no relation/foundation or replacement subscanner introduced', !wiring.includes('semantic/relations') && !wiring.includes('semantic/foundation') && !wiring.includes('operations/')],
  ['no callable semantic authority is introduced', !wiring.includes('readonly wire:') && !wiring.includes('readonly connect:') && !wiring.includes('readonly analyze:')],
];
const report = {
  phase: 1982,
  title: 'Interface-driven controller wiring contract',
  scope: 'type/interface-only; no production runtime or wiring implementation edits',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
