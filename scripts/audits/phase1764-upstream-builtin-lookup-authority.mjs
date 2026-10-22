import { spawnSync } from 'node:child_process';

process.stdout.write('Phase 1764 lookup contract is superseded by Phase 1765 semantic authority.\n');
const result = spawnSync(process.execPath, ['scripts/audits/phase1765-php-function-call-semantic-authority.mjs'], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
