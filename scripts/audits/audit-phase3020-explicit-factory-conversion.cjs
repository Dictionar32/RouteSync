const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const checks = [];
function check(name, ok, detail) { checks.push({ name, status: ok ? 'passed' : 'failed', detail }); }
const valueObjectsPath = path.join(root, 'packages/core/src/types/upstream/valueObjects.ts');
const valueObjects = fs.readFileSync(valueObjectsPath, 'utf8');
const reasoningPath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const reasoning = fs.readFileSync(reasoningPath, 'utf8');
const evidencePath = path.join(root, 'packages/core/src/compiler/semantic/query/queryEvidenceProducer.ts');
const evidence = fs.readFileSync(evidencePath, 'utf8');
check('DescriptionTextFactoryInterface declared', /export interface DescriptionTextFactoryInterface\s*\{[\s\S]*readonly create:\s*\(value: string\) => DescriptionText/.test(valueObjects), 'Factory contract is explicit and typed.');
check('descriptionText exported as interface-backed object', /export const descriptionText:\s*DescriptionTextFactoryInterface\s*=\s*Object\.freeze\(\{\s*create:/.test(valueObjects), 'Callable function export converted to an explicitly typed object.');
check('old callable factory removed', !/export const descriptionText\s*=\s*\(value: string\)/.test(valueObjects), 'No callable descriptionText factory remains.');
check('upstream consumer migrated', /descriptionText\.create\(message\)/.test(reasoning), 'Query semantic diagnostic uses the object operation.');
check('compiler runtime consumer migrated', /descriptionText\.create\('invalid source-bound semantic execution contract'\)/.test(evidence), 'Query evidence producer uses the object operation.');
const allTs = [];
function walk(dir) { for (const ent of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, ent.name); if (ent.isDirectory()) walk(p); else if (p.endsWith('.ts')) allTs.push(p); } }
walk(path.join(root, 'packages'));
const stale = allTs.filter(p => /\bdescriptionText\s*\(/.test(fs.readFileSync(p, 'utf8')));
check('no stale direct calls in packages', stale.length === 0, stale.length ? stale.map(p => path.relative(root, p)) : 'All call sites use descriptionText.create(...).');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
check('collections.ts preserved as one-byte newline', fs.statSync(collections).size === 1 && fs.readFileSync(collections)[0] === 10, `size=${fs.statSync(collections).size}`);
for (const rel of ['packages/core/src/semantic/relations/relationMembership.ts','packages/core/src/semantic/relations/relationalSequence.ts','packages/core/src/semantic/relations/semanticRelations.ts']) check(`removed foundation stays absent: ${path.basename(rel)}`, !fs.existsSync(path.join(root, rel)), rel);
const result = { phase: 3020, title: 'Explicit Factory Conversion — DescriptionText', passed: checks.filter(x => x.status === 'passed').length, total: checks.length, checks };
console.log(JSON.stringify(result, null, 2));
if (result.passed !== result.total) process.exitCode = 1;
