import { describe, expect, it } from 'vitest';
import { scannerStatementSequenceAlgebra } from '../scannerStatementSequenceAlgebra';
import type { ScannerStatementSequenceInterface } from '../scannerStatementSequenceInterface';

describe('scanner statement sequence interface phase 1483', () => {
  it('exposes the canonical algebra through the upstream contract', () => {
    const contract: ScannerStatementSequenceInterface = scannerStatementSequenceAlgebra;
    expect(typeof contract.parse).toBe('function');
  });
});
