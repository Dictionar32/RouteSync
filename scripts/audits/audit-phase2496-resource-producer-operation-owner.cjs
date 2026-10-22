const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const producer = path.join(root, 'packages/core/src/compiler/scanner/operations/resourceProducer.ts');
const retiredProducer = path.join(root, 'packages/core/src/compiler/scanner/subscanners/resourceProducer.ts');
const contract = path.join(root, 'packages/core/src/types/upstream/resourceProducerInterface.ts');
const scanner = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const binder = path.join(root, 'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts');
const read = file => fs.readFileSync(file, 'utf8');
const producerText = read(producer);
const contractText = read(contract);
const scannerText = read(scanner);
const binderText = read(binder);
const checks = [
  ['producer implementation has moved out of the subscanner owner', fs.existsSync(producer) && !fs.existsSync(retiredProducer)],
  ['producer remains explicitly typed by the existing upstream ResourceProducerInterface', /export const resourceProducer:\s*ResourceProducerContract\s*=\s*Object\.freeze/.test(producerText) && /export interface ResourceProducerInterface</.test(contractText)],
  ['canonical Laravel Resource scanner consumes the operations owner', scannerText.includes("from '../operations/resourceProducer'")],
  ['canonical Resource binder consumes the same operations owner', binderText.includes('from "../../operations/resourceProducer"')],
  ['production source has no stale import of the retired top-level subscanner', ![scannerText, binderText, producerText].some(text => /subscanners\/resourceProducer/.test(text))],
  ['operation implementation does not depend on semantic foundation', !producerText.includes('/semantic/foundation')],
  ['operation implementation preserves explicit relation debt for follow-up instead of hiding it', producerText.includes('/semantic/relations/relationalSequence') && producerText.includes('/semantic/relations/semanticRelations')],
  ['operation implementation has no new duplicate producer interface', !producerText.includes('interface ResourceProducerInterface')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Result: ${checks.filter(([, passed]) => passed).length}/${checks.length} assertions passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
