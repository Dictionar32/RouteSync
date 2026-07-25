# Phase 2 Integration Checklist

**Goal**: Integrate refactored emitters into production  
**Estimated Time**: 45 minutes  
**Risk Level**: 🟢 LOW

---

## Pre-Integration Verification ✅

- [x] All TypeScript files compile (0 errors)
- [x] No `any` types in code
- [x] No unsafe type assertions (except `as const`)
- [x] Test infrastructure configured
- [x] vitest types added to tsconfig
- [x] All test diagnostics resolved
- [x] Documentation complete
- [x] Real manifest loaded & tested
- [x] Temporary directories cleanup working

**Status**: 🟢 READY

---

## Integration Steps

### Step 1: Update ZodTierGenerator.ts

**File**: `packages/cli/src/generators/ZodTierGenerator.ts`

**Action**: Replace `generateContract()`, `generateRead()`, `generateMapper()`, etc. methods with delegation to `ZodTierGeneratorRefactored`

```typescript
// OLD: 1,890 lines of implementation
export class ZodTierGenerator {
  static async generate(...): Promise<void> {
    const knownSchemas = new Set()
    const knownModels = new Set()
    // ... 1,890 lines of implementation ...
  }
}

// NEW: Simple delegation
export class ZodTierGenerator {
  static async generate(outputDir: string, context: LayerContext): Promise<void> {
    await ZodTierGeneratorRefactored.generate(outputDir, context)
  }
}
```

**Time**: 10 min  
**Difficulty**: Easy (copy-paste + cleanup)

- [ ] Backup original `ZodTierGenerator.ts`
- [ ] Import `ZodTierGeneratorRefactored`
- [ ] Replace implementation
- [ ] Update imports if needed
- [ ] Save file

---

### Step 2: Verify Compilation

**Command**: 
```bash
npx tsc --noEmit packages/cli/src/generators/ZodTierGenerator.ts
```

**Expected**: No errors

- [ ] Run compilation check
- [ ] Fix any import errors (if any)
- [ ] Verify 0 errors shown

**Time**: 5 min

---

### Step 3: Clean Build

**Command**:
```bash
npm run clean
npm run build
```

**Expected**: Build succeeds, dist/ directory populated

- [ ] Run clean
- [ ] Run build
- [ ] Check exit code (should be 0)
- [ ] Verify dist/ created

**Time**: 10 min

---

### Step 4: Run Tests

**Command**:
```bash
npm test -- emitters.integration.test.ts --run
```

**Expected**: All 23 tests pass

- [ ] Run test suite
- [ ] Check test output for failures
- [ ] Fix any failures (if any)
- [ ] Verify all tests pass

**Time**: 15 min

---

### Step 5: Verify Output Files

**Commands**:
```bash
# Check files exist
ls -la dist/contract/api-contract.ts
ls -la dist/types/api-read.ts
ls -la dist/mappers/api-mapper.ts
ls -la dist/contract/api-schema.ts
ls -la dist/contract/api-field.ts

# Check no `any` types
grep " any" dist/contract/*.ts
grep " any" dist/types/*.ts
grep " any" dist/mappers/*.ts

# Check file sizes reasonable
wc -l dist/contract/*.ts dist/types/*.ts dist/mappers/*.ts
```

**Expected**: 
- All files exist ✅
- 0 matches for `any` ✅
- File sizes reasonable (not 0 or huge) ✅

- [ ] Verify all output files exist
- [ ] Check no `any` types in output
- [ ] Verify file sizes reasonable
- [ ] Spot-check one file quality

**Time**: 10 min

---

### Step 6: Commit Changes

**Commands**:
```bash
# Stage files
git add packages/cli/src/generators/layers/
git add packages/cli/src/generators/ZodTierGeneratorRefactored.ts
git add packages/cli/src/generators/__tests__/emitters.integration.test.ts
git add vitest.config.ts
git add tsconfig.json
git add packages/cli/src/generators/ZodTierGenerator.ts  # (if updated)

# Verify staged
git status

# Commit
git commit -m "feat: phase 2 - integrated refactored emitters with IR pattern

- Split ZodTierGenerator (1,890 lines) into 6 focused emitters (1,546 lines)
- Implemented IR pattern: routeResponseMap computed once, reused by downstream
- Added comprehensive test suite (23 tests) with real manifest data
- Achieved 100% type safety: zero \`any\` types, zero unsafe casts
- Consolidations: 5 major improvements reducing duplicate computations
- All TypeScript validation passes, all tests pass"

# Verify commit
git log --oneline -1
```

- [ ] Stage all files
- [ ] Verify git status
- [ ] Write commit message
- [ ] Create commit
- [ ] Verify commit created

**Time**: 5 min

---

### Step 7: Tag Release

**Commands**:
```bash
# Create annotated tag
git tag -a v1.0.50 -m "Phase 2: Refactored emitters with IR pattern

Major improvements:
- 6 focused emitters replace monolithic ZodTierGenerator
- Single source of truth: IR (Intermediate Representation)
- 100% type safety achieved
- 5 consolidations reducing duplicate computations
- Comprehensive test suite added

Consolidations:
- 6x ACTION_MAP → 1x CANONICAL_ACTION_MAP
- 6x resource resolution → 1x isResourceAlias()
- 2x type inference → 1x mapSqlTypeToZod/mapSqlTypeToTs
- ~40% code duplication reduced

Breaking changes: None
Backward compatible: Yes
Migration needed: No"

# Verify tag
git tag -l v1.0.50
git show v1.0.50
```

- [ ] Create annotated tag
- [ ] Include release notes
- [ ] Verify tag created
- [ ] View tag info

**Time**: 5 min

---

### Step 8: Publish (Optional - if using npm registry)

**Commands**:
```bash
# Verify package.json version matches
cat package.json | grep '"version"'

# Publish
npm publish

# Verify published
npm view routesync@1.0.50
```

- [ ] Check version in package.json
- [ ] Run publish
- [ ] Verify published on npm

**Time**: 5 min (optional)

---

## Verification After Integration

### Code Quality Check
```bash
# TypeScript validation
npx tsc --noEmit packages/cli/src/generators/**/*.ts

# Linting (if configured)
npm run lint

# No `any` types
grep -r " any" packages/cli/src/generators/layers/
```

- [ ] TypeScript compilation ✅
- [ ] No `any` types ✅
- [ ] Linting passes ✅

### Test Suite Check
```bash
# Run all tests
npm test -- --run

# Run specific test file
npm test -- emitters.integration.test.ts --run
```

- [ ] All tests pass ✅
- [ ] No failing tests ✅
- [ ] Coverage acceptable ✅

### Build Verification
```bash
# Clean build
npm run clean && npm run build

# Check artifacts
ls -la dist/
```

- [ ] Build succeeds ✅
- [ ] Artifacts generated ✅
- [ ] No build warnings ✅

---

## Rollback Plan (If Needed)

If integration fails and needs rollback:

```bash
# Option 1: Revert commit
git revert HEAD

# Option 2: Reset to before integration
git reset --hard HEAD~1

# Option 3: Keep original ZodTierGenerator
# Restore from backup
cp ZodTierGenerator.ORIGINAL.ts packages/cli/src/generators/ZodTierGenerator.ts
git add packages/cli/src/generators/ZodTierGenerator.ts
git commit -m "revert: phase 2 integration"
```

- [ ] Have backup of original files
- [ ] Know how to rollback
- [ ] Can explain rollback to team

---

## Sign-Off

### Technical Lead Review
- [ ] Code reviewed
- [ ] Architecture approved
- [ ] Tests verified
- [ ] No blockers

### QA Review (if applicable)
- [ ] Output quality verified
- [ ] Regression testing done
- [ ] No breaking changes
- [ ] Ready for production

### Final Approval
- [ ] All checks passed
- [ ] Documentation updated
- [ ] Team notified
- [ ] Ready to publish

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| 1. Update ZodTierGenerator | 10 min | ⏳ Pending |
| 2. Verify Compilation | 5 min | ⏳ Pending |
| 3. Clean Build | 10 min | ⏳ Pending |
| 4. Run Tests | 15 min | ⏳ Pending |
| 5. Verify Output | 10 min | ⏳ Pending |
| 6. Commit Changes | 5 min | ⏳ Pending |
| 7. Tag Release | 5 min | ⏳ Pending |
| 8. Publish | 5 min | ⏳ Pending (optional) |
| **TOTAL** | **~65 min** | |

(Reduced to 45 min without Step 8)

---

## Notes

### Before Starting
- [ ] Have git configured (user.name, user.email)
- [ ] Have npm credentials ready (if publishing)
- [ ] Have backup of current state
- [ ] Have all documentation available

### During Integration
- [ ] Follow each step in order
- [ ] Don't skip steps
- [ ] Check each verification point
- [ ] Fix issues before proceeding

### After Integration
- [ ] Notify team
- [ ] Update release notes
- [ ] Monitor for issues
- [ ] Have rollback plan ready

---

## Success Criteria

✅ Integration is successful when:

1. TypeScript compilation: 0 errors
2. Tests: All pass
3. Output: No `any` types
4. Build: Succeeds without warnings
5. Commit: Created with good message
6. Tag: Created with release notes
7. Documentation: Updated
8. Team: Notified

---

**Ready to start integration? Follow steps 1-8 above!**

Estimated time: 45-65 minutes  
Risk level: 🟢 LOW  
Rollback: Easy (see rollback plan)

**Let's do this! 🚀**

