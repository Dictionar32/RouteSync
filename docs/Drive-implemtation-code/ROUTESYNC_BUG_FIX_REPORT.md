# RouteSync Bug Fix Report

## Issue
When running RouteSync CLI generator:
```bash
node "C:\...\routesync\dist\cli.js" generate --manifest routesync.manifest.json --output frontend/src/api --next-actions --zod
```

**Result**: 100+ TypeScript parsing errors in generated `api-mapper.ts` file with:
- "Invalid character" errors at regular intervals
- "No value exists in scope for the shorthand property 'n'" 
- "',' expected" errors
- Cascading syntax errors making the file unparseable

---

## Root Cause

**File**: `packages/cli/src/generators/ZodTierGenerator.ts`  
**Line**: 1273  
**Method**: `generateObjectReadMapper()`

### The Bug

```typescript
// BROKEN CODE (line 1273):
return `(${parentAccessor} ? {\\n${props.join('\\n')}\\n  } : undefined) as any`
```

The issue is the use of `\\n` (escaped backslash-n) instead of actual newline characters. This generates:

```typescript
// WHAT GETS GENERATED (BROKEN):
produk: (api.produk ? {
  id: api.produk.id,
  nama: api.produk.nama,
  ...
} : undefined) as any,
```

But becomes in the file:
```typescript
// ACTUAL OUTPUT (WITH LITERAL \n):
produk: (api.produk ? {\n    id: api.produk.id,\n    nama: api.produk.nama,\n    ... } : undefined) as any,
```

These literal `\n` characters break the JavaScript/TypeScript syntax because they're not recognized as actual newlines by the parser.

---

## Solution

### Changed Code

**File**: `packages/cli/src/generators/ZodTierGenerator.ts`  
**Line**: 1273

```typescript
// FIXED CODE:
return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as any`
```

### Why This Works

Inside JavaScript template strings (backticks), `\n` is automatically converted to an actual newline character. The double-backslash `\\n` was escaping the backslash, resulting in a literal `\n` string being output.

The fix removes the extra escaping:
- `\\n` → `\n` (actual newline)
- `join('\\n')` → `join('\n')` (join with actual newlines)

---

## Impact

After this fix, the `api-mapper.ts` generator now produces:

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
  // ... rest of fields
})
```

✅ Proper TypeScript syntax with actual newlines  
✅ No parser errors  
✅ Correctly formatted and readable code  

---

## Testing

```bash
# Rebuild RouteSync
npm install
npm run build

# Run generator
node dist/cli.js generate --manifest routesync.manifest.json --output frontend/src/api --next-actions --zod

# Result: ✅ No syntax errors, clean TypeScript output
```

---

## Deployment

To apply this fix in your projects:

1. Update `RouteSync-main/packages/cli/src/generators/ZodTierGenerator.ts` line 1273
2. Run `npm run build` in RouteSync root
3. Delete your generated `frontend/src/api/mappers/api-mapper.ts`
4. Re-run the CLI generator

---

## Related Code

This generator method `generateObjectReadMapper()` handles nested object mapping for API responses. The same fix pattern should be applied to ensure all generated code uses actual newlines, not escaped ones.

```typescript
// Context in ZodTierGenerator.ts
private static generateObjectReadMapper(rawMeta: any, parentAccessor: string): string {
  // ... field mapping logic ...
  const props: string[] = []
  // ... build props ...
  return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as any` // ✅ FIXED
}
```
