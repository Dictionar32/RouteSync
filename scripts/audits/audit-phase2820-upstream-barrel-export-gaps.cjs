const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../packages/core/src/types/upstream');
const barrelPath = path.join(root, 'index.ts');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const files = fs.readdirSync(root).filter((name) => name.endsWith('.ts') && name !== 'index.ts' && !name.startsWith('PHASE') && !name.includes('.test.'));
const gaps = files.filter((name) => {
  const stem = name.slice(0, -3);
  const source = fs.readFileSync(path.join(root, name), 'utf8');
  const hasExportedDeclaration = /^export\s+(?:interface|type|const|class|function|enum)\s+/m.test(source);
  const hasBarrelEntry = new RegExp("from\\s+['\\\"]\\./" + stem.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + "['\\\"]").test(barrel);
  return hasExportedDeclaration && !hasBarrelEntry;
});
const collectionsBytes = fs.statSync(path.join(root, 'collections.ts')).size;
console.log('Phase 2820 upstream barrel export gap inventory');
console.log(`Source modules with exported declarations but no direct upstream barrel entry: ${gaps.length}`);
for (const name of gaps) console.log(`  GAP ${name}`);
const required = [
  "from './routeConstraints'",
  "from './controllerDependencySemanticJudgmentInterface'",
  "from './controllerReturnSemanticProductionInterface'",
  "from './controllerProducerInterface'",
  "from './controllerRuntimeReturnProjectionInterface'",
  "from './laravelControllerInvocationResponseWiringInterface'",
  "from './laravelControllerRequestSemanticBindingInterface'",
  "from './requestProducerInterface'",
  "from './semanticKnowledgeEvidenceAdapterInterface'",
  "from './typeInternerInterface'",
  "from './controllerActionResponseReferenceJudgmentInterface'",
];
const missingTargeted = required.filter((entry) => !barrel.includes(entry));
console.log(`Targeted contract modules explicitly present: ${required.length - missingTargeted.length}/${required.length}`);
console.log(`collections.ts bytes: ${collectionsBytes}`);
if (missingTargeted.length || collectionsBytes !== 0) process.exitCode = 1;
