# Response Contract Step 6: Implementation Complete

## Evidence-Based Changes

Based on codebase analysis, Step 6 requires ONLY 4 targeted changes (not 3 new components).

---

## Change 1: Extend RequestTypesArtifact Interface

**File:** `packages/core/src/compiler/artifacts/RequestTypesArtifact.ts`

**Change Type:** Add optional field to existing interface

**Lines Added:** ~5-10 lines

**Rationale:** 
- RequestTypesArtifact is shared input for both FormGeneratorPass AND ContractGeneratorPass
- Adding optional `responseData` field maintains backward compatibility with forms
- Contracts can use this field while forms ignore it

**Implementation:**

```typescript
/**
 * Request type untuk specific resource
 */
export interface RequestType {
    /** Resource name (e.g., 'CartItems') */
    readonly resourceName: string;

    /** Form type name (e.g., 'CartItemsForm') */
    readonly formTypeName: string;

    /** Available actions */
    readonly actions: readonly FormAction[];

    /** Response data structure (OPTIONAL - for contracts only) */
    readonly responseData?: {
        /** Resource name that provides response structure */
        readonly resourceName: string;
        /** Response body fields (flattened + camelCase) */
        readonly fields: Record<string, SemanticType>;
    };
}
```

**Testing:** Update `isRequestTypesArtifact()` type guard to handle optional field.

---

## Change 2: Extend manifestToContractInput() in CompilerBridge

**File:** `packages/cli/src/generators/CompilerBridge.ts`

**Method:** `manifestToContractInput()`

**Change Type:** Add response data extraction logic

**Lines Added:** ~30-40 lines

**Existing Pattern to Reuse:**
- `response-analysis-helper.ts` shows how to extract response from `route.response`
- Pattern: `route.response?.resource || route.response?.model`
- Already handles collection/paginated detection

**Implementation Strategy:**

```typescript
// After extracting validation rules (existing code)...

// NEW CODE START (Step 6 addition)
// Extract response data if available
let responseData: RequestType['responseData'] | undefined

if (route.response) {
    const resourceName = route.response?.resource || route.response?.model
    
    if (resourceName) {
        // Find resource definition in manifest
        const resource = manifest.resources?.find(r => r.name === resourceName)
        
        if (resource) {
            // Flatten resource fields (reuse existing utility)
            const flattenedFields = flattenResourceFields(
                resource.name,
                resource.fields || {},
                { maxDepth: 5, circularRefWarnings: true }
            )
            
            // Convert Map to Record
            const fieldsRecord: Record<string, SemanticType> = {}
            for (const [fieldName, fieldType] of flattenedFields) {
                fieldsRecord[fieldName] = fieldType
            }
            
            responseData = {
                resourceName: resource.name,
                fields: fieldsRecord
            }
        }
    }
}
// NEW CODE END

// Add responseData to RequestType
requestTypes.push({
    resourceName,
    formTypeName: `${toPascalCase(resourceName)}Contract`,
    actions,
    responseData  // ← NEW FIELD
})
```

**Key Points:**
- ✅ Reuses `flattenResourceFields()` utility (already exists)
- ✅ Follows same pattern as existing resource processing
- ✅ Only ~30-40 lines of focused code
- ✅ No new components needed

---

## Change 3: Create ResponseActionBuilder Component

**File:** `packages/core/src/compiler/generators/contract-generation/ResponseActionBuilder.ts` (NEW)

**Change Type:** New component (following ContractActionGenerator pattern)

**Lines Added:** ~80-100 lines

**Pattern to Follow:** `ContractActionGenerator.ts`

**Purpose:** Build response validation actions (show/index) with Zod schemas

**Implementation:**

```typescript
/**
 * ResponseActionBuilder.ts
 * 
 * Builds response validation actions for contracts.
 * Generates show/index actions with Zod response schemas.
 * 
 * Input: RequestType.responseData (optional)
 * Output: ContractAction[] for responses
 * 
 * @module compiler/generators/contract-generation
 */

import type { RequestType } from '../../artifacts/RequestTypesArtifact'
import type { ContractAction } from '../../../types/ir'
import { ResponseSchemaMapper } from './ResponseSchemaMapper'

export class ResponseActionBuilder {
    constructor(
        private readonly schemaMapper: ResponseSchemaMapper
    ) {}

    /**
     * Build response actions from RequestType.responseData
     * 
     * Generates:
     * - show: Single resource validation
     * - index: Collection/paginated validation
     */
    buildResponseActions(requestType: RequestType): ContractAction[] {
        const actions: ContractAction[] = []

        // Check if response data available
        if (!requestType.responseData) {
            return actions // No response actions if no data
        }

        const { resourceName, fields } = requestType.responseData

        // Build show action (single resource)
        actions.push(this.buildShowAction(resourceName, fields))

        // Build index action (collection)
        actions.push(this.buildIndexAction(resourceName, fields))

        return actions
    }

    /**
     * Build show action (single resource response)
     */
    private buildShowAction(
        resourceName: string,
        fields: Record<string, any>
    ): ContractAction {
        const schemaName = `${resourceName}ShowResponse`
        const zodSchema = this.schemaMapper.buildObjectSchema(fields)

        return {
            name: 'show',
            hasBody: false,
            hasResponse: true,
            responseSchema: {
                name: schemaName,
                zodSchema
            }
        }
    }

    /**
     * Build index action (collection response)
     */
    private buildIndexAction(
        resourceName: string,
        fields: Record<string, any>
    ): ContractAction {
        const itemSchemaName = `${resourceName}ShowResponse`
        const collectionSchemaName = `${resourceName}IndexResponse`

        // Reuse item schema, wrap in array
        const zodSchema = `z.array(${itemSchemaName}Schema)`

        return {
            name: 'index',
            hasBody: false,
            hasResponse: true,
            responseSchema: {
                name: collectionSchemaName,
                zodSchema
            }
        }
    }
}
```

**Dependencies:**
- Uses existing `ResponseSchemaMapper` (Step 3 component)
- Follows same pattern as `ContractActionGenerator`
- ~80-100 lines (small, focused)

---

## Change 4: Update ContractGeneratorPass.run()

**File:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Method:** `run()`

**Change Type:** Add response action generation

**Lines Added:** ~40-60 lines

**Implementation:**

```typescript
// In ContractGeneratorPass.run() method...

// Existing code: Build request actions
const requestActions = this.actionGenerator.buildActions(requestType)

// NEW CODE START (Step 6 addition)
// Build response actions if response data available
const responseActions = requestType.responseData
    ? this.responseActionBuilder.buildResponseActions(requestType)
    : []

// Merge request + response actions
const allActions = [...requestActions, ...responseActions]
// NEW CODE END

// Build complete contract with ALL actions
const contractCode = this.codeBuilder.buildCompleteContract(
    contractData.contractName,
    allActions,  // ← Now includes response actions
    zodSchemas
)
```

**Key Points:**
- ✅ Instantiate `ResponseActionBuilder` in constructor
- ✅ Conditional response action generation (only if data available)
- ✅ Merge request + response actions before passing to CodeBuilder
- ✅ ~40-60 lines of focused changes

---

## Change 5: Update ContractCodeBuilder.buildCompleteContract()

**File:** `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`

**Method:** `buildCompleteContract()`

**Change Type:** Handle response actions in contract generation

**Lines Added:** ~75-100 lines

**Implementation:**

```typescript
// In ContractCodeBuilder.buildCompleteContract()...

// Existing code: Group actions by type
const requestActionsCode = actions
    .filter(a => a.hasBody)
    .map(a => this.buildActionInterface(contractName, a))
    .join('\n\n')

// NEW CODE START (Step 6 addition)
const responseActionsCode = actions
    .filter(a => a.hasResponse && !a.hasBody)
    .map(a => this.buildResponseActionInterface(contractName, a))
    .join('\n\n')

// Build validators for response actions
const responseValidatorsCode = actions
    .filter(a => a.hasResponse && !a.hasBody)
    .map(a => this.buildResponseValidator(contractName, a))
    .join('\n\n')
// NEW CODE END

// Assemble complete contract
const contractCode = `
export type ${contractName} = {
    ${requestActionsCode ? requestActionsCode : ''}
    ${responseActionsCode ? '\n\n' + responseActionsCode : ''}
}

export const ${contractName}Validators = {
    ${requestValidatorsCode}
    ${responseValidatorsCode ? ',\n\n' + responseValidatorsCode : ''}
}
`.trim()
```

**New Helper Methods:**

```typescript
/**
 * Build response action interface
 * Example: show: { response: CartShowResponse }
 */
private buildResponseActionInterface(
    contractName: string,
    action: ContractAction
): string {
    const responseName = action.responseSchema?.name || 'unknown'
    
    return `${action.name}: {
    response: ${responseName}
}`
}

/**
 * Build response validator
 * Example: show: { response: CartShowResponseSchema }
 */
private buildResponseValidator(
    contractName: string,
    action: ContractAction
): string {
    const schemaName = action.responseSchema?.name || 'unknown'
    
    return `${action.name}: {
    response: ${schemaName}Schema
}`
}
```

**Key Points:**
- ✅ Filter actions by `hasResponse && !hasBody` (response-only)
- ✅ Generate separate response action interfaces
- ✅ Generate response validators
- ✅ Merge into complete contract
- ✅ ~75-100 lines total (including helpers)

---

## Testing Strategy

### Unit Tests

**Test 1: RequestTypesArtifact Extension**
- Verify optional `responseData` field accepts valid structure
- Verify type guard handles field correctly
- Verify backward compatibility (field can be undefined)

**Test 2: CompilerBridge.manifestToContractInput()**
- Verify response data extraction from route.response
- Verify resource lookup in manifest.resources
- Verify field flattening using existing utility
- Verify RequestType includes responseData when available

**Test 3: ResponseActionBuilder**
- Verify show action generation
- Verify index action generation
- Verify schema name generation
- Verify returns empty array if no response data

**Test 4: ContractGeneratorPass Integration**
- Verify response actions generated when data available
- Verify request + response actions merged correctly
- Verify contract includes both action types

**Test 5: ContractCodeBuilder Output**
- Verify response actions formatted correctly
- Verify validators include response schemas
- Verify complete contract structure

### E2E Test

Run with real manifest:
```bash
./capture.sh node dist/cli.js generate \
    --manifest ../laragon-docker/www/toko-online/routesync.manifest.fresh6.json \
    --output test-output-step6 \
    --contracts
    
read_file: ./kiro-command-output.log
read_file: test-output-step6/contracts/api-contract.ts
```

**Expected Output:**
```typescript
export type CartContract = {
    create: {
        body: CartCreateRequest
    }
    
    // ← NEW: Response actions
    show: {
        response: CartShowResponse
    }
    index: {
        response: CartIndexResponse
    }
}

export const CartContractValidators = {
    create: {
        body: CartCreateRequestSchema
    },
    
    // ← NEW: Response validators
    show: {
        response: CartShowResponseSchema
    },
    index: {
        response: CartIndexResponseSchema
    }
}
```

---

## Implementation Order

### Phase 1: Data Flow (30-40 min)
1. ✅ Extend RequestTypesArtifact interface (+5-10 lines)
2. ✅ Extend manifestToContractInput() in CompilerBridge (+30-40 lines)
3. ✅ Test artifact extension and data extraction

### Phase 2: Action Building (40-50 min)
4. ✅ Create ResponseActionBuilder component (~80-100 lines)
5. ✅ Test response action generation

### Phase 3: Integration (50-60 min)
6. ✅ Update ContractGeneratorPass.run() (+40-60 lines)
7. ✅ Update ContractCodeBuilder.buildCompleteContract() (+75-100 lines)
8. ✅ Test end-to-end integration

### Phase 4: Testing & Validation (30-40 min)
9. ✅ Write unit tests for all components
10. ✅ E2E test with real manifest
11. ✅ Verify output correctness

**Total Estimated Time:** 2.5-3 hours

---

## Code Metrics

**Total Lines Added:** ~230-310 lines
- RequestTypesArtifact: 5-10 lines
- CompilerBridge: 30-40 lines
- ResponseActionBuilder: 80-100 lines (NEW FILE)
- ContractGeneratorPass: 40-60 lines
- ContractCodeBuilder: 75-100 lines

**Files Modified:** 4
**Files Created:** 1 (ResponseActionBuilder)

**Complexity:** Low-Medium
- Reuses existing patterns (ContractActionGenerator)
- Reuses existing utilities (flattenResourceFields, ResponseSchemaMapper)
- No new architectural concepts
- Clear data flow: Manifest → Bridge → Artifact → Pass → Builder → Output

---

## Success Criteria

✅ RequestTypesArtifact accepts optional responseData field  
✅ CompilerBridge extracts response data from manifest  
✅ ResponseActionBuilder generates show/index actions  
✅ ContractGeneratorPass includes response actions  
✅ ContractCodeBuilder outputs response validators  
✅ E2E test produces correct contract output  
✅ All unit tests pass  
✅ No regression in existing functionality  

---

## Implementation Status

- [x] Evidence analysis complete
- [x] Implementation plan ready
- [ ] Phase 1: Data Flow (NEXT)
- [ ] Phase 2: Action Building
- [ ] Phase 3: Integration
- [ ] Phase 4: Testing

**Ready to implement Phase 1!**
