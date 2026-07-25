# Phase 1 Quick Reference Card

**Print This & Keep at Your Desk** 📋

---

## The Problem (30 seconds)

❌ 6 generators each re-infer decisions independently  
❌ 6 ACTION_MAP definitions scattered across codebase  
❌ 2 parallel type systems (Zod + TypeScript)  
❌ No single source of truth (IR exists but discarded)  

**Result:** Silent bugs possible, maintenance burden high

---

## The Solution (30 seconds)

✅ `SemanticResolver` computes ALL decisions once → IR  
✅ `canonical-names.ts` has single ACTION_MAP  
✅ All generators accept IR (not re-infer)  
✅ IR passed to all generators (from sync.ts)  

**Result:** Single source of truth, compiler guarantees consistency

---

## Files to Know

| File | Purpose | Where | Status |
|---|---|---|---|
| `canonical-names.ts` | ACTION_MAP + type maps | generators/ | ✅ Copy-paste ready |
| `semantic-resolver.ts` | Compute IR | generators/ | ✅ Copy-paste ready |
| `sync.ts` | Pass IR to generators | src/ | ⏳ Modify existing |
| Tests | Unit + integration | generators/__tests__/ | ✅ Copy-paste ready |

---

## 5-Step Implementation

### 1️⃣ Copy Files (30 min)
```bash
cp canonical-names.ts packages/cli/src/generators/
cp semantic-resolver.ts packages/cli/src/generators/
cp semantic-resolver.test.ts packages/cli/src/generators/__tests__/
cp integration.test.ts packages/cli/src/generators/__tests__/
```

### 2️⃣ Update sync.ts (1 hour)
```typescript
// ADD: imports
import { SemanticResolver, type CompilerIR } from './generators/semantic-resolver'

// CHANGE: Line ~50
const compilerIR = SemanticResolver.resolve(normalizedManifest)

// UPDATE: All generator calls
await ZodTierGenerator.generate(dir, compilerIR, manifest)  // ← add ir param
```

### 3️⃣ Update Signatures (1 hour)
```typescript
// ALL 5 GENERATORS: Add ir parameter
static async generate(dir: string, ir: CompilerIR, manifest: RouteManifest)
```

### 4️⃣ Replace ACTION_MAP (1 hour)
```bash
# Find: 6 duplicates
grep -n "ACTION_MAP\|ACTION_IN_CRUD\|ACTION_TO_CRUD_HOOK" generators/*.ts

# Replace each with:
import { CANONICAL_ACTION_MAP } from './canonical-names'
```

### 5️⃣ Test (2-4 hours)
```bash
npm test
npm run build
npx tsc --noEmit
```

---

## Verification Commands (Copy-Paste Ready)

```bash
# ✅ Should show imports from canonical-names
grep -r "import.*CANONICAL_ACTION_MAP" packages/cli/src/generators/

# ❌ Should show ZERO (old definitions removed)
grep -r "const.*ACTION_MAP\s*=" packages/cli/src/generators/ | grep -v CANONICAL

# ✅ Should show all generators accept ir param
grep -r "ir: CompilerIR" packages/cli/src/generators/

# ✅ Should show SemanticResolver called
grep -r "SemanticResolver.resolve" packages/cli/src/
```

---

## What NOT to Do Yet

❌ Don't refactor generator logic (Phase 2)  
❌ Don't remove knownSchemas (Phase 2)  
❌ Don't consolidate resource resolution (Phase 2)  
❌ Don't split ZodTierGenerator (Phase 2)  

**Phase 1 is infrastructure only** ← just lay the groundwork

---

## Expected Results After Phase 1

| Metric | Before | After |
|---|---|---|
| ACTION_MAP definitions | 6 | 1 |
| Import paths | Scattered | Centralized |
| IR usage | 0% | Ready for Phase 2 |
| Output files | Identical | Identical ✅ |
| Tests passing | ✅ | ✅ |

---

## Troubleshooting

**TypeScript error: "Cannot find module"**
```bash
# Check file exists
ls packages/cli/src/generators/canonical-names.ts
# Check import path is correct (relative)
grep "from './canonical-names'" packages/cli/src/generators/semantic-resolver.ts
```

**Tests failing**
```bash
# Verify exports exist
grep "export const CANONICAL_ACTION_MAP" packages/cli/src/generators/canonical-names.ts
# Verify import
grep "import.*CANONICAL_ACTION_MAP" packages/cli/src/generators/*.ts
```

**Output files different**
```bash
# Shouldn't happen in Phase 1
# Verify generators don't USE ir yet (Phase 2 will use it)
# Check if old ACTION_MAP refs still exist
grep -n "CONTRACT_ACTION_MAP\|SDK_ACTION_MAP" packages/cli/src/generators/*.ts
```

---

## Success Checklist

- [ ] Files copied (canonical-names.ts, semantic-resolver.ts, tests)
- [ ] sync.ts updated (imports + SemanticResolver.resolve call)
- [ ] All 5 generator signatures updated (ir parameter added)
- [ ] ACTION_MAP imports replaced (6 locations)
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] All tests pass (`npm test`)
- [ ] Output files identical (regression test)
- [ ] Zero duplicate ACTION_MAP (grep shows nothing)
- [ ] Ready for Phase 2? ✅

---

## Documentation Map

```
START HERE
    ↓
AUDIT_SUMMARY_AND_NEXT_STEPS.md (15 min)
    ↓
PHASE_1_INTEGRATION_GUIDE.md (30 min)
    ↓
THIS CARD (reference during work)
    ↓
Implement (6-8 hours)
    ↓
AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md (verify progress)
```

---

## Timeline

```
Day 1:
  1-2h: Read docs + prepare
  2-4h: Copy files + update sync.ts
  4-6h: Update signatures, test

Day 2:
  1-2h: Replace ACTION_MAP definitions
  2-4h: Full testing + verification
  4-5h: Commit + ready for review
```

**Total: 6-8 hours**

---

## Key Contacts

- **Questions about audit?** → Engine.FIx.md (9000+ lines, very detailed)
- **Questions about timeline?** → IMPLEMENTATION_ROADMAP_DETAILED.md
- **How do I implement?** → PHASE_1_INTEGRATION_GUIDE.md
- **Where's this code?** → PHASE_1_STARTER_CODE.md
- **How do I verify?** → AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md

---

## Remember

> "Phase 1 is infrastructure only. We're laying the groundwork for single source of truth. Actual generator refactoring happens in Phase 2."

- Don't over-optimize yet
- Don't change generator logic
- Just get the IR layer in place
- Tests ensure nothing breaks
- You got this! 🚀

---

**Print me! Date: July 25, 2026**
