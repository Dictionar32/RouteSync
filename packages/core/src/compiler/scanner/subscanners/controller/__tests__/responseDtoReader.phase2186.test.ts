import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readResponseDtoAnalysis } from '../responseDtoReader';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('DTO numeric response projection phase 2186', () => {
  it('preserves PHP int and float as distinct response scalar contracts', () => {
    const directory = mkdtempSync(join(tmpdir(), 'routesync-phase2186-'));
    temporaryDirectories.push(directory);
    const file = join(directory, 'MetricsDto.php');
    writeFileSync(file, `<?php\nclass MetricsDto {\n public int $count;\n public float $ratio;\n public string $label;\n public bool $active;\n}\n`);

    const analysis = readResponseDtoAnalysis(file);

    expect(analysis.contractFields.map(field => field.value)).toEqual([
      { kind: 'scalar', value: { kind: 'whole_number' } },
      { kind: 'scalar', value: { kind: 'decimal_number' } },
      { kind: 'scalar', value: { kind: 'textual' } },
      { kind: 'scalar', value: { kind: 'boolean_flag' } },
    ]);
  });
});
