const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const factoryPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/channel/channelFactories.ts');
const callerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/ChannelScanner.ts');
const barrelPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/channelDescriptors.ts');
const factory = fs.readFileSync(factoryPath, 'utf8');
const caller = fs.readFileSync(callerPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['factory interface declares six typed operations', /export interface BroadcastChannelFactoryOperationsInterface/.test(factory) && (factory.match(/readonly create(?:Broadcast|Public|Private|Presence|None|Empty)Channel:/g) || []).length === 6],
  ['factory operations exported as frozen interface-typed object', /export const channelFactoryOperations:\s*BroadcastChannelFactoryOperationsInterface\s*=\s*Object\.freeze\(/.test(factory)],
  ['factory module has no exported free function declarations', !/^export\s+(?:async\s+)?function\s+/m.test(factory)],
  ['scanner caller dispatches through operation object', /channelFactoryOperations\.createBroadcastChannel\(/.test(caller)],
  ['scanner caller no longer imports free factory', !/import\s*\{\s*createBroadcastChannel\s*\}/.test(caller)],
  ['domain barrel exports the operation object and interface', /channelFactoryOperations/.test(barrel) && /BroadcastChannelFactoryOperationsInterface/.test(barrel)],
  ['semantic relations and foundation directories remain empty', ['relations','foundation'].every(n => fs.existsSync(path.join(root, 'packages/core/src/semantic', n)) && fs.readdirSync(path.join(root, 'packages/core/src/semantic', n)).length === 0)],
  ['legacy subscanners directory remains absent', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners'))],
  ['legacy descriptors directory remains absent', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/descriptors'))],
];
const result = { phase: 2746, title: 'Channel factories migrated to interface-typed runtime operation object', checks: checks.map(([name, passed]) => ({name, passed})), passed: checks.filter(([,passed]) => passed).length, total: checks.length };
console.log(JSON.stringify(result, null, 2));
if (result.passed !== result.total) process.exitCode = 1;
