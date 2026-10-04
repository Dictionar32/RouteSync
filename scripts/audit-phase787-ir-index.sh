#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INDEX="$ROOT/packages/core/src/compiler/ir/index.ts"
BASIC="$ROOT/packages/core/src/compiler/utils/cfg/basicBlock.ts"
INSTRUCTION="$ROOT/packages/core/src/compiler/ir/Instruction.ts"
node - "$INDEX" "$BASIC" "$INSTRUCTION" <<'NODE'
const fs = require('fs');
const [index,basic,instruction] = process.argv.slice(2);
const i=fs.readFileSync(index,'utf8');
const b=fs.readFileSync(basic,'utf8');
const ins=fs.readFileSync(instruction,'utf8');
const out={
  basicBlockAuthority: /export interface BasicBlock/.test(b),
  instructionFacadeHasNoBasicBlock: !/BasicBlock/.test(ins),
  irBarrelExportsCanonicalBasicBlock: /export type \{ BasicBlock, BasicBlockRelation, ControlFlowGraph \} from '\.\.\/utils\/cfg\/basicBlock';/.test(i),
  irBarrelExportsCanonicalCfgFactories: /createControlFlowGraph/.test(i),
  noLegacyBasicBlockDefinitionInIrIndex: !/interface BasicBlock|type BasicBlock =/.test(i),
};
out.allPass=Object.values(out).every(Boolean);
console.log(JSON.stringify(out,null,2));
if(!out.allPass) process.exit(1);
NODE
