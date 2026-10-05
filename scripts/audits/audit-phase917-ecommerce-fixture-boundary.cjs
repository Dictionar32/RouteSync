const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const testFile = path.join(root, 'packages/core/src/compiler/analysis/__tests__/ecommerceShopHighestAstDataflowPhase760.spec.ts');
const test = fs.readFileSync(testFile, 'utf8');
const forbiddenFixtureReads = [
  /readFileSync\([^\n]*examples\/ecommerce-shop-source/,
  /readFileSync\([^\n]*examples\/ecomerce-shop-source/,
  /process\.cwd\(\)\/examples\/(?:ecommerce|ecomerce)-shop-source/,
];
const violations = forbiddenFixtureReads.flatMap((pattern) => pattern.test(test) ? [pattern.source] : []);
const inlineCorpusPresent = ['requestSource', 'modelSource', 'resourceSource', 'controllerSource'].every(name => test.includes(`const ${name}`));
const clean = violations.length === 0 && inlineCorpusPresent;
console.log(JSON.stringify({ violations, inlineCorpusPresent, clean }, null, 2));
if (!clean) process.exit(1);
