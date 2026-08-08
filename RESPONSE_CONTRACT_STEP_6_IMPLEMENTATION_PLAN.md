# Response Contract Step 6 - Implementation Plan

**Date**: 2026-08-08  
**Status**: Planning Phase  
**Architecture**: SOC + SOT + Small Components (Compiler-Grade)  
**Goal**: Wire ResponseSchemaMapper into ContractGeneratorPass pipeline

---

## 🎯 Overview

**Current State**: Steps 1-5 complete (86/86 tests passing)
- ✅ ResponseFieldParser
- ✅ ResponseStructureBuilder  
- ✅ NestedObjectSchemaBuilder
- ✅ ArraySchemaBuilder
- ✅ ResponseSchemaMapper

**Target State**: Complete integration with E2E tests
- Wire ResponseSchemaMapper into ContractGeneratorPass
- Update ContractCodeBuilder to build response schemas
- Add E2E tests with real manifest
- Verify generated contract files

---

## 📊 Architecture Analysis

### Current Pipeline (Request Only)

```
RequestTypesArtifact
      ↓
ContractGeneratorPass
      ↓ uses ContractActionGenerator
      ↓ uses ContractSchemaMapper (flat request schemas)
      ↓
ContractCodeBuilder.buildContractFile()
      ↓
4 Sections: Request Schemas, Request Types, Validators, Exports
      ↓
GeneratedContractArtifact
```

### Target Pipeline (Request + Response)

```
RequestTypesArtifact + Manifest Routes
      ↓
ContractGeneratorPass
      ├─→ Request Generation (existing)
      │   ├─→ ContractActionGenerator
      │   └─→ ContractSchemaMapper (flat)
      │
      └─→ Response Generation (NEW)
          ├─→ ResponseSchemaMapper (nested)
          └─→ Response action schemas
      ↓
ContractCodeBuilder.buildCompleteContract()
      ↓
6 Sections: 
  1. Request Schemas (flat)
  2. Response Schemas (nested) ← NEW
  3. Combined Types
  4. Request Validators
  5. Response Validators ← NEW
  6. Exports
      ↓
GeneratedContractArtifact (updated)
```

---

## 🏗️ Component Design

### Principle: Small Focused Components

**Each component has ONE responsibility:**
- **No god classes** (< 200 lines each)
- **Clear interfaces** between layers
- **Dependency injection** everywhere
- **Single Source of Truth** for data

---

## 📦 Implementation Components

### Component 1: ResponseDataExtractor (NEW)

**File**: `packages/core/src/compiler/generators/contract-generation/ResponseDataExtractor.ts`

**Responsibility**: Extract response data from manifest routes

**Why Separate Component?**
- SOC: Extraction logic separate from generation
- SOT: Single place for response data parsing
- Reusable: Can be used by other generators

**Interface**:
```typescript
/**
 * Extracts response data from manifest routes
 * 
 * SOC: Only data extraction, no schema generation
 * SOT: Manifest is source of truth
 */
export class ResponseDataExtractor {
  /**
   * Extract response fields from single route
   * 
   * @param route - Manifest route with response data
   * @returns Parsed response fields or null
   */
  extractResponseFields(
    route: ManifestRoute
  ): Record<string, ResponseFieldData> | null {
    // Check if route has response
    // Extract response.fields
    // Handle missing/invalid data
    // Return normalized structure
  }
  
  /**
   * Extract all responses for a resource
   * 
   * @param routes - Array of routes for same resource
   * @returns Map of action → response fields
   */
  extractResourceResponses(
    routes: ManifestRoute[]
  ): Map<RouteAction, Record<string, ResponseFieldData>> {
    // Group by action (index, show, etc)
    // Extract response for each action
    // Return organized map
  }
}
```

**Input**: ManifestRoute from manifest.json
**Output**: Parsed response field data

**Tests**: 15-20 tests
- Extract from valid route
- Handle missing response
- Handle invalid structure
- Extract for multiple actions
- Group by resource

**Size**: ~80-100 lines

---

### Component 2: ResponseActionBuilder (NEW)

**File**: `packages/core/src/compiler/generators/contract-generation/ResponseActionBuilder.ts`

**Responsibility**: Build response action schemas (index/show variants)

**Why Separate Component?**
- SOC: Action schema building separate from field parsing
- Clear API: index vs show schema generation
- Reusable: Can build any action type

**Interface**:
```typescript
/**
 * Builds response action schemas
 * 
 * SOC: Action schema building only
 * SOT: Uses ResponseSchemaMapper for field schemas
 */
export class ResponseActionBuilder {
  constructor(
    private responseSchemaMapper: ResponseSchemaMapper
  ) {}
  
  /**
   * Build show action schema (single resource)
   * 
   * @param resourceName - Resource name (e.g., 'checkout')
   * @param responseFields - Response fields structure
   * @returns Action schema with name and code
   */
  buildShowSchema(
    resourceName: string,
    responseFields: ParsedResponseField[]
  ): ActionResponseSchema {
    // Generate schema name: checkoutShowSchema
    // Build z.object() using ResponseSchemaMapper
    // Return complete schema
  }
  
  /**
   * Build index action schema (collection)
   * 
   * @param resourceName - Resource name
   * @param responseFields - Response fields structure
   * @returns Action schema wrapped in z.array()
   */
  buildIndexSchema(
    resourceName: string,
    responseFields: ParsedResponseField[]
  ): ActionResponseSchema {
    // Build single item schema
    // Wrap in z.array()
    // Generate schema name: checkoutIndexSchema
    // Return complete schema
  }
}
```

**Input**: Resource name + parsed fields
**Output**: ActionResponseSchema

**Tests**: 15-20 tests
- Build show schema
- Build index schema
- Handle empty fields
- Handle nested structures
- Naming conventions

**Size**: ~100-120 lines

---

### Component 3: ContractGeneratorPass Updates

**File**: `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Changes**: Add response generation orchestration

**New Dependencies**:
```typescript
export class ContractGeneratorPass {
  constructor(
    // Existing
    private requestSchemaMapper: ContractSchemaMapper,
    private requestActionGenerator: ContractActionGenerator,
    
    // NEW: Response generation
    private responseDataExtractor: ResponseDataExtractor,
    private responseSchemaMapper: ResponseSchemaMapper,
    private responseActionBuilder: ResponseActionBuilder,
    
    // Existing
    private codeBuilder: ContractCodeBuilder
  ) {}
}
```

**New Method 1: Generate Response Schemas**:
```typescript
/**
 * Generate response schemas for a resource
 * 
 * SOC: Orchestration only, delegates to specialized components
 */
private generateResponseSchemas(
  resourceName: string,
  routes: ManifestRoute[]
): ActionResponseSchema[] {
  const schemas: ActionResponseSchema[] = [];
  
  // Extract response data
  const responses = this.responseDataExtractor.extractResourceResponses(routes);
  
  // Build schemas for each action
  for (const [action, fields] of responses) {
    if (action === 'index') {
      const schema = this.responseActionBuilder.buildIndexSchema(
        resourceName,
        fields
      );
      schemas.push(schema);
    } else if (action === 'show') {
      const schema = this.responseActionBuilder.buildShowSchema(
        resourceName,
        fields
      );
      schemas.push(schema);
    }
  }
  
  return schemas;
}
```

**New Method 2: Update run() to include responses**:
```typescript
public run(
  inputs: ResolveArtifacts<readonly ['RequestTypes']>
): ResolveArtifacts<readonly ['GeneratedContract']> {
  // Existing: Process request types
  const requestContracts = this.processRequestTypes(requestTypesArtifact);
  
  // NEW: Generate response schemas
  const responseSchemas = this.generateResponseSchemas(
    resourceName,
    routes
  );
  
  // UPDATED: Build complete contract with both
  const code = this.codeBuilder.buildCompleteContract(
    requestContracts,
    responseSchemas  // NEW parameter
  );
  
  // Return artifact
}
```

**Tests**: 20-25 new tests
- Generate with responses
- Generate without responses
- Generate with both request+response
- Handle missing response data
- Integration tests

**Size**: +50-80 lines (total ~250-300 lines)

---

### Component 4: ContractCodeBuilder Updates

**File**: `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`

**Changes**: Add response schema section

**New Method 1: Build Response Schemas Section**:
```typescript
/**
 * Build Section 2: Response Schemas (NEW)
 * 
 * SOC: Only code building, no schema generation
 */
private buildResponseSchemasSection(
  lines: string[],
  responseSchemas: ActionResponseSchema[]
): void {
  lines.push('// ========== SECTION 2: Response Schemas ==========');
  
  if (responseSchemas.length === 0) {
    lines.push('// No response schemas generated');
    return;
  }
  
  // Group by resource
  const byResource = this.groupByResource(responseSchemas);
  
  // Generate exports for each resource
  for (const [resourceName, schemas] of byResource) {
    for (const schema of schemas) {
      lines.push(`export const ${schema.schemaName} = ${schema.zodSchema};`);
      lines.push('');
    }
  }
}
```

**New Method 2: Build Response Validators Section**:
```typescript
/**
 * Build Section 5: Response Validators (NEW)
 */
private buildResponseValidatorsSection(
  lines: string[],
  responseSchemas: ActionResponseSchema[]
): void {
  lines.push('// ========== SECTION 5: Response Validators ==========');
  
  for (const schema of responseSchemas) {
    const functionName = `validate${this.capitalize(schema.schemaName)}`;
    lines.push(`export const ${functionName} = (data: unknown) => {`);
    lines.push(`  return ${schema.schemaName}.parse(data);`);
    lines.push('};');
    lines.push('');
  }
}
```

**Updated Method: buildCompleteContract()**:
```typescript
/**
 * Build complete contract file (UPDATED)
 * 
 * Now includes response schemas
 */
buildCompleteContract(
  requestContracts: GeneratedContract[],
  responseSchemas: ActionResponseSchema[]  // NEW parameter
): BuiltContractCode {
  const lines: string[] = [];
  
  // Header + imports
  this.buildHeader(lines);
  
  // Section 1: Request Schemas (existing)
  this.buildRequestSchemasSection(lines, requestContracts);
  
  // Section 2: Response Schemas (NEW)
  this.buildResponseSchemasSection(lines, responseSchemas);
  
  // Section 3: Combined Types (updated)
  this.buildCombinedTypesSection(lines, requestContracts, responseSchemas);
  
  // Section 4: Request Validators (existing)
  this.buildRequestValidatorsSection(lines, requestContracts);
  
  // Section 5: Response Validators (NEW)
  this.buildResponseValidatorsSection(lines, responseSchemas);
  
  // Section 6: Exports (updated)
  this.buildExportsSection(lines, requestContracts, responseSchemas);
  
  return {
    code: lines.join('\n'),
    lineCount: lines.length,
    sections: [...]
  };
}
```

**Tests**: 20-25 new tests
- Build response section
- Build response validators
- Build combined contract
- Handle empty responses
- Integration with requests

**Size**: +100-150 lines (total ~300-350 lines)

---

### Component 5: Manifest Route Provider (NEW)

**File**: `packages/core/src/compiler/passes/ManifestRouteProvider.ts`

**Responsibility**: Provide manifest routes to ContractGeneratorPass

**Why Separate Component?**
- SOC: Route access separate from generation
- SOT: Single place to get manifest data
- Testable: Easy to mock for tests

**Interface**:
```typescript
/**
 * Provides manifest routes to passes
 * 
 * SOC: Route data access only
 * SOT: Manifest is source of truth
 */
export class ManifestRouteProvider {
  constructor(
    private manifest: Manifest
  ) {}
  
  /**
   * Get routes for a specific resource
   * 
   * @param resourceName - Resource name
   * @returns Array of routes for that resource
   */
  getRoutesForResource(resourceName: string): ManifestRoute[] {
    return this.manifest.routes.filter(
      route => this.extractResourceName(route) === resourceName
    );
  }
  
  /**
   * Extract resource name from route
   */
  private extractResourceName(route: ManifestRoute): string {
    // Parse route path to get resource name
    // Handle different formats
    // Return normalized name
  }
}
```

**Input**: Manifest
**Output**: Filtered routes

**Tests**: 10-15 tests
- Get routes for resource
- Handle missing resource
- Extract resource name
- Handle various path formats

**Size**: ~60-80 lines

---

## 🔄 Data Flow

### Complete Flow with All Components

```
Manifest (input)
      ↓
ManifestRouteProvider
      ↓ getRoutesForResource()
ContractGeneratorPass.run()
      ↓
      ├─→ Request Path (existing)
      │   ├─→ ContractSchemaMapper
      │   └─→ ContractActionGenerator
      │
      └─→ Response Path (NEW)
          ├─→ ResponseDataExtractor
          │   └─→ extractResourceResponses()
          ├─→ ResponseSchemaMapper
          │   └─→ mapActionResponse()
          └─→ ResponseActionBuilder
              └─→ buildIndexSchema() / buildShowSchema()
      ↓
ContractCodeBuilder.buildCompleteContract()
      ↓ (6 sections)
GeneratedContractArtifact
```

---

## 📝 Implementation Steps

### Phase 1: Data Access Layer (Day 1, Morning)

**Step 6.1**: ResponseDataExtractor
- ✅ Objective: Extract response data from manifest
- Create class
- Implement extraction methods
- Write 15-20 tests
- Verify all pass
- **Time**: 2 hours
- **Size**: ~80-100 lines

**Step 6.2**: ManifestRouteProvider
- ✅ Objective: Provide route access
- Create class
- Implement route filtering
- Write 10-15 tests
- Verify all pass
- **Time**: 1.5 hours
- **Size**: ~60-80 lines

**Checkpoint 1**: Can access and extract response data ✅

---

### Phase 2: Action Building Layer (Day 1, Afternoon)

**Step 6.3**: ResponseActionBuilder
- ✅ Objective: Build action schemas
- Create class with ResponseSchemaMapper dependency
- Implement show/index builders
- Write 15-20 tests
- Verify all pass
- **Time**: 2 hours
- **Size**: ~100-120 lines

**Checkpoint 2**: Can build complete action schemas ✅

---

### Phase 3: Pass Integration (Day 1, Evening)

**Step 6.4**: Update ContractGeneratorPass
- ✅ Objective: Orchestrate response generation
- Add new dependencies
- Implement generateResponseSchemas()
- Update run() method
- Write 20-25 tests
- Verify all pass
- **Time**: 2.5 hours
- **Size**: +50-80 lines

**Checkpoint 3**: Pass can generate both request+response ✅

---

### Phase 4: Code Building (Day 2, Morning)

**Step 6.5**: Update ContractCodeBuilder
- ✅ Objective: Build complete contract file
- Add buildResponseSchemasSection()
- Add buildResponseValidatorsSection()
- Update buildCompleteContract()
- Write 20-25 tests
- Verify all pass
- **Time**: 3 hours
- **Size**: +100-150 lines

**Checkpoint 4**: Complete contract file generated ✅

---

### Phase 5: E2E Testing (Day 2, Afternoon)

**Step 6.6**: E2E Tests
- ✅ Objective: Verify complete pipeline
- Test with real manifest
- Verify generated file structure
- Test TypeScript compilation
- Performance benchmarks
- **Time**: 2 hours
- **Tests**: 15-20 E2E tests

**Step 6.7**: Real Manifest Test
- ✅ Objective: Test with toko-online manifest
- Use `/home/annas-zen/Documents/laragon-docker/www/toko-online/routesync.manifest.fresh6.json`
- Generate contracts
- Verify output structure
- Check TypeScript compilation
- **Time**: 1 hour

**Checkpoint 5**: Full pipeline working with real data ✅

---

### Phase 6: Documentation (Day 2, Evening)

**Step 6.8**: Component Documentation
- Document each new component
- Add usage examples
- Document data flow
- **Time**: 1 hour

**Step 6.9**: Update Main Docs
- Update RESPONSE_CONTRACT_GENERATION_PLAN.md
- Create completion report
- Update quick summary
- **Time**: 0.5 hours

**Checkpoint 6**: Feature complete and documented ✅

---

## 📁 New Files Structure

```
packages/core/src/compiler/generators/contract-generation/
├── ResponseDataExtractor.ts          # NEW (Step 6.1)
├── ResponseActionBuilder.ts          # NEW (Step 6.3)
└── __tests__/
    ├── ResponseDataExtractor.test.ts # NEW
    └── ResponseActionBuilder.test.ts # NEW

packages/core/src/compiler/passes/
├── ManifestRouteProvider.ts          # NEW (Step 6.2)
├── ContractGeneratorPass.ts          # UPDATE (Step 6.4)
└── __tests__/
    ├── ManifestRouteProvider.test.ts # NEW
    └── ContractGeneratorPass.test.ts # UPDATE

packages/core/src/compiler/generators/contract-generation/
├── ContractCodeBuilder.ts            # UPDATE (Step 6.5)
└── __tests__/
    └── ContractCodeBuilder.test.ts   # UPDATE

packages/core/src/compiler/passes/__tests__/
└── e2e-contract-generation.test.ts   # NEW (Step 6.6)
```

---

## 🧪 Test Coverage Plan

### New Components Tests
- ResponseDataExtractor: 15-20 tests (~80-100 lines)
- ManifestRouteProvider: 10-15 tests (~60-80 lines)
- ResponseActionBuilder: 15-20 tests (~100-120 lines)

### Updated Components Tests
- ContractGeneratorPass: +20-25 tests (~150-180 lines)
- ContractCodeBuilder: +20-25 tests (~150-180 lines)

### Integration Tests
- E2E contract generation: 15-20 tests (~200-250 lines)
- Real manifest tests: 5-10 tests (~80-100 lines)

**Total New Tests**: ~80-115 tests
**Total Test Code**: ~720-1010 lines

---

## ⚡ Performance Targets

### Component Performance
- ResponseDataExtractor: < 10ms per route
- ResponseActionBuilder: < 5ms per action
- Complete generation: < 2s for 100 routes

### Memory Targets
- Peak memory: < 200MB for 1000 routes
- No memory leaks (stable over time)

---

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] Extract response data from manifest
- [ ] Build show action schemas
- [ ] Build index action schemas
- [ ] Generate complete contract file (6 sections)
- [ ] All tests passing (Steps 1-6)
- [ ] TypeScript compilation successful
- [ ] Real manifest test passes

### Code Quality Requirements
- [ ] All components < 200 lines
- [ ] Clear SOC boundaries
- [ ] No duplicate logic (SOT)
- [ ] Dependency injection throughout
- [ ] Test coverage > 90%

### Performance Requirements
- [ ] Generation < 2s for 100 routes
- [ ] Memory usage < 200MB
- [ ] No memory leaks

---

## 🎯 Success Metrics

### Quantitative
- **Total components**: 3 new + 2 updated = 5 components
- **Average component size**: ~100 lines (target < 200)
- **Test coverage**: > 90% (target)
- **Generation speed**: < 2s for 100 routes
- **Total implementation time**: ~16 hours over 2 days

### Qualitative
- ✅ Clean separation of concerns
- ✅ Single source of truth maintained
- ✅ Small reusable components
- ✅ Clear data flow
- ✅ Easy to test and maintain

---

## 🚀 Rollout Plan

### Internal Testing (Day 3)
- Run full test suite
- Test with multiple manifests
- Performance profiling
- Bug fixes

### Beta Release (Day 4)
- Release as beta feature
- Get user feedback
- Monitor for issues

### Production Release (Day 5)
- Mark as stable
- Update documentation
- Announce feature

---

## 📊 Dependency Graph

```
ResponseDataExtractor (no deps)
         ↓
ManifestRouteProvider (uses ResponseDataExtractor)
         ↓
ResponseActionBuilder → ResponseSchemaMapper
         ↓
ContractGeneratorPass (orchestrates all)
         ↓
ContractCodeBuilder (builds final output)
         ↓
GeneratedContractArtifact
```

**Clear Direction**: No circular dependencies ✅

---

## 🔧 Risk Mitigation

### Risk 1: Integration Complexity
**Mitigation**: Small incremental steps with checkpoints

### Risk 2: Test Failures
**Mitigation**: Write tests alongside implementation

### Risk 3: Performance Issues
**Mitigation**: Benchmark at each checkpoint

### Risk 4: Breaking Changes
**Mitigation**: Backward compatible updates

---

## 📚 Reference Files

### To Read Before Implementation
- `ContractGeneratorPass.ts` - Understand current structure
- `ContractCodeBuilder.ts` - Understand code building
- `ResponseSchemaMapper.ts` - Understand schema mapping
- `RESPONSE_CONTRACT_GENERATION_PLAN.md` - Overall context

### To Reference During Implementation
- `FormGeneratorPass.ts` - Similar pass structure
- `ContractSchemaMapper.ts` - Request schema mapping
- `ContractActionGenerator.ts` - Action generation pattern

---

## ✅ Ready to Implement

**Status**: IMPLEMENTATION READY 🚀

**Next Action**: Start with Step 6.1 (ResponseDataExtractor)

**Estimated Total Time**: 16 hours (2 days)

**Expected Outcome**: Complete Response Contract Generation feature with full E2E tests

---

*Last Updated*: 2026-08-08  
*Architecture*: Compiler-Grade SOC/SOT  
*Status*: Planning Complete - Ready for Implementation
