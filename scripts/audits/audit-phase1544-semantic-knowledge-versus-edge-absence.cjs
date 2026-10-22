const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const analyzerPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const testPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.phase908.test.ts');
const analyzer = fs.readFileSync(analyzerPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const adapterPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const checks = [
  ['edge-free semantic model falls back to existing knowledge identity in adapter', /knowledge\.dataFlow\[0\]\?\.source\s*\?\?\s*knowledge\.facts\[0\]\?\.value\.id/.test(adapter)],
  ['empty edge set still enters canonical input creation', /createSemanticDataflowInput\(identity\(anchor\), sourceSpanOf\(anchor\), knowledge, 'route'\)/.test(adapter)],
  ['only genuinely empty knowledge surface uses no-evidence protocol', /if \(!anchor\)\s*\{[\s\S]*?kind: 'no_evidence'/.test(adapter)],
  ['edge-free knowledge has a distinct result status', /semantic_knowledge_present_without_dataflow_edges/.test(analyzer)],
  ['status is derived from edge-set presence, not knowledge presence', /model\.dataFlow\.length > 0 \? 'dataflow_facts_present' : 'semantic_knowledge_present_without_dataflow_edges'/.test(analyzer)],
  ['regression test covers isolated semantic knowledge', /Phase 1544 semantic knowledge versus dataflow-edge absence/.test(test)],
  ['regression test asserts canonical judgment for isolated knowledge', /expect\(result\.kind\)\.toBe\('semantic_data_flow_judgment'\)/.test(test)],
];
const failed = checks.filter(([, ok]) => !ok);
const report = { phase: 1544, name: 'semantic-knowledge-versus-edge-absence', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, ok]) => ({ name, passed: ok })), status: failed.length ? 'failed' : 'passed' };
fs.writeFileSync(path.join(root, 'PHASE1544_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.exitCode = failed.length ? 1 : 0;
