const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const report = {};

const operand = read('packages/core/src/compiler/ir/Operand.ts');
const instruction = read('packages/core/src/compiler/ir/Instruction.ts');
const expression = read('packages/core/src/compiler/ir/Expression.ts');
const phi = read('packages/core/src/compiler/optimization/PhiElimination.ts');
const ssa = read('packages/core/src/compiler/optimization/SSAOptimizer.ts');
const licm = read('packages/core/src/compiler/optimization/LICM.ts');
const cfg = read('packages/core/src/compiler/utils/cfg/instructions.ts');
const cfgBlocks = read('packages/core/src/compiler/utils/cfg/basicBlock.ts');

report.canonicalOperandFacade = operand.includes("export type { Operand } from '../utils/cfg/instructions';");
report.canonicalInstructionFacade = instruction.includes("export type { Instruction, ReturnValue } from '../utils/cfg/instructions';");
report.canonicalExpressionFacade = expression.includes("} from '../utils/cfg/constants';");
report.noUnknownInCanonicalOperand = !operand.includes('unknown');
report.phiUsesCanonicalInstruction = phi.includes("from '../utils/cfg/instructions'");
report.phiUsesRelationBackedBlocks = phi.includes('basicBlockReplace') && phi.includes('createControlFlowGraph');
report.noMapBackedPhiCfg = !phi.includes('new Map');
report.noControlFlowGraphConstructor = !phi.includes('new ControlFlowGraph');
report.ssaUsesRelationalUseWitness = ssa.includes('useDef.isUsed(inst.target)');
report.licmUsesCanonicalInstruction = licm.includes("from '../utils/cfg/instructions'");
report.licmUsesRelationBackedBlocks = licm.includes('basicBlockReplace') && licm.includes('createControlFlowGraph');
report.canonicalPhiShape = cfg.includes("incoming: readonly (readonly [number, Operand])[];");
report.canonicalCfgRelation = cfgBlocks.includes('export type BasicBlockRelation = RelationIndex<number, BasicBlock>;');

const parsedDescriptorHits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      if (/Parsed[A-Z][A-Za-z0-9]*(Descriptor|Model|Route|Resource|Response|Request)/.test(text)) parsedDescriptorHits.push(path.relative(root, full));
    }
  }
}
walk(path.join(root, 'packages/core/src'));
report.noParsedDescriptorInCore = parsedDescriptorHits.length === 0;
report.parsedDescriptorHits = parsedDescriptorHits;

const all = Object.values(report).filter(v => typeof v === 'boolean');
report.allPass = all.every(Boolean);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.allPass ? 0 : 1;
