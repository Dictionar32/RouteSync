# RouteSync - Quick Fix Guide

## Problem
```
Parsing error: Invalid character
No value exists in scope for the shorthand property 'n'
```

Generated `api-mapper.ts` has literal `\n` characters breaking TypeScript syntax.

---

## Quick Fix (2 options)

### Option 1: Manual Fix in RouteSync

**File**: `RouteSync-main/packages/cli/src/generators/ZodTierGenerator.ts`

**Line 1273**: Change this:
```typescript
return `(${parentAccessor} ? {\\n${props.join('\\n')}\\n  } : undefined) as any`
```

To this:
```typescript
return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as any`
```

Then rebuild:
```bash
npm run build
```

---

### Option 2: Use Patch File

```bash
cd RouteSync-main
patch -p1 < routesync-newline-fix.patch
npm run build
```

---

## Verify Fix

Run your generator command again:
```bash
node dist/cli.js generate --manifest routesync.manifest.json --output frontend/src/api --next-actions --zod
```

**Expected**: ✅ No errors, clean code generated

---

## What Was Wrong?

In JavaScript template strings:
- `` `\n` `` = actual newline ✅
- `` `\\n` `` = literal text "\n" ❌

The bug used `\\n` which created literal `\n` strings in output, breaking the syntax.

---

## Summary

| Part | Before | After |
|------|--------|-------|
| Template string | `\\n` | `\n` |
| Output | `{\n    id: ...}` (literal) | `{` + newline + `    id: ...}` (actual) |
| TypeScript parse | ❌ Error | ✅ Valid |

---

## Files Provided

1. **ROUTESYNC_BUG_FIX_REPORT.md** - Full technical analysis
2. **ZodTierGenerator.ts** - Fixed version of the generator
3. **routesync-newline-fix.patch** - Patch file for easy application
4. **THIS FILE** - Quick reference

---

## Next Steps

1. Apply the fix to your RouteSync copy
2. Rebuild (`npm run build`)
3. Re-run generator on ecommerce_shop
4. Clean generated files if needed: `rm -rf frontend/src/api/mappers/api-mapper.ts`
5. Re-generate: `node dist/cli.js generate ...`
