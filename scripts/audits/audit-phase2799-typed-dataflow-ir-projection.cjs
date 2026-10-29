'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
let passed = 0;
function check(name, condition) { if (!condition) { console.error(`FAIL ${name}`); process.exitCode = 1; return; } passed++; console.log(`PASS ${name}`); }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
const projection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const contract = read('packages/core/src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const coreIndex = read('packages/core/src/index.ts');
const irIndex = read('packages/core/src/compiler/ir/index.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
check('existing semantic dataflow IR projection contract is reused', /SemanticDataflowIRProjectionInterface/.test(contract));
check('runtime projection is exported as a typed frozen operation object', /export const semanticDataflowIRProjection:\s*SemanticDataflowIRProjectionInterface\s*=\s*Object\.freeze\(/.test(projection));
check('project operation has explicit domain input and output types', /project: \(\s*dataflow: DataFlowAuthorityInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>,\s*\): SemanticDataflowIRProjection/.test(projection));
check('IR projection consumes only existing closed authority state', /dataflow\.state\.closure/.test(projection) && !/semanticDataflowReasoningAuthority|semanticDataflowClosureOperation/.test(projection));
check('old exported forwarding function is removed', !/export const projectSemanticDataflowToIR\s*=/.test(projection) && !/export function projectSemanticDataflowToIR/.test(projection));
check('core barrel exports the typed operation, not old function', /export \{ semanticDataflowIRProjection \}/.test(coreIndex) && !/projectSemanticDataflowToIR/.test(coreIndex));
check('IR barrel exports the typed operation, not old function', /export \{ semanticDataflowIRProjection \}/.test(irIndex) && !/projectSemanticDataflowToIR/.test(irIndex));
check('CLI scan calls the operation through its interface', /semanticDataflowIRProjection\.project\(/.test(cliScan) && !/projectSemanticDataflowToIR/.test(cliScan));
check('CLI sync calls the operation through its interface', /semanticDataflowIRProjection\.project\(/.test(cliSync) && !/projectSemanticDataflowToIR/.test(cliSync));
check('domain relation alternatives remain explicit in relation projection', /case 'dependency'/.test(projection) && /case 'value_flow'/.test(projection) && /case 'reaches'/.test(projection));
check('upstream collections contract file remains exactly empty', collections.length === 0);
console.log(`${passed}/11 passed`);
if (passed !== 11) process.exitCode = 1;
