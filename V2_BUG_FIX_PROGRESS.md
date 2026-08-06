# V2 Engine Bug Fix Progress

Generated: July 30, 2026

## Status: Partial Fix Complete ✅❌

### ✅ Bug #1: FIXED - Duplicate Interface Generation

**Problem**: Generated file had interfaces with same names but different fields:
```typescript
// BEFORE (BROKEN):
export interface OrderTransformed { id, totalHarga, ... }
// ... 50 lines later ...
export interface OrderTransformed { produkItemId, qty, ... }  // TS2300 error
```

**Root Cause**: 
- Enricher extracted resources from routes: `response.model = "Order"` → resource name "Order"
- Hand-authored resources in manifest: `OrderResource` → resource name "OrderResource"
- Deduplication logic compared raw names without normalization:
  - `authoredResourceNames.has("Order")` vs Set containing `"OrderResource"` → never matched
  - Result: Both added to manifest → downstream IR builder generates duplicates

**Solution**:
1. Created `resourceBaseName()` utility to normalize names by stripping "Resource" suffix
2. Updated enricher deduplication to compare normalized basenames:
   ```typescript
   const authoredResourceBasenames = new Set(
     (manifest.resources || []).map(r => {
       const basename = r.name.endsWith('Resource') ? r.name.slice(0, -8) : r.name
       return basename
     })
   )
   ```
3. Updated ContractIRBuilder model loop to use same normalization strategy

**Files Modified**:
- `/packages/cli/src/generators/layers/utils/manifest-enricher.ts`
- `/packages/core/src/ir/ContractIRBuilder.ts`

**Test Result**: ✅ Duplicates eliminated
- Before: 9 interfaces with 3 duplicates
- After: 5 unique interfaces (OrderDetail, Order, Payment, ProdukItem, RegisterResponse)

---

### ❌ Bug #2: PARTIALLY ADDRESSED - Missing Models (Still ~15+ models)

**Problem**: Only 5 resources generated, but reference file has ~25 resources

**Root Cause**: 
- Source manifest from `/home/annas-zen/Documents/laragon-docker/www/toko-online/routesync.manifest.json` only has 1 model entry: `RegisterResponse`
- Backend Laravel scanning didn't capture all 20+ models in database
- `buildResourceIRFromModel()` can only create resources from models that exist in manifest.models array

**What was implemented**:
- Added `buildResourceIRFromModel()` method to generate ResourceIR from ParsedModel
- Converts DB columns to TypeScript fields
- Infers proper types from column types (varchar→string, int→number, etc.)

**Test Result**: ⚠️ Partial - works for available models but source manifest incomplete
- Can generate: 5 resources
- Should generate: ~25 resources
- Missing: Category, User, Wishlist, OrderAmount, PaymentDetail, etc.

**Why it's a deeper architectural issue**:
The missing models are not in the manifest because they weren't explicitly returned by any route. They're only referenced as nested objects within response payloads (e.g., `OrderDetail` contains nested `produk: { id, nama, gambar, image_url }`).

To fully solve this would require:
1. **Option A**: Enhance backend Laravel scanner to extract ALL models in database
2. **Option B**: Enhance enricher to infer models from nested object references in responses
3. **Option C**: Manually provide list of models to scan

---

## Next Steps

### Immediate (For this session):
- [x] Fix duplicate interfaces ✅
- [ ] Investigate if backend Laravel app can provide full model list
- [ ] Check if nested object `produk: { id, nama, ... }` should auto-generate Model resource

### Short-term:
- Decide on architectural approach for missing models
- Either fix backend scanning OR enhance enricher to infer models from relations
- Re-run generation with complete model list
- Verify all ~25 resources are generated with correct field types

### Validation:
- Compare generated `api-read.ts` with reference: `/home/annas-zen/Documents/laragon-docker/www/toko-online/frontend/src/api/types/api-read.ts`
- Check field type accuracy (currently many are `unknown`)
- Verify nested objects are properly flattened or typed

---

## Files Changed

### Created:
- `/packages/core/src/utils/resource-naming.ts` - Name normalization utility

### Modified:
- `/packages/cli/src/generators/layers/utils/manifest-enricher.ts` - Fixed dedup logic
- `/packages/core/src/ir/ContractIRBuilder.ts` - Added model processing, fixed imports

### Build Status:
- ✅ `npm run build` succeeds
- ✅ All emitters working (ReadEmitter, ContractEmitter, etc.)
- ✅ Generated files produced

## Key Learning

The enricher and builder now have **parallel deduplication logic** using normalized basenames, which prevents the same resource from appearing twice with conflicting field definitions. This is a critical fix for type safety.

However, the fundamental limitation remains: **you can only generate resources for models that are in the manifest**. The backend scanner needs to provide a complete model inventory for comprehensive frontend SDK generation.
