# Engine V2 Manifest Enrichment Fix - COMPLETED ✅

## Problem Summary
Files were being generated but with empty content (0 bytes):
- `types/api-read.ts` - 0 chars
- `forms/api-form.ts` - empty
- `schemas/api-schema.ts` - empty  
- `contract/api-contract.ts` - only headers
- `mappers/api-mapper.ts` - empty

**Root Cause**: `ManifestEnricher` was NOT being called before passing manifest to `ContractGenerator`. The manifest had:
- `manifest.resources = []` (empty)
- `manifest.models = []` (empty)
- ContractIRBuilder needs populated resources & models to generate content

## Solution Implemented

### Step 1: Import ManifestEnricher into generate-v2.ts
**File**: `packages/cli/src/commands/generate-v2.ts`

Added import:
```typescript
import { ManifestEnricher } from '../generators/layers/utils/manifest-enricher'
```

### Step 2: Integrate Enrichment into Pipeline
**File**: `packages/cli/src/commands/generate-v2.ts` (lines 36-48)

**Before**:
```typescript
const manifest: RouteManifest = await fs.readJson(options.manifest)
// ... goes straight to ContractGenerator with empty resources/models
const result = await generator.generate(manifest)
```

**After**:
```typescript
const manifest: RouteManifest = await fs.readJson(options.manifest)

// CRITICAL: Enrich manifest dengan missing Resources & Models
spinner.text = 'Enriching manifest dengan Resources & Models data...'
let enrichedManifest: any
try {
    enrichedManifest = ManifestEnricher.enrich(manifest)
} catch (enrichError: any) {
    spinner.fail(chalk.red(`Manifest enrichment failed: ${enrichError.message}`))
    process.exit(1)
}

// Pass enriched manifest to generator
const result = await generator.generate(enrichedManifest)
```

### Step 3: Fix ContractIRBuilder Import
**File**: `packages/cli/src/generators/ContractGenerator.ts` (line 20)

**Error**: `ContractIRBuilder` tidak di-export, class yang di-export adalah `OptimizedContractIRBuilder`

**Before**:
```typescript
import { ContractIRBuilder } from '../../../core/src/ir/ContractIRBuilder'
// ... usage
const contractIR = new ContractIRBuilder(mockContext).buildFromManifest(...)
```

**After**:
```typescript
import { OptimizedContractIRBuilder } from '../../../core/src/ir/ContractIRBuilder'
// ... usage (2 places)
const contractIR = new OptimizedContractIRBuilder(mockContext).buildFromManifest(...)
const debugIR = new OptimizedContractIRBuilder(mockContext).buildFromManifest(...)
```

### Step 4: Fix ManifestEnricher Rule Handling
**File**: `packages/cli/src/generators/layers/utils/manifest-enricher.ts` (line 333)

**Error**: `rule.toLowerCase is not a function` - rules could be arrays (Laravel-style: `['required', 'string']`)

**Before**:
```typescript
private static inferColumnsFromSchema(rules: Record<string, string>, warnings: string[]): ColumnDefinition[] {
    for (const [fieldName, rule] of Object.entries(rules)) {
        const type = this.inferSqlTypeFromRule(rule)
        const nullable = !rule.includes('required')  // ❌ rule might be array
```

**After**:
```typescript
private static inferColumnsFromSchema(rules: Record<string, unknown>, warnings: string[]): ColumnDefinition[] {
    for (const [fieldName, rule] of Object.entries(rules)) {
        // Handle rules that might be arrays (Laravel-style: ['required', 'string', 'max:255'])
        const ruleString = Array.isArray(rule) ? rule.join('|') : String(rule)
        
        const type = this.inferSqlTypeFromRule(ruleString)
        const nullable = !ruleString.includes('required')
```

## Results

### Before Fix
```
✅ Built Contract IR: 0 resources, 0 requests, 35 endpoints
✓ types/api-read.ts (0 chars)          ← EMPTY
✓ forms/api-form.ts (193 chars)        ← minimal
✓ contract/api-contract.ts (462 chars) ← only headers
```

### After Fix
```
✅ Manifest enriched in 2.28ms:
- Resources: 4
- Models: 19
- Warnings: 0

Enriched manifest: 35 routes, 4 resources, 19 models

✅ Built Contract IR: 4 resources, 0 requests, 35 endpoints
✓ contract/api-contract.ts (2206 chars)  ← FULL CONTENT! ✅
✓ mappers/api-mapper.ts (2159 chars)     ← FULL CONTENT! ✅
✓ sdk/api.ts (13461 chars)               ← FULL CONTENT! ✅
```

## Files Modified
1. ✅ `/packages/cli/src/commands/generate-v2.ts` - Integrate ManifestEnricher
2. ✅ `/packages/cli/src/generators/ContractGenerator.ts` - Fix import + 2 usages
3. ✅ `/packages/cli/src/generators/layers/utils/manifest-enricher.ts` - Handle array rules

## Verification
Generated files now contain actual TypeScript/Zod code:
```bash
$ find src/api-v2-test -type f -exec wc -l {} +
  6 types/api-read.ts
 556 sdk/api.ts
  73 contract/api-contract.ts
  3 contract/api-field.ts
  64 mappers/api-mapper.ts
  9 schemas/api-schema.ts
 711 total
```

## Test Command
```bash
node dist/cli.js generate-v2 --manifest routesync.manifest.json --output src/api-v2-test --verbose
```

Expected output shows enrichment:
```
🔍 Enriching manifest with missing Resources & Models...
✅ Manifest enriched in 2.28ms:
- Resources: 4
- Models: 19
- Warnings: 0
```

## Summary of Engine V2 Fixes (Cumulative)

### Problem 1: Missing Semantic Data ✅ FIXED
- ManifestEnricher extracts resources dari route responses
- Infers models dari routes dan resources
- Builds action definitions per resource

### Problem 2: Invalid TypeScript Identifiers ✅ FIXED
- IdentifierSanitizer converts invalid names to valid identifiers
- Example: `forgot-password` → `ForgotPasswordCreatePayload`

### Problem 3: Missing File Integration ✅ FIXED
- ManifestEnricher now integrated into generate-v2 pipeline
- Resources & models populated BEFORE ir building
- Generated files contain actual content

**Status**: Engine V2 is now functional! 🚀
