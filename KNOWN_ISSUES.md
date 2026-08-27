# Known Issues & Bug History

### Issue 28: Elimination of Empty `export const *ContractSchema = {};` Boilerplate for GET-Only Resources
**Symptom** → Resources with zero request payload actions (such as GET-only endpoints `/categories` and `/produk`) generated empty object declarations `export const categoriesContractSchema = {};` in `api-contract.ts`.
**Where** → `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts` (`buildContractFile`).
**Root cause** → `ContractCodeBuilder` iterated all resources in `contracts` without filtering out resources with `actions.length === 0`.
**Fix** → Filtered `contracts` to `requestContracts = contracts.filter(c => c.actions.length > 0)` before emitting request schemas, types, validators, and exports in `ContractCodeBuilder.ts`.
**Regression test** → `packages/sdk/tests/cleanEmptyContractSchema.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 27: Object & Array-of-Object Element Typing in `api-form.ts` (`Array<object>` TS2339)
**Symptom** → `FormActionGenerator` converted `ObjectType` array elements to generic `object` (`items?: Array<object>`), causing TS2339 errors in `api-mapper.ts` when accessing `item.produkItemId` or `item.qty`.
**Where** → `packages/core/src/compiler/generators/form-generation/FormActionGenerator.ts` (`convertSemanticTypeToString`).
**Root cause** → `convertSemanticTypeToString` returned string literal `'object'` when `type.kind === 'object'` instead of recursively printing inline object property shape `{ produkItemId: string; qty: number }`.
**Fix** → Updated `convertSemanticTypeToString` in `FormActionGenerator.ts` to recursively format `ObjectType` properties into typed inline object declarations `{ propName: propType }` with camelCase property formatting.
**Regression test** → `packages/sdk/tests/formObjectArrayElementTyping.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 26: Form Type Import Directory Path Correction (`forms/api-form.ts` vs `types/api-form.ts`)
**Symptom** → `api-mapper.ts` imported form types from `../types/api-form` (an obsolete legacy directory) instead of `../forms/api-form` (the SSOT path produced by `FormGeneratorPass`), causing type mismatches with outdated form definition files.
**Where** → `packages/core/src/compiler/passes/MapperGeneratorPass.ts` & `packages/cli/src/generators/layers/MapperEmitter.ts`.
**Root cause** → `MapperGeneratorPass` and `MapperEmitter` emitted `from '../types/api-form'` instead of `from '../forms/api-form'`.
**Fix** → Updated `MapperGeneratorPass.ts` and `MapperEmitter.ts` to emit `import type { ... } from '../forms/api-form'`.
**Regression test** → `packages/sdk/tests/formNumericFieldTyping.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 25: Untyped Array Wildcard Diagnostic Warning & Rejection of `as any` Fallbacks
**Symptom** → When array wildcard validation rules lacked explicit primitive types (e.g. `'detail' => 'sometimes|array'`, `'detail.*' => 'sometimes'`), `ContractSchemaMapper` guessed `z.string()` while `FormFieldMapper` inferred `unknown[]`, causing type mismatch TS errors in `api-mapper.ts`.
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` (`parseValidationRulesPreserveNested`, `parseValidationRules`) & `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (`buildFormFieldLine`).
**Root cause** → Compiler attempted to guess primitive types or force `as any` type casts instead of remaining epistemically honest and emitting a compiler diagnostic warning.
**Fix** → 
1. Completely removed all `as any` type casts from `MapperGeneratorPass.ts`.
2. Added compiler diagnostic warning in `manifestToContractInput` when an array wildcard rule lacks an explicit primitive type rule (`string`, `numeric`, `integer`, `boolean`, `file`, etc.), prompting developers to update their Laravel validation rules (e.g., `'detail.*' => 'sometimes|string'`).
3. Set fallback element type for untyped array wildcards to `unknown` so types remain epistemically honest without guessing.
**Regression test** → `packages/sdk/tests/formMapperDiagnosticAndTypeSafety.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 24: Explicit Return Type Annotation for Form Mappers (`toApi*Create` / `toApi*Update`)
**Symptom** → Form mapper functions (e.g. `toApiRegisterCreate`) lacked explicit return type annotations (`: RegisterContract['create']`), relying on TypeScript return type inference.
**Where** → `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (`buildFormMapper`).
**Root cause** → `MapperGeneratorPass.ts` did not add `${contractTypeName}['${action.name}']` return type annotations or import contract types for form request types.
**Fix** → Updated `MapperGeneratorPass.ts` to add `contractImports.add(contractTypeName)` and emit `: ${contractTypeName}['${action.name}']` for all generated form mappers.
**Regression test** → `packages/sdk/tests/formMapperExplicitReturnType.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 23: Alignment & Type Safety Fixes in Transformed Types and Mappers (`LoginTransformed`, `OrdersTransformed`, `PaymentResource`)
**Symptom** → 
1. `LoginTransformed` in `api-read.ts` generated `dataUserId` while `toLoginRead` in `api-mapper.ts` emitted `userId: api.data.user?.id` (`ts2353`).
2. `OrdersTransformed` retained unflattened nested objects (`promotion`, `shipping`) while `OrderResourceTransformed` was flattened (`promotionCode`), causing `toOrdersRead` type mismatch (`ts2322`).
3. `PaymentResourceTransformed` duplicate key `orderId` (`ts1117`) and loss of `nullable: true` (`ts2322`).
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` (`manifestToSemanticTypes`, `flattenSemanticTypeFields`), `packages/cli/src/generators/utils/resource-flattening.ts` (`flattenResourceField`), & `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (`buildFieldMappingLine`).
**Root cause** → 
1. `MapperGeneratorPass` did not track `targetPropKey` (compound camelCase) and `jsonPath` (backend JS path) separately during nested `ObjectType` recursion.
2. `flattenSemanticTypeFields` did not check if collection element types referenced existing resources in `manifest.resources` (`OrderResource`), generating redundant unflattened nested objects instead of referencing `OrderResourceTransformed`.
3. `flattenResourceField` in `resource-flattening.ts` lost `nullable: true` metadata on primitive fields.
**Fix** → 
1. Refactored `buildFieldMappingLine` in `MapperGeneratorPass.ts` to separate `targetPropKey` and `jsonPath` during `ObjectType` recursion.
2. Updated `flattenSemanticTypeFields` to map resource collection elements to `ReferenceType` pointing to `${Resource}Transformed`.
3. Updated `flattenResourceField` in `resource-flattening.ts` to preserve `nullable: true` using `markNullableSemanticType`.
**Regression test** → `packages/sdk/tests/mapperConsistencyAndTypeSafety.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 22: Object Flattening (ALLOWED) & Array Preservation (MANDATORY) for Inline Responses
**Symptom** → Inline controller responses containing scalar nested objects and array collections (e.g. `/produk/{id}/reviews` with `summary` object and `reviews.data` array of `ProductReview` models) degraded to generic `summary: object; reviews: object;` or `reviewsData: object[]` without flattening scalar object properties into top-level camelCase fields.
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` (`manifestToSemanticTypes`), `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts` & `packages/core/src/compiler/passes/MapperGeneratorPass.ts`.
**Root cause** → 
1. `manifestToSemanticTypes` retained nested `ObjectType` shapes instead of flattening scalar object properties into compound camelCase keys (`summary.avg_rating` $\to$ `summaryAvgRating`).
2. `MapperGeneratorPass` generated nested mapper object structures for inline responses instead of mapping compound camelCase fields (`summaryAvgRating: api.summary?.avg_rating`).
**Fix** → 
1. Updated `manifestToSemanticTypes` with `flattenSemanticTypeFields` to flatten scalar object properties into top-level camelCase fields (`summaryAvgRating`, `summaryTotalReview`) while preserving array collections (`reviewsData: { id, produkItemId, ... }[]`).
2. Updated `MapperGeneratorPass.ts` to map flattened scalar fields (`summaryAvgRating: api.summary?.avg_rating`) and array element callbacks (`reviewsData: api.reviews.data?.map(item => ({ ... }))`) without introducing any `any` type annotations.
**Regression test** → `packages/sdk/tests/inlineResponseObjectFlattenArrayPreserve.spec.ts` & `packages/sdk/tests/inlineModelCollectionCamelCase.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 21: Inline Responses Omitted from `api-read.ts` & Fallback to Identity Mappers
**Symptom** → Inline controller responses (e.g. `/profile`, `/login`, `/cart`, `/payment/webhook`) did not generate `*Transformed` interfaces in `api-read.ts` and generated fallback identity mappers (`(api: ProfileApiResponse): ProfileApiResponse => ({ ... })`) retaining `snake_case` keys instead of mapping to camelCase frontend domain types.
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` (`manifestToSemanticTypes`) & `packages/core/src/compiler/passes/MapperGeneratorPass.ts`.
**Root cause** → 
1. `manifestToSemanticTypes` only processed explicit resources in `manifest.resources`, omitting inline response objects extracted from routes.
2. `MapperGeneratorPass` fell back to returning `${resource}ApiResponse` directly when a corresponding `${resource}Transformed` interface was missing in `api-read.ts`.
**Fix** → 
1. Updated `manifestToSemanticTypes` to extract all inline route response objects into `SemanticTypesArtifact`, generating `*Transformed` interfaces (e.g. `ProfileTransformed`, `LoginTransformed`, `ProdukReviewsTransformed`) with camelCase properties in `api-read.ts`.
2. Updated `MapperGeneratorPass` to universally generate `toXRead` mappers converting raw `snake_case` `*ApiResponse` structures to `camelCase` `*Transformed` domain objects for all API responses.
**Regression test** → `packages/sdk/tests/inlineResponseCamelCaseTransformation.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 20: Any Fallback & Redundant Identity Mappers in MapperGeneratorPass
**Symptom** → Child resource mappers generated parameter as `(api: any)`, and non-resource plain responses (e.g. `Profile`, `PaymentWebhook`) generated redundant identity mappers (`api-contract` to `api-contract`).
**Where** → `packages/core/src/compiler/passes/MapperGeneratorPass.ts` & `packages/cli/src/generators/utils/manifest-to-types.ts`.
**Root cause** → 
1. `MapperGeneratorPass` relied on an `isTopLevel` boolean flag to determine contract type availability instead of checking `availableContractTypes`.
2. `manifestToContractInput` skipped child resources that lacked top-level route endpoints (e.g. `OrderDetailResource`).
3. `MapperGeneratorPass` generated identity mappers for non-resource responses instead of restricting read mappers strictly to Eloquent JsonResources (Category A).
**Fix** → 
1. Updated `MapperGeneratorPass` to resolve `apiResponseType` dynamically from `availableContractTypes` and throw a diagnostic error if missing.
2. Filtered `requestTypes.responseData` in `MapperGeneratorPass` to only generate read mappers for Eloquent JsonResources (ending in `Resource`), omitting Category B identity mappers.
3. Updated `manifestToContractInput` to recursively discover and register contract-reachable child resources.
**Regression test** → `packages/sdk/tests/eloquentOnlyReadMappers.spec.ts`, `packages/sdk/tests/existingContractMapperTyping.spec.ts` & `packages/sdk/tests/strictChildResourceMapperTyping.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 19: Eloquent Resource Collection Field Fallback to `unknown` / `object[]`
**Symptom** → Array collection fields referencing child Eloquent Resources (such as `items: OrderDetailResource::collection($this->details)`) in `OrderResource` fell back to `items: unknown` or `items: object[]` in `api-read.ts`, causing TypeScript assignment errors in `api-mapper.ts`.
**Where** → `packages/cli/src/generators/utils/resource-flattening.ts` (handling of `static_method_call` & `resolved` resource references) and `packages/core/src/compiler/passes/MapperGeneratorPass.ts` (resolution of `elemResourceName` for `Transformed` suffix).
**Root cause** → 
1. `flattenResourceField` hit default branch for `kind: "static_method_call"` and failed to inspect `field.resolved.resource` / `field.resolved.collection`, evaluating `typeName` as `unknown`.
2. `MapperGeneratorPass` checked `elem.name.endsWith('Resource')`, which failed when `elem.name` was `OrderDetailResourceTransformed`.
**Fix** →
1. Updated `resource-flattening.ts` to inspect `rawField.resource || resolved.resource || rawField.className` and `resolved.collection`.
2. Updated `MapperGeneratorPass.ts` to strip `Transformed` suffix (`elem.name.replace(/Transformed$/, '')`) when resolving `elemResourceName`.
**Regression test** → `packages/sdk/tests/e2eMapperGeneration.spec.ts` › `should resolve static_method_call OrderDetailResource::collection and generate items.map(toOrderDetailResourceRead)` & `packages/sdk/tests/itemsCollectionMapperTypeResolution.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 18: Preservasi Field Nested Eloquent Resource pada `api-read.ts` & Overwrite Legacy Generator
**Symptom** → Property nested resource pada `api-read.ts` ter-flatten secara terpisah atau ter-overwrite oleh legacy generator.
**Where** → `packages/cli/src/generators/utils/manifest-to-types.ts` & `packages/cli/src/commands/generate.ts`
**Root cause** → Overwrite oleh `ZodTierGenerator` dan penanganan `processResources` yang belum lengkap.
**Fix** → Tambah flag `compilerBridgeSuccess` dan penataan `flattenResourceFields`.
**Regression test** → `packages/sdk/tests/nestedResourcePreservation.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 17: Assignment scanner skip closure-return false positive
**Symptom** → Assignment di dalam closure ter-skip jika ekspresi mengandung kata `return`.
**Where** → `LaravelRouteParser.ts`
**Root cause** → Guard regex mencocokkan kata `return` di mana saja dalam ekspresi assignment.
**Fix** → Pastikan hanya match `return` di posisi paling depan ekspresi.
**Regression test** → `packages/sdk/tests/laravelParserAssignments.spec.ts`
**Status** → Diagnosed & Fixed

---

### Issue 16: `updateOrCreate` tidak tracked di Level 90
**Symptom** → Field hasil `updateOrCreate` ter-resolve sebagai `z.unknown()`.
**Where** → `LaravelRouteParser.ts`
**Root cause** → `updateOrCreate` belum ada di regex Level 90.
**Fix** → Tambahkan `updateOrCreate`, `firstOrCreate`, `forceCreate`, dll. ke regex Level 90.
**Regression test** → `packages/sdk/tests/laravelParserValidateAndModelFallback.spec.ts`
**Status** → Diagnosed & Fixed
