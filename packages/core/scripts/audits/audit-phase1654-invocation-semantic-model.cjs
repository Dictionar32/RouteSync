const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const audit = path.join(root, 'scripts/audits/audit-phase1655-invocation-semantic-model-interface-first.cjs');
require(audit);
