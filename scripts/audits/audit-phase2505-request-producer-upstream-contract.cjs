const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestProducerInterface.ts'), 'utf8');
const producer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/requestProducer.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/FormRequestScanner.ts'), 'utf8');
const assertions = [
  ['upstream contract owns named RequestProducerInput', /export interface RequestProducerInput\s*\{/.test(contract)],
  ['upstream contract owns RequestProducerResult', /export interface RequestProducerResult\s*\{/.test(contract)],
  ['upstream contract owns producer call signatures', /export interface RequestProducerInterface\s*\{[\s\S]*?produce:\s*\(input: RequestProducerInput\) => RequestAst;[\s\S]*?produceResult:\s*\(input: RequestProducerInput\) => RequestProducerResult;/.test(contract)],
  ['producer imports upstream contract', /from '\.\.\/\.\.\/\.\.\/types\/upstream\/requestProducerInterface'/.test(producer)],
  ['producer is explicitly typed with interface', /export const requestProducer: RequestProducerInterface = Object\.freeze\(/.test(producer)],
  ['producer-local duplicate input declaration retired', !/export type RequestProducerInput\s*=/.test(producer)],
  ['producer-local duplicate interface retired', !/export interface RequestProducer\s*\{/.test(producer)],
  ['producer-local duplicate result declaration retired', !/export interface RequestProducerResult\s*\{/.test(producer)],
  ['FormRequestScanner consumes upstream result contract', /import type \{ RequestProducerResult \} from "\.\.\/\.\.\/\.\.\/types\/upstream\/requestProducerInterface"/.test(scanner)],
  ['scanner no longer imports result type from implementation module', !/type RequestProducerResult \} from "\.\/requestProducer"/.test(scanner)],
];
for (const [label, passed] of assertions) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${assertions.filter(([, passed]) => passed).length}/${assertions.length} assertions passed`);
if (assertions.some(([, passed]) => !passed)) process.exitCode = 1;
