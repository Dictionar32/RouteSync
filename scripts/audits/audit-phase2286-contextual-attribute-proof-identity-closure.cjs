const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelAttributeScannerInterface.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'), 'utf8');
const producer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts'), 'utf8');
const checks = [
  ['phase 2286 proof contract has advanced to current version 7', /interface LaravelAttributeScannerInterface[\s\S]*?readonly contractVersion: 7;/.test(contract)],
  ['proof remains specialized to the canonical Laravel interface', /readonly value: 'Illuminate\\\\Contracts\\\\Container\\\\ContextualAttribute';/.test(contract)],
  ['proof retains the full resolved-name judgment', /readonly resolution: LaravelContextualAttributeContractResolution;/.test(contract)],
  ['proof does not duplicate declaration identity', !/readonly declarationIdentity:/.test(contract)],
  ['declaration evidence owns canonical class identity', /readonly qualifiedIdentity: PhpQualifiedClassName;/.test(contract)],
  ['interface source provenance remains mandatory', /readonly interfaceSource: SourceSpan;/.test(contract)],
  ['production pipeline is wired to the version 7 proof producer', /contractVersion: 7,[\s\S]*?scan: scanAttributeAsts,[\s\S]*?satisfies LaravelAttributeScannerInterface/.test(pipeline)],
  ['legacy short-name regex has been removed', !/implements\[\^\\\{\]\*\\bContextualAttribute\\b/.test(producer)],
  ['attribute producer does not import relations or foundation directly', !/semantic\/(?:foundation|relations)/.test(producer)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
