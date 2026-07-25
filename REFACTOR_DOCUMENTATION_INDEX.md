# RouteSync Generator Refactor — Complete Documentation Index

**Purpose:** Navigation guide for all refactor documentation  
**Created:** July 25, 2026  
**Total Documentation:** 5 documents, ~15,000 lines

---

## Document Overview & Reading Order

### 1️⃣ START HERE: AUDIT_SUMMARY_AND_NEXT_STEPS.md
**Role:** Executive summary + quick start guide  
**Read Time:** 20 minutes  
**For:** Project leads, team alignment, scope understanding  

**Contains:**
- What the audit found (3 categories)
- Why it matters (concrete risk example)
- Quick Phase 1 overview
- Implementation decision matrix
- Next immediate steps

**Read This First If:**
- You just joined the project
- You need to brief your team
- You want to understand scope before diving in

---

### 2️⃣ ENGINE.FIX.MD (Your Submission)
**Role:** Complete technical audit  
**Read Time:** 1-2 hours (deep dive)  
**For:** Developers implementing the refactor, architects, QA  

**Contains:**
- §0-§7: Architecture overview, dependency graph
- §8-§10: State audit, manifest analysis
- §11-§15: PHP Scanner boundary, recommendations
- §16-§21: Example output files (api-contract, api-schema, api-read, api-form, api-mapper, mappers, api.ts)
- §22-§28: Generator analysis, hooks, comprehensive tables
- §29: Import graph visualization

**Read This If:**
- You need detailed understanding of current architecture
- You're implementing specific phases
- You're investigating a particular finding
- You want line-number references to actual code

**Key Sections by Use Case:**
- Understanding the problem: §0-§3, §23
- Resource aliasing duplication: §3, §7
- Type inference issue: §6, §23.3
- IR underutilization: §10, §14, §23.2
- Example outputs: §16-§21
- Import graph: §29

---

### 3️⃣ IMPLEMENTATION_ROADMAP_DETAILED.md
**Role:** Complete 6-phase implementation plan  
**Read Time:** 1 hour (planning) + 13 days (execution)  
**For:** Project managers, developers, team leads  

**Contains:**
- Phase 1: IR Infrastructure (2-3 days)
- Phase 2: ZodTierGenerator Refactor (3-4 days)
- Phase 3: Other Generators (2-3 days)
- Phase 4: Consolidate Duplicates (1 day)
- Phase 5: Fix Known Bugs (1-2 days)
- Phase 6: Testing & Validation (1-2 days)
- Timeline dependencies, rollout options, success criteria, risk mitigation

**Read This If:**
- You're project planning the refactor
- You need to estimate effort / timeline
- You're tracking progress across phases
- You need success criteria before starting

**Key Decisions:**
- Option A (big bang): Single branch, 13 days, higher risk
- Option B (incremental): 3 branches, 13 days, lower risk — **RECOMMENDED**

---

### 4️⃣ AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md
**Role:** Cross-reference: findings ↔ code locations ↔ fixes  
**Read Time:** 30 min (scanning) + ongoing (reference)  
**For:** Developers implementing fixes, QA verifying changes  

**Contains:**
- Tables 1-14: Each finding mapped to code location, root cause, fix strategy
- Before/after code examples
- Search commands to verify progress (grep patterns)
- Checklist: Before/after verification per phase
- Code search commands (copy-paste ready)
- Rollback plan

**Read This If:**
- You're implementing a specific fix (e.g., consolidate ACTION_MAP)
- You need to find where code change should happen
- You need to verify your changes are working
- You want to search for remaining duplicates

**Tables:**
- Table 1: ACTION_MAP locations (6 places to change)
- Table 2: Resource resolution locations (6 implementations)
- Table 3: Type inference locations (2 parallel systems)
- Table 4: Duplicate traversals (2 identical loops)
- Table 5: Mutable state (knownSchemas)
- Table 6: Nested array indentation bug
- Table 7: Duplicate action keys
- Table 8: Query key naming
- Table 9: Implied dependencies
- Table 10-14: Additional findings

---

### 5️⃣ PHASE_1_STARTER_CODE.md
**Role:** Production-ready boilerplate code  
**Read Time:** 30 min (study) + 1 day (implement)  
**For:** Developers implementing Phase 1  

**Contains:**
- `canonical-names.ts` — Complete, copy-paste ready (~120 lines)
- `semantic-resolver.ts` — Complete, copy-paste ready (~400 lines)
- `sync.ts` changes — Diff format, easy to apply
- File 3 integration instructions

**Read This If:**
- You're ready to implement Phase 1
- You want production-ready boilerplate (not pseudocode)
- You need interface definitions for CompilerIR

**How to Use:**
1. Copy `canonical-names.ts` exactly as shown
2. Copy `semantic-resolver.ts` exactly as shown
3. Apply diff to `sync.ts`
4. Run tests, verify no regression
5. Proceed to Table-based reference (AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md) for remaining phases

---

## Quick Navigation by Task

### "I need to understand what's wrong"
**Start:** AUDIT_SUMMARY_AND_NEXT_STEPS.md (summary section)  
**Then:** ENGINE.FIX.MD §0-§3, §23 (root cause)  
**Time:** 30 min

### "I need to plan the refactor"
**Start:** AUDIT_SUMMARY_AND_NEXT_STEPS.md (implementation decision section)  
**Then:** IMPLEMENTATION_ROADMAP_DETAILED.md (phases 1-6)  
**Time:** 1 hour

### "I'm implementing Phase 1"
**Start:** PHASE_1_STARTER_CODE.md (copy files)  
**Then:** AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md Table 9 (import strategy)  
**Then:** IMPLEMENTATION_ROADMAP_DETAILED.md §6.1 (unit tests)  
**Time:** 2-3 days

### "I'm verifying Phase 1 is correct"
**Start:** AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md (checklist section)  
**Then:** Run grep commands (copy-paste ready)  
**Then:** IMPLEMENTATION_ROADMAP_DETAILED.md §6 (regression tests)  
**Time:** 2-4 hours

### "I'm fixing a specific bug (e.g., nested array indent)"
**Start:** AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md Table 6  
**Then:** ENGINE.FIX.MD §17, §20 (examples)  
**Then:** IMPLEMENTATION_ROADMAP_DETAILED.md §5.1 (phase details)  
**Time:** 1-2 days

### "I need line numbers for code change X"
**Start:** AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md Table (find the issue)  
**Then:** ENGINE.FIX.MD (search for line numbers)  
**Time:** 5-10 min

---

## Document Statistics

| Document | Lines | Sections | Diagrams | Code Examples |
|---|---|---|---|---|
| ENGINE.FIX.MD | ~9000 | 29 (§0-§29) | 3 | 50+ |
| IMPLEMENTATION_ROADMAP_DETAILED.md | ~2000 | 15 | 1 | 5 |
| AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md | ~1500 | 14 | 0 | 15+ |
| PHASE_1_STARTER_CODE.md | ~700 | 3 | 0 | 3 complete files |
| AUDIT_SUMMARY_AND_NEXT_STEPS.md | ~800 | 8 | 3 | 2 |
| **TOTAL** | **~14,000** | **~60** | **7** | **70+** |

---

## Key Numbers: What the Audit Found

| Metric | Count | Severity |
|---|---|---|
| Duplicate ACTION_MAP definitions | 6 | KRITIS |
| Independent resource resolution implementations | 6 | KRITIS |
| Parallel type inference systems | 2 | TINGGI |
| Duplicate manifest traversals | 2 | SEDANG |
| Mutable class-static state vectors | 1 | TINGGI |
| `camelCase()` calls (should be 1) | 22 | SEDANG |
| Specific bugs identified | 3 | SEDANG |
| Unused IR (normalizeManifest) | 1 | TINGGI |
| God Object lines (ZodTierGenerator) | 1890 | High complexity |

---

## Implementation Timeline

```
Day 1-2:  Phase 1 (IR Infrastructure)
  └─ Create canonical-names.ts, semantic-resolver.ts, update sync.ts
Day 3-4:  Phase 2 (ZodTierGenerator Refactor)
  └─ Accept IR, remove inference logic, verify output identical
Day 5-6:  Phase 3 (HookGenerator, SDKGenerator)
  └─ Read IR instead of re-deriving, remove duplicate logic
Day 7:    Phase 4 (Consolidate Duplicates)
  └─ Remove duplicate loops, use responseCountByGroup
Day 8-9:  Phase 5 (Fix Known Bugs)
  └─ Nested indent, duplicate actions, query key naming
Day 10-11: Phase 6 (Testing & Validation)
  └─ Unit tests, integration tests, regression tests
Day 12-13: Polish & Review
  └─ Documentation, team review, prepare for merge
```

**Total:** 13 days, 1 developer (~8 hrs/day focus)

---

## Verification Commands

Paste these in your terminal to verify progress (from AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md):

```bash
# Find remaining ACTION_MAP duplicates (should be zero)
grep -r "ACTION_MAP\|ACTION_IN_CRUD\|ACTION_TO_CRUD_HOOK" \
  packages/cli/src/generators/*.ts | grep -v "canonical-names"

# Find remaining resource resolution logic (should be zero in non-resolver)
grep -r "resolveResourceName\|getResponseInfo\|resolveBaseResponseName" \
  packages/cli/src/generators/*.ts | grep -v "semantic-resolver"

# Verify generators accept ir: CompilerIR parameter
grep -r "ir: CompilerIR" packages/cli/src/generators/*.ts

# Find remaining knownSchemas (should be zero)
grep -r "knownSchemas" packages/cli/src/generators/*.ts

# Verify CANONICAL_ACTION_MAP imported
grep -r "CANONICAL_ACTION_MAP" packages/cli/src/generators/*.ts
```

---

## Questions & Contact

For questions during implementation, cross-reference:

1. **"What's the code location?"** → AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md (Tables 1-14)
2. **"What's the full context?"** → ENGINE.FIX.MD (search by section number)
3. **"How do I implement this?"** → PHASE_1_STARTER_CODE.md (for Phase 1) or IMPLEMENTATION_ROADMAP_DETAILED.md (for other phases)
4. **"How do I verify success?"** → AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md (Verification Commands)

---

## License & Usage

All documentation is internal project documentation for RouteSync development team.

✅ Use as-is for implementation  
✅ Adapt tables / timelines to your team's capacity  
✅ Share with team members (these are reference docs)  
✅ Update as you implement (document progress)  

---

## Success Looks Like

After all 6 phases:

✅ All output files identical to before refactor (verified via diff)  
✅ `normalizeManifest()` result used (was discarded)  
✅ Single source of truth for all semantic decisions (CompilerIR)  
✅ Zero duplicate ACTION_MAP definitions  
✅ Zero duplicate resource resolution logic  
✅ Nested array indentation bug fixed  
✅ Duplicate action keys resolved  
✅ Full test suite passes  
✅ Regression tests pass on real manifests  

---

## Next Step

→ Go to **AUDIT_SUMMARY_AND_NEXT_STEPS.md**, read "Next Immediate Step" section  
→ Create branch, start Phase 1 implementation  
→ Reference PHASE_1_STARTER_CODE.md as you code  

Good luck! 🚀

