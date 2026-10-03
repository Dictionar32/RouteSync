const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../packages/core/src/semantic/kernel');
const targets = ['semanticDecisionCalculus.ts', 'semanticDecisionEngine.ts', 'semanticRewriteEngine.phase340.test.ts'];
const forbidden = /\b(if|while|for|switch)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|undefined|null|\?\?|===|!==|\bas\b/;
let violations = 0;
for (const file of targets) {
  const full = path.join(root, file);
  const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (forbidden.test(line)) {
      violations += 1;
      process.stdout.write(`${file}:${i + 1}:${line.trim()}\n`);
    }
  });
}
process.stdout.write(`Phase 340 semantic rewrite authority violations: ${violations}\n`);
process.exitCode = violations ? 1 : 0;
