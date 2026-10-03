const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const productionFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== '__archive__' && entry.name !== 'dist' && entry.name !== 'node_modules') walk(full);
    } else if (entry.name.endsWith('.ts')) productionFiles.push(full);
  }
}
walk(path.join(root, 'packages/core/src'));
const parsedColumnRefs = productionFiles.filter(file => /\bParsedColumn\b/.test(fs.readFileSync(file, 'utf8'))).map(file => path.relative(root, file));
const semanticKnowledge = read('packages/core/src/types/semantic/semanticKnowledge.ts');
const modelGraph = read('packages/core/src/types/semantic/modelGraphTypes.ts');
const serviceGraph = read('packages/core/src/types/semantic/serviceGraphTypes.ts');
const modelNodes = read('packages/core/src/semantic/modelNodes.ts');
const checks = {
  executionLayerCanonicalOwner: modelGraph.includes('export type ExecutionLayer =') && !serviceGraph.includes('export type ExecutionLayer ='),
  semanticKnowledgeUsesCanonicalOwner: semanticKnowledge.includes("import type { ExecutionLayer } from './modelGraphTypes';"),
  parsedColumnProductionReferencesZero: parsedColumnRefs.length === 0,
  modelColumnUsesSemanticColumn: modelNodes.includes('export type ModelColumn = ModelSemanticColumn;') && modelNodes.includes('export type ModelColumnContract = ModelSemanticColumn;'),
  legacyParsedColumnDeclarationRemoved: !read('packages/core/src/types/domain/databaseColumns.ts').includes('interface ParsedColumn'),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 733, checks, parsedColumnRefs, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
