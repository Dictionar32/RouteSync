import type { PhpArgument, PhpAstNode, FoldedPhpArgument } from '../phpAst';

describe('Phase 86 PHP AST argument contract', () => {
  it('represents positional, named, and unpacked arguments without raw argument strings', () => {
    const value = { kind: 'literal', originalCode: "'paid'", source: { kind: 'absent' }, value: { kind: 'string', value: 'paid' } } as unknown as PhpAstNode;
    const positional: PhpArgument = { kind: 'positional', value };
    const named: PhpArgument = { kind: 'named', name: { kind: 'property_name', value: 'status' }, value };
    const unpacked: PhpArgument = { kind: 'unpacked', value };
    expect(positional.kind).toBe('positional');
    expect(named.kind).toBe('named');
    expect(unpacked.kind).toBe('unpacked');
  });
});


describe('Phase 86.1 PHP AST fold contract', () => {
  it('preserves argument binding kind and named argument identity through the fold carrier', () => {
    const positional: FoldedPhpArgument<string> = { kind: 'positional', value: 'paid' };
    const named: FoldedPhpArgument<string> = { kind: 'named', name: { kind: 'property_name', value: 'status' }, value: 'paid' };
    const unpacked: FoldedPhpArgument<string> = { kind: 'unpacked', value: 'filters' };

    expect(positional).toEqual({ kind: 'positional', value: 'paid' });
    expect(named).toEqual({ kind: 'named', name: { kind: 'property_name', value: 'status' }, value: 'paid' });
    expect(unpacked).toEqual({ kind: 'unpacked', value: 'filters' });
  });
});
