const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const compositionPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const checks = [
  ['route evidence conversion requires explicit producer input', /function routeDeclarationEvidenceFromAst\([\s\S]*?returnSemanticProduction: ControllerReturnSemanticProductionInterface/.test(composition)],
  ['route composition no longer imports controller subscanner directly', !/from ['"][^'"]*subscanners\/controller\/controllerAstCanonical['"]/.test(composition)],
  ['closure return production is invoked through injected contract', /returnSemanticProduction\.produce\(Object\.freeze\(/.test(composition)],
  ['active wiring no longer imports the legacy producer', !/from ['"][^'"]*subscanners\/controller\/controllerAstCanonical['"]/.test(wiring)],
  ['route scanner injects the upstream producer authority', /routeDeclarationEvidenceFromAst\(declaration, file, controllerReturnSemanticProductionAuthority\)/.test(wiring)],
  ['runtime execute remains parameterless', /async execute\(\)/.test(wiring)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed; closure-return producer is migrated off the direct legacy import.`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
