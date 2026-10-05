const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', 'packages', 'core', 'src');
const upstream = path.join(root, 'types', 'upstream');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.ts')) files.push(file);
  }
}
walk(root);
const read = file => fs.readFileSync(file, 'utf8');
const isTest = file => /(^|\/)(__tests__|tests)(\/|\.)/.test(file) || /\.(spec|test)\.ts$/.test(file);
const rel = file => path.relative(path.resolve(__dirname, '..', '..'), file);
const declarations = [];
for (const file of files.filter(file => file.startsWith(upstream + path.sep))) {
  const source = read(file);
  const re = /export\s+(?:type|interface|const|function|class)\s+([A-Za-z_$][\w$]*)/g;
  let match;
  while ((match = re.exec(source))) declarations.push({ file, name: match[1] });
}
const productionFiles = files.filter(file => !isTest(file));
const external = declarations.map(item => {
  const references = productionFiles
    .filter(file => file !== item.file && !file.startsWith(upstream + path.sep))
    .filter(file => new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`).test(read(file)))
    .map(rel);
  const upstreamReferences = productionFiles
    .filter(file => file !== item.file && file.startsWith(upstream + path.sep))
    .filter(file => new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`).test(read(file)))
    .map(rel);
  return { ...item, externalProductionRefs: references, upstreamProductionRefs: upstreamReferences };
});
const candidates = external.filter(item => item.externalProductionRefs.length === 0);
const report = {
  phase: 874,
  principle: 'trace upstream producer -> canonical state -> downstream consumer; do not infer consumers from declarations alone',
  declarationCount: external.length,
  zeroExternalProductionReferenceCount: candidates.length,
  zeroExternalProductionReferences: candidates.map(item => ({
    file: rel(item.file),
    name: item.name,
    upstreamProductionRefs: item.upstreamProductionRefs,
  })),
  knownAuthorityPipelineGap: {
    authorityPipelineDefinition: 'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts',
    consumerCount: productionFiles.filter(file => file !== path.join(root, 'types/upstream/astSemanticAuthorityPipeline.ts') && read(file).includes('astSemanticAuthorityPipeline(')).length,
    createConsumerCount: productionFiles.filter(file => read(file).includes('createAstSemanticAuthorityPipeline(')).length,
    status: 'defined but not consumed by production compiler path',
  },
};
console.log(JSON.stringify(report, null, 2));
