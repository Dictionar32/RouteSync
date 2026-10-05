const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const files = {
  controller: path.join(root, 'packages/core/src/types/upstream/controller.ts'),
  canonical: path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts'),
  producer: path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts'),
  scanner: path.join(root, 'packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts'),
  test: path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerMethodContract.phase894.test.ts'),
};
const text = Object.fromEntries(Object.entries(files).map(([k, file]) => [k, fs.readFileSync(file, 'utf8')]));
const checks = {
  controllerAttributeScopeClosed: text.controller.includes("ControllerMethodAttributeScope") && text.controller.includes("kind: 'class'") && text.controller.includes("kind: 'method'"),
  canonicalProjectsClassScope: text.canonical.includes("scope: { kind: 'class' as const }") && text.canonical.includes("scope: { kind: 'method' as const }"),
  canonicalUsesRelationalFold: text.canonical.includes('relationFoldRight(classAttributes, sequence(methodAttributes)'),
  producerCarriesDeclarationAttributes: text.producer.includes('controllerAttributes:'),
  scannerPassesDeclarationAttributes: text.scanner.includes('controllerAttributes: declaration.attributes'),
  regressionTestCoversScope: text.test.includes("scope).toEqual({ kind: 'class' })") && text.test.includes("scope).toEqual({ kind: 'method' })"),
  noHostAttributeMerge: !text.canonical.includes('[...classAttributes, ...methodAttributes]'),
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const result = { phase: 896, checks, allPassed: failed.length === 0, failed };
console.log(JSON.stringify(result, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
