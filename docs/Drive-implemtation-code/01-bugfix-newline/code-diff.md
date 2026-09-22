# Code Generation Comparison

## What Was Generated (BROKEN)

```typescript
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => ({
  id: api.id,
  produkItemId: api.produk_item_id,
  produk: (api.produk ? {\n    id: api.produk.id,\n    nama: api.produk.nama,\n    gambar: api.produk.gambar,\n    imageUrl: api.produk.image_url,\n  } : undefined) as any,
  qty: api.qty,
  harga: api.harga,
  subtotal: api.subtotal,
  banana: api.banana,
  potato: api.potato,
  flyingDog: api.flying_dog,
  foo: api.foo,
})
```

### Why This Fails
The `\n` is a **literal two-character string** `\` + `n`, not a newline:
- Breaks the `{` bracket on line 6
- TypeScript parser sees: `{ \n id: ...` which is invalid syntax
- Results in "Invalid character" at column 25 (where `\` is)
- Cascading errors because parser is confused

---

## What Gets Generated (FIXED)

```typescript
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => ({
  id: api.id,
  produkItemId: api.produk_item_id,
  produk: (api.produk ? {
    id: api.produk.id,
    nama: api.produk.nama,
    gambar: api.produk.gambar,
    imageUrl: api.produk.image_url,
  } : undefined) as any,
  qty: api.qty,
  harga: api.harga,
  subtotal: api.subtotal,
  banana: api.banana,
  potato: api.potato,
  flyingDog: api.flying_dog,
  foo: api.foo,
})
```

### Why This Works
The `\n` is an **actual newline character**:
- Clean, readable object literal
- Valid TypeScript syntax
- Parser is happy ✅
- Proper indentation maintained

---

## The Generator Code Change

### Generator Method: `generateObjectReadMapper()`

```typescript
// Location: ZodTierGenerator.ts, line 1273
private static generateObjectReadMapper(rawMeta: any, parentAccessor: string): string {
  // ... other code to build props array ...

  // BEFORE (BROKEN):
  return `(${parentAccessor} ? {\\n${props.join('\\n')}\\n  } : undefined) as any`
  //                              ↑↑                ↑↑        ↑↑
  //                    Double-escaped: \\n → literal \n

  // AFTER (FIXED):
  return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as any`
  //                              ↑                ↑      ↑
  //                    Single-escaped: \n → actual newline
}
```

---

## How Template Strings Work in JavaScript

```javascript
// These are DIFFERENT:

// ✅ Actual newline in output:
const a = `hello
world`

// ❌ Literal "\n" in output:
const b = `hello\\nworld`

// ✅ Also actual newline (escape sequence):
const c = `hello\nworld`

// ❌ Also literal "\n" (double-escaped):
const d = `hello\\\\nworld`
```

In our case:
- Template string contains: `` `{\\n...` ``
- JavaScript interprets: `\\n` → `\n` (literal backslash-n)
- Output file contains: literal `\n` (2 chars: `\` and `n`)
- TypeScript parser sees: invalid syntax ❌

---

## Error Chain Explanation

When line 351 has:
```
produk: (api.produk ? {\n    id: api.produk.id,
```

TypeScript parser:
1. Sees `{\` → "Invalid character" ❌ (Error 1)
2. Sees `n` → "No value in scope for 'n'" ❌ (Error 2)
3. Sees `:` after `n` → "',' expected" ❌ (Error 3)
4. Cascades through entire line, generating ~100 errors

All from the same root cause: literal `\n` instead of newline.

---

## Verification

Check if a file has the bug:
```bash
# Look for literal \n (should find nothing if fixed)
grep -n '\\n' api-mapper.ts

# Should see actual line breaks:
grep -A2 "produk: (" api-mapper.ts
```

Before fix:
```
351:  produk: (api.produk ? {\n    id: api.produk.id,\n    nama: api.produk.nama,
```

After fix:
```
351:  produk: (api.produk ? {
352:    id: api.produk.id,
353:    nama: api.produk.nama,
```

---

## Summary Table

| Aspect | Broken | Fixed |
|--------|--------|-------|
| Code | `` `{\\n...` `` | `` `{\n...` `` |
| Output | Literal `\n` (2 chars) | Actual newline (1 char) |
| TypeScript | ❌ Invalid syntax | ✅ Valid |
| Parser | 100+ errors | 0 errors |
| Readability | Single-line mess | Multi-line, clean |
| Root cause | Extra backslash escaping | Proper newline handling |
