import { describe, it, expect } from 'vitest';
import { LaravelSourceLexer } from '@routesync/core';

describe('LaravelSourceLexer Unit Test Suite', () => {
  it('1. Tokenizes string literals, variables, and operators', () => {
    const source = `Route::get('/api/users', [UserController::class, 'index']);`;
    const tokens = LaravelSourceLexer.tokenize(source);

    expect(tokens.length).toBeGreaterThan(5);
    expect(tokens[0].value).toBe('Route');
    expect(tokens[1].value).toBe('::');
    expect(tokens[2].value).toBe('get');
    expect(tokens[4].value).toBe('/api/users');
  });

  it('2. Correctly tokenizes boolean and null keywords', () => {
    const source = `return ['active' => true, 'pending' => false, 'deleted_at' => null];`;
    const tokens = LaravelSourceLexer.tokenize(source);

    const trueToken = tokens.find(t => t.value.toLowerCase() === 'true');
    const falseToken = tokens.find(t => t.value.toLowerCase() === 'false');
    const nullToken = tokens.find(t => t.value.toLowerCase() === 'null');

    expect(trueToken?.type).toBe('TRUE');
    expect(falseToken?.type).toBe('FALSE');
    expect(nullToken?.type).toBe('NULL');
  });

  it('3. Skips single-line (#, //) and multi-line (/* */) comments atomically', () => {
    const source = `
      // Line comment
      # Shell-style comment
      /* Multi-line
         comment block */
      $active = true;
    `;
    const tokens = LaravelSourceLexer.tokenize(source);

    expect(tokens).toHaveLength(5); // $active, =, true, ;, EOF
    expect(tokens[0].value).toBe('$active');
    expect(tokens[0].type).toBe('VARIABLE');
    expect(tokens[1].value).toBe('=');
    expect(tokens[2].value).toBe('true');
    expect(tokens[2].type).toBe('TRUE');
    expect(tokens[3].value).toBe(';');
    expect(tokens[4].type).toBe('EOF');
  });

  it('4. Recursively parses nested PHP array declarations with exact source slice', () => {
    const source = `[
      'id' => 1,
      'details' => [
        'color' => 'red',
        'size' => 'XL'
      ],
      'price' => 50000
    ]`;
    const tokens = LaravelSourceLexer.tokenize(source);
    const result = LaravelSourceLexer.parseArray(source, tokens);

    expect(result.entries).toHaveLength(3);
    expect(result.entries[0].key).toBe('id');
    expect(result.entries[0].rawExpression).toBe('1');
    expect(result.entries[0].value).toEqual({ kind: 'literal', literalType: 'number', value: 1 });

    // Nested array
    expect(result.entries[1].key).toBe('details');
    expect(result.entries[1].value.kind).toBe('nested_array');

    // Third entry after nested array
    expect(result.entries[2].key).toBe('price');
    expect(result.entries[2].rawExpression).toBe('50000');
    expect(result.entries[2].value).toEqual({ kind: 'literal', literalType: 'number', value: 50000 });
  });

  it('5. Classifies PhpAstValue for Resource, Model chaining, and ternary expressions', () => {
    const single = LaravelSourceLexer.classifyAstValue('UserResource::make($this->user)');
    expect(single.kind).toBe('resource_single');
    if (single.kind === 'resource_single') {
      expect(single.resourceName).toBe('UserResource');
      expect(single.argument).toBe('$this->user');
    }

    const collection = LaravelSourceLexer.classifyAstValue('OrderItemResource::collection($this->items)');
    expect(collection.kind).toBe('resource_collection');
    if (collection.kind === 'resource_collection') {
      expect(collection.resourceName).toBe('OrderItemResource');
      expect(collection.argument).toBe('$this->items');
    }

    const chain = LaravelSourceLexer.classifyAstValue('$this->user->name');
    expect(chain.kind).toBe('property_access');
    if (chain.kind === 'property_access') {
      expect(chain.target).toBe('$this->user');
      expect(chain.property).toBe('name');
      expect(chain.nullsafe).toBe(false);
    }

    const nullsafeChain = LaravelSourceLexer.classifyAstValue('$this->user?->email');
    expect(nullsafeChain.kind).toBe('property_access');
    if (nullsafeChain.kind === 'property_access') {
      expect(nullsafeChain.target).toBe('$this->user');
      expect(nullsafeChain.property).toBe('email');
      expect(nullsafeChain.nullsafe).toBe(true);
    }
  });

  it('6. Parses array preceded by return keyword in FormRequest rules method without treating as subscript', () => {
    const source = `public function rules(): array
    {
        return [
            'produk_item_id' => 'required|integer|exists:produk_items,id',
            'qty' => 'required|integer|min:1',
        ];
    }`;
    const tokens = LaravelSourceLexer.tokenize(source);
    const retIdx = tokens.findIndex((t, idx) => t.value === 'return');
    const result = LaravelSourceLexer.parseArray(source, tokens, retIdx);

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].key).toBe('produk_item_id');
    expect(result.entries[0].value).toEqual({
      kind: 'literal',
      literalType: 'string',
      value: 'required|integer|exists:produk_items,id'
    });
    expect(result.entries[1].key).toBe('qty');
    expect(result.entries[1].value).toEqual({
      kind: 'literal',
      literalType: 'string',
      value: 'required|integer|min:1'
    });
  });
});
