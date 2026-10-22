const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const resolverPath = 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts';
const resolver = fs.readFileSync(path.join(root, resolverPath), 'utf8');
const imports = [...resolver.matchAll(/^import .* from ['"]([^'"]+)['"];?$/gm)].map(match => match[1]);
process.stdout.write('Phase 2243 direct resolver dependencies:\n');
for (const dependency of imports) process.stdout.write(`- ${dependency}\n`);
process.stdout.write('\nTyped return semantic production is consumed through the upstream interface; legacy subscanner dependencies above remain open and must not be represented as retired.\n');
