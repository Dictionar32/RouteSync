# Response Contract Step 6 - Evidence-Based Analysis

**Date**: 2026-08-08  
**Purpose**: Evidence collection BEFORE implementation  
**Methodology**: Search codebase → Identify existing patterns → Reuse/adapt

---

## 🔍 Evidence Collection Results

### Finding 1: Manifest Access Pattern EXISTS

**Location**: `packages/cli/src/generators/CompilerBridge.ts`

**Evidence**:
```typescript
// Line 222-226: EXISTING pattern for grouping routes by resource
const routesByResource = new Map<string, typeof manifest.routes>()

for (const route of manifest.routes || []) {
    // Only process POST/PUT/PATCH (create/update actions)
    if (!['POST', 'PUT', 'PATCH'].includes(route.method)) {
        continue
    }
    
    // Extract resource name from path
    const resourceName = this.extractResourceName(route)
    // ... grouping logic
}
```

**Conclusion**: 
- ✅ **No need for ManifestRouteProvider component**
- ✅ **Already have pattern for accessing manifest.routes**
- ✅ **Already have extractResourceName() method**
- ✅ **Already have grouping logic by resource**

**Action**: **REUSE existing pattern**, don't create new component

---

### Finding 2: Response Data Access Pattern EXISTS

**Location**: Multiple files access `route.response`

**Evidence 1** - `packages/core/src/compiler/passes/ResponseAnalysisPass.ts` (Line 146-171):
```typescript
// Existing response extraction logic
const responseKind = route.response?.kind || 'unknown';
const isPaginated = !!(route.response?.paginated || route.response?.resolved?.paginated);
const collection = !!(route.response?.collection || route.response?.resolved?.collection);
const resourceName = route.response?.resource || route.response?.model;
const modelName = route.response?.model;
```

**Evidence 2** - `packages/cli/src/generators/response-analysis-helper.ts` (Line 68-101):
```typescript
// Another existing pattern for response extraction
const responseKind = route.response?.kind || route.response?.type || 'unknown';
const isPaginated = !!(route.response?.paginated || route.response?.resolved?.paginated);
const isCollectionFromType = !!(route.response?.collection || route.response?.resolved?.collection);
const resourceName = route.response?.resource || route.response?.model;
```

**Conclusion**:
- ✅ **Response data extraction pattern EXISTS in 2 places**
- ✅ **Both use similar logic for extracting response metadata**
- ⚠️ **BUT: Neither extracts response.fields for Zod schema generation**

**Action**: **ADAPT existing pattern** untuk extract `route.response.fields`

---

### Finding 3: Contract Input Generation EXISTS

**Location**: `packages/cli/src/generators/CompilerBridge.ts` (Line 186-338)

**Evidence - manifestToContractInput() method**:
```typescript
/**
 * Convert RouteManifest to ContractInput (for contract generation)
 * Preserves ORIGINAL backend structure (nested + snake_case)
 */
private static manifestToContractInput(manifest: RouteManifest): RequestTypesArtifact {
    const requestTypes: RequestType[] = []
    
    // Group routes by resource name
    const routesByResource = new Map<string, typeof manifest.routes>()
    
    for (const route of manifest.routes || []) {
        // Only process POST/PUT/PATCH (create/update actions)
        if (!['POST', 'PUT', 'PATCH'].includes(route.method)) {
            continue
        }
        
        const resourceName = this.extractResourceName(route)
        // ... processing logic
    }
    
    // Process each resource group
    for (const [resourceName, routes] of routesByResource) {
        // Parse validation rules WITHOUT flattening
        const fields = this.parseValidationRulesPreserveNested(
            route.schema?.rules || {},
            fieldMapper
        )
        // ... build actions
    }
    
    return {
        typeId: 'RequestTypes',
        requestTypes,
        metadata: { /* ... */ }
    }
}
```

**Key Observations**:
1. ✅ **Already groups routes by resource**
2. ✅ **Already extracts resource name**
3. ✅ **Already preserves nested structure for contracts**
4. ✅ **Already creates RequestTypesArtifact**
5. ❌ **Only processes validation rules (request), NOT response fields**

**Conclusion**:
- ✅ **Structure for contract input generation EXISTS**
- ✅ **Can EXTEND manifestToContractInput() to include response data**
- ⚠️ **Currently returns RequestTypesArtifact (only requests)**
- 🔧 **Need to ADD response fields extraction**

**Action**: **EXTEND existing method**, don't create new component

---

### Finding 4: ContractGeneratorPass Input Structure

**Location**: `packages/core/src/compiler/passes/ContractGeneratorPass.ts` (Line 117-120)

**Evidence - run() method signature**:
```typescript
public run(
    inputs: ResolveArtifacts<readonly ['RequestTypes']>
): ResolveArtifacts<readonly ['GeneratedContract']> {
    // Extract request types artifact
    const requestTypesArtifact = inputs[0] as RequestTypesArtifact;
    const requestTypes = requestTypesArtifact.requestTypes;
    // ...
}
```

**Key Observations**:
1. ✅ **Pass receives RequestTypesArtifact as input**
2. ✅ **Artifact contains `requestTypes` array**
3. ❌ **No response data in current artifact**
4. 🔧 **Need to EXTEND RequestTypesArtifact to include response data**

**Artifact Structure** - `packages/core/src/compiler/artifacts/RequestTypesArtifact.ts`:
```typescript
export interface RequestTypesArtifact {
    readonly typeId: 'RequestTypes'
    readonly requestTypes: readonly RequestType[]
    readonly metadata: ArtifactMetadata
}

export interface RequestType {
    readonly resourceName: string
    readonly formTypeName: string
    readonly actions: readonly FormAction[]
}
```

**Conclusion**:
- ✅ **Artifact structure is SIMPLE and EXTENSIBLE**
- 🔧 **Can ADD optional `responseData` field to RequestType**
- 🔧 **Or create separate `ResponseTypesArtifact` and update pass to accept both**

**Decision Point**: Which approach?

**Option A**: Extend RequestTypesArtifact
```typescript
export interface RequestType {
    readonly resourceName: string
    readonly formTypeName: string
    readonly actions: readonly FormAction[]
    readonly responseData?: ResponseData  // NEW: optional
}
```

**Option B**: Create separate artifact + update pass input
```typescript
public run(
    inputs: ResolveArtifacts<readonly ['RequestTypes', 'ResponseTypes']>
): ResolveArtifacts<readonly ['GeneratedContract']>
```

**Recommendation**: **Option A** (simpler, less invasive)
- ✅ Backward compatible (optional field)
- ✅ No pass signature change
- ✅ Data stays together (request + response for same resource)

---

### Finding 5: Action Schema Building Pattern EXISTS

**Location**: `packages/core/src/compiler/generators/contract-generation/ContractActionGenerator.ts`

**Evidence**:
```typescript
/**
 * ContractActionGenerator - Generate actions with Zod schemas
 * 
 * Responsibility: Generate ONE action with schema
 * SOC: Only action generation, delegates schema to ContractSchemaMapper
 */
export class ContractActionGenerator {
    constructor(
        private schemaMapper: ContractSchemaMapper
    ) {}
    
    /**
     * Generate action with Zod schema
     */
    generateAction(
        actionName: string,
        fields: readonly ContractField[]
    ): GeneratedContractAction {
        // Build Zod schema lines
        const schemaLines: string[] = []
        // ...
        return {
            name: actionName,
            schemaLines,
            // ...
        }
    }
}
```

**Key Observations**:
1. ✅ **Pattern EXISTS for building action schemas**
2. ✅ **Uses ContractSchemaMapper for schema generation**
3. ✅ **Returns GeneratedContractAction**
4. 🔧 **Currently only handles REQUEST schemas (flat)**
5. 🔧 **Need SIMILAR component for RESPONSE schemas (nested)**

**Conclusion**:
- ✅ **Can CREATE ResponseActionBuilder following SAME pattern**
- ✅ **Reuse GeneratedContractAction interface (or extend it)**
- ✅ **Delegate to ResponseSchemaMapper (already complete in Step 5)**

---

## 📊 Architecture Discovery Summary

### What EXISTS (Reuse):
1. ✅ **Manifest routing pattern** - CompilerBridge.manifestToContractInput()
2. ✅ **Resource grouping logic** - routesByResource Map
3. ✅ **Resource name extraction** - extractResourceName()
4. ✅ **Response metadata extraction** - ResponseAnalysisPass pattern
5. ✅ **Action generation pattern** - ContractActionGenerator
6. ✅ **Artifact structure** - RequestTypesArtifact (extensible)

### What's MISSING (Implement):
1. ❌ **Response fields extraction** from `route.response.fields`
2. ❌ **Response data storage** in artifact
3. ❌ **Response action builder** (index/show schemas)
4. ❌ **Response schema integration** in ContractGeneratorPass.run()
5. ❌ **Response section** in ContractCodeBuilder

---

## 🎯 Revised Implementation Plan

### Based on Evidence, NOT Assumptions

### Component 1: EXTEND manifestToContractInput() (NOT new component)

**File**: `packages/cli/src/generators/CompilerBridge.ts`

**Changes**:
```typescript
// Add response fields extraction INSIDE existing loop
for (const route of routes) {
    const action = this.determineAction(route.method)
    
    // EXISTING: Parse validation rules
    const requestFields = this.parseValidationRulesPreserveNested(...)
    
    // NEW: Extract response fields
    const responseFields = this.extractResponseFields(route)
    
    // Store both in actions
}
```

**New Method**:
```typescript
/**
 * Extract response fields from route (NEW)
 * Adapts ResponseAnalysisPass pattern for field extraction
 */
private static extractResponseFields(
    route: ManifestRoute
): ParsedResponseField[] | null {
    if (!route.response || !route.response.fields) {
        return null
    }
    
    // Use ResponseFieldParser (from Step 1)
    const parser = new ResponseFieldParser()
    const fields: ParsedResponseField[] = []
    
    for (const [fieldName, fieldData] of Object.entries(route.response.fields)) {
        const parsed = parser.parseField(fieldName, fieldData)
        fields.push(parsed)
    }
    
    return fields
}
```

**Size**: +30-40 lines (method addition)
**Time**: 1 hour

---

### Component 2: EXTEND RequestTypesArtifact (NOT new artifact)

**File**: `packages/core/src/compiler/artifacts/RequestTypesArtifact.ts`

**Changes**:
```typescript
export interface RequestType {
    readonly resourceName: string
    readonly formTypeName: string
    readonly actions: readonly FormAction[]
    
    // NEW: Optional response data
    readonly responseData?: {
        readonly fields: readonly ParsedResponseField[]
        readonly routes: readonly ManifestRoute[]  // Original routes for action detection
    }
}
```

**Size**: +5-10 lines
**Time**: 15 minutes

---

### Component 3: CREATE ResponseActionBuilder (NEW, but small)

**File**: `packages/core/src/compiler/generators/contract-generation/ResponseActionBuilder.ts`

**Purpose**: Build response schemas (index/show)

**Pattern**: COPY ContractActionGenerator structure

**Interface**:
```typescript
export class ResponseActionBuilder {
    constructor(
        private responseSchemaMapper: ResponseSchemaMapper
    ) {}
    
    buildShowSchema(
        resourceName: string,
        fields: ParsedResponseField[]
    ): ActionResponseSchema {
        // Use ResponseSchemaMapper.mapActionResponse()
    }
    
    buildIndexSchema(
        resourceName: string,
        fields: ParsedResponseField[]
    ): ActionResponseSchema {
        // Same as show, but wrap in z.array()
    }
}
```

**Size**: ~80-100 lines
**Time**: 1.5 hours (including tests)

---

### Component 4: UPDATE ContractGeneratorPass.run() (NOT new pass)

**File**: `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Changes**:
```typescript
public run(inputs) {
    const requestTypesArtifact = inputs[0]
    
    // EXISTING: Process request types
    const requestContracts = this.processRequestTypes(requestTypesArtifact)
    
    // NEW: Process response types (if present)
    const responseSchemas = this.processResponseTypes(requestTypesArtifact)
    
    // UPDATED: Build with both
    const code = this.codeBuilder.buildCompleteContract(
        requestContracts,
        responseSchemas
    )
    // ...
}

// NEW method
private processResponseTypes(artifact: RequestTypesArtifact): ActionResponseSchema[] {
    const schemas: ActionResponseSchema[] = []
    
    for (const requestType of artifact.requestTypes) {
        if (!requestType.responseData) continue
        
        // Build schemas using ResponseActionBuilder
        // ...
    }
    
    return schemas
}
```

**Size**: +40-60 lines
**Time**: 1.5 hours (including tests)

---

### Component 5: UPDATE ContractCodeBuilder (NOT new builder)

**File**: `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`

**Changes**: Add response schemas section

**New Methods**:
1. `buildResponseSchemasSection()` - ~30 lines
2. `buildResponseValidatorsSection()` - ~25 lines
3. Update `buildCompleteContract()` - ~20 lines

**Size**: +75-100 lines
**Time**: 2 hours (including tests)

---

## 📋 Revised Implementation Steps

### Phase 1: Data Access (3 hours)

**Step 6.1**: Extend manifestToContractInput() (+30-40 lines)
- Add extractResponseFields() method
- Extract response.fields from routes
- **Test**: Unit test for extraction

**Step 6.2**: Extend RequestTypesArtifact (+5-10 lines)
- Add optional responseData field
- **Test**: Type check

### Phase 2: Action Building (2.5 hours)

**Step 6.3**: Create ResponseActionBuilder (~80-100 lines)
- Implement buildShowSchema()
- Implement buildIndexSchema()
- **Test**: 15-20 unit tests

### Phase 3: Integration (3.5 hours)

**Step 6.4**: Update ContractGeneratorPass (+40-60 lines)
- Add processResponseTypes() method
- Update run() to call it
- **Test**: 15-20 integration tests

**Step 6.5**: Update ContractCodeBuilder (+75-100 lines)
- Add buildResponseSchemasSection()
- Add buildResponseValidatorsSection()
- Update buildCompleteContract()
- **Test**: 15-20 unit tests

### Phase 4: E2E Testing (3 hours)

**Step 6.6**: E2E tests (20-25 tests)
- Test complete pipeline
- Test with real manifest

**Step 6.7**: Documentation (1 hour)

---

## ✅ Comparison: Original Plan vs Evidence-Based Plan

### Original Plan (3 new components):
- ResponseDataExtractor (~80-100 lines) ❌ **NOT NEEDED**
- ManifestRouteProvider (~60-80 lines) ❌ **NOT NEEDED**
- ResponseActionBuilder (~100-120 lines) ✅ **NEEDED**

**Total NEW code**: ~240-300 lines

### Evidence-Based Plan (1 new, 3 updates):
- EXTEND manifestToContractInput() (+30-40 lines) ✅
- EXTEND RequestTypesArtifact (+5-10 lines) ✅
- CREATE ResponseActionBuilder (~80-100 lines) ✅
- UPDATE ContractGeneratorPass (+40-60 lines) ✅
- UPDATE ContractCodeBuilder (+75-100 lines) ✅

**Total NEW code**: ~230-310 lines (similar)
**BUT**: Reuses existing patterns, less risk, better integration

---

## 🎯 Key Insights

### What We Learned:
1. **Manifest access pattern EXISTS** - Don't recreate it
2. **Resource grouping logic EXISTS** - Reuse it
3. **Response extraction pattern EXISTS** - Adapt it
4. **Artifact is extensible** - Add optional field, don't create new artifact
5. **Action generation pattern EXISTS** - Follow same structure

### Architecture Principles Validated:
- ✅ **Evidence-based > Assumptions**
- ✅ **Reuse > Recreate**
- ✅ **Extend > Replace**
- ✅ **Adapt existing patterns > Invent new ones**

### Time Savings:
- Original estimate: 16 hours
- Evidence-based estimate: 13 hours (19% faster)
- Reason: Less code to write, existing patterns to follow

---

## 🚀 Ready for Implementation

**Status**: EVIDENCE-BASED PLAN COMPLETE ✅

**Next Step**: Implement Step 6.1 (Extend manifestToContractInput)

**Confidence**: HIGH (based on existing code patterns, not assumptions)

---

*Last Updated*: 2026-08-08  
*Methodology*: Evidence-Based Architecture Analysis  
*Status*: Ready for Implementation
