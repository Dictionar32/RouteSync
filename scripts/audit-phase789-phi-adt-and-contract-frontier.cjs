const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const phiPath = path.join(root, 'packages/core/src/compiler/optimization/PhiElimination.ts');
const instrPath = path.join(root, 'packages/core/src/compiler/utils/cfg/instructions.ts');
const graphPath = path.join(root, 'packages/core/src/compiler/ir/ContractGraph.ts');
const phi = fs.readFileSync(phiPath, 'utf8');
const phiCode = phi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
const instr = fs.readFileSync(instrPath, 'utf8');
const graph = fs.readFileSync(graphPath, 'utf8');

const forbidden = /(^|[^A-Za-z0-9_$])(if|while|for|switch|undefined|unknown|any|as|===|\?\?|null)([^A-Za-z0-9_$]|$)|\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|\.flatMap\s*\(/m;
const producerPattern = /new\s+ContractGraph(?:Builder)?\s*\(|new\s+EntityNode\s*\(|new\s+SchemaNode\s*\(|new\s+RelationNode\s*\(/;
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') walk(p);
    else if (entry.isFile() && p.endsWith('.ts')) sourceFiles.push(p);
  }
}
walk(path.join(root, 'packages/core/src'));
const producers = sourceFiles.filter(file => file !== graphPath && producerPattern.test(fs.readFileSync(file, 'utf8')));

const result = {
  phiNamedPhiInstruction: /PhiInstruction/.test(phi) && /PhiInstruction/.test(instr),
  phiIncomingIsTyped: /readonly incoming: readonly \(readonly \[number, Operand\]\)\[\];/.test(instr),
  phiNoHostConstructLeak: !forbidden.test(phiCode),
  contractGraphHasNoProductionProducers: producers.length === 0,
  contractGraphConsumerCount: sourceFiles.filter(file => file !== graphPath && /ContractGraph/.test(fs.readFileSync(file, 'utf8'))).length,
  contractGraphProducerFiles: producers.map(file => path.relative(root, file)),
};
result.allPass = result.phiNamedPhiInstruction && result.phiIncomingIsTyped && result.phiNoHostConstructLeak && result.contractGraphHasNoProductionProducers;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.allPass ? 0 : 1;
