const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const wiringPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationResponseWiringInterface.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const checks = [
  ['wiring edge is declared as a generic interface', wiring.includes('export interface LaravelControllerInvocationResponseWiringInterface<')],
  ['wiring operation is explicitly declared as a typed forward signature', /readonly forward:\s*<Candidate extends Artifact>\(/.test(wiring)],
  ['forwarding preserves the candidate artifact subtype in the result', wiring.includes('LaravelControllerInvocationResponseWiringResult<Candidate>')],
  ['result retains the canonical artifact', wiring.includes('readonly artifact: Artifact;')],
  ['invocation output is projected from the artifact-owned judgment', wiring.includes("Artifact['invocationJudgment']")],
  ['response output remains indexed to the same invocation subtype', wiring.includes("Artifact['responseJudgment']") && wiring.includes("LaravelControllerResponseSemanticJudgmentFor<Artifact['invocationJudgment']>")],
  ['outcome preservation and no-reclassification obligations are explicit', wiring.includes('outcomePreservation:') && wiring.includes('must not parse source')],
  ['wiring contract module has no runtime implementation values', !/^\s*(?:export\s+)?(?:const|function|class)\s/m.test(wiring)],
  ['retirement contract references the wiring interface', retirement.includes('readonly invocationResponseWiring: LaravelControllerInvocationResponseWiringInterface;')],
  ['retirement contract version advances to 10', retirement.includes('readonly version: 10;')],
  ['public barrel exports the result and interface as types', barrel.includes("export type { LaravelControllerInvocationResponseWiringArtifact, LaravelControllerInvocationResponseWiringInterface, LaravelControllerInvocationResponseWiringResult } from './types/upstream/laravelControllerInvocationResponseWiringInterface';")],
  ['no relation/foundation or replacement subscanner is introduced by the contract', !wiring.includes('semantic/relations') && !wiring.includes('semantic/foundation') && !wiring.includes('subscanners/')],
  ['trace confirms runtime migration gap instead of claiming it is solved', runtime.includes("from '../../../semantic/relations/") && !runtime.includes('responseJudgment:')],
];
const report = {
  phase: 1983,
  title: 'Interface-first controller wiring edge',
  scope: 'upstream interface/type and documentation only; runtime untouched',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
