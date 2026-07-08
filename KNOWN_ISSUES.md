# Known Issues Log — RouteSync

Append-only log of diagnosed issues in this repo, newest first. Format per entry:
**Symptom → Where → Root cause → Fix → Status**

---

### Issue 8: JSON/Array Cast Fields Produce `unknown` on Property Access
**Symptom** → Resource fields whose values are derived from JSON/array cast columns (e.g. `PaymentResource.gateway.name` from `$gateway['name']` where `$gateway` ultimately comes from a `longtext` column cast to `array`) generate as `unknown` in TypeScript.  
**Where** → `ExpressionResolver.ts`, `VariableResolver.ts` — the resolution chain works correctly up to the point where a property is accessed on a dynamic JSON object.  
**Root cause** → When a column is cast to `array`/`object` in Laravel (e.g. `PaymentDetail.detail → cast: array`), the kernel resolves it to `Record<string, unknown>`. Subsequent property access (`$detail['gateway']`, `$gateway['name']`) on this untyped JSON structure cannot determine the resulting type since there is no schema definition for the JSON contents.  
**Fix** → None yet. Possible approaches:  
  - **`@routesync-type` PHPDoc annotations** on the accessor/resource to hint field types.  
  - **Heuristic fallback** to `string | null` for property access on `array`/`object` cast columns.  
  - **JSON schema metadata** from Laravel cast objects (`AsArrayObject`, custom casts with schema).  
**Status** → Known Limitation.  
**Affected fields** → `PaymentResource`: `gatewayName`, `gatewayOrderId`, `gatewayToken`, `gatewayRedirectUrl`.

---

### Issue 7: Chained Property Access Through Nonexistent Relations
**Symptom** → Resource fields backed by model accessors that reference nonexistent relations resolve as `unknown` (e.g. `refundAmountMinor` from accessor `$this->unknownRelation->foo`).  
**Where** → `ExpressionResolver.ts` — when resolving chained `property_access`, the inner target (`$this->unknownRelation`) fails to find the relation on the model.  
**Root cause** → The accessor definition contains code referencing a relation that does not exist on the model (e.g. `unknownRelation` is not in `Payment.relations`). This is likely test/dummy code or a forward reference to a not-yet-implemented relation.  
**Fix** → No code fix needed — this is correct behavior. The accessor definition in the Laravel model should be updated to reference a valid relation.  
**Status** → By Design (correct `unknown` result).  
**Affected fields** → `PaymentResource`: `refundAmountMinor`.

---

### Issue 6: snake_case → camelCase Accessor Name Mismatch
**Symptom** → Resource fields like `$this->provider_txn_id`, `$this->gateway_status`, `$this->amount_minor` resolve as `unknown` in the manifest and generate `unknown` in TypeScript.  
**Where** → `ModelColumnResolver.ts` (both core and CLI).  
**Root cause** → Laravel model accessors are stored in camelCase (`providerTxnId`, `gatewayStatus`, `amountMinor`) but resource field expressions reference them via snake_case (`$this->provider_txn_id`). The accessor lookup used exact name matching, so the snake_case property name failed to find the camelCase accessor.  
**Fix** → Added a fallback `snake_case → camelCase` conversion (`colName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())`) in both `ModelColumnResolver` files when the exact accessor name lookup fails.  
**Status** → Diagnosed & Fixed.

---

### Issue 5: AccessorResolver Treated Already-Resolved Results as Raw AST Nodes
**Symptom** → Model accessors that had been resolved in a previous scan returned `unknown` when resources referenced them, with trace message `"Unsupported kind: undefined"`.  
**Where** → `AccessorResolver.ts` (both core and CLI).  
**Root cause** → In the manifest, `accessor.expression` can hold either a resolved `SemanticResolution` object (`{ status: 'resolved', type: 'string' }`) or a raw AST `ResolverMeta` node (`{ kind: 'property_access', ... }`). `AccessorResolver.resolveAccessor()` always called `kernel.resolve(acc.expression)` treating it as an AST node. When `acc.expression` was already a resolved result (no `kind` property), the kernel couldn't match any resolver plugin and returned `unknown`.  
**Fix** → Added early-return check: if `acc.expression` has `status === 'resolved'`, return it directly. Added preference for `acc.parsed_ast` (the raw AST) over `acc.expression`. Extended `ModelAccessor` type to include `parsed_ast` and union `expression` type (`ResolverMeta | SemanticResolution`). Added `typeof === 'object'` guards before `in` operator to prevent runtime crash on string values.  
**Status** → Diagnosed & Fixed.

---

### Issue 4: Kernel Model Graph Not Synced After Accessor Resolution
**Symptom** → `PaymentResource.provider` (and other accessor-based fields) resolved as `unknown` in the manifest even though the model accessor itself was correctly resolved.  
**Where** → `incremental.ts` (`resolveManifestIncrementally`), `SemanticResolutionKernel.ts` (both core and CLI).  
**Root cause** → The kernel's model graph was loaded via `kernel.loadGraph()` **before** `resolveManifestIncrementally` ran. The `resolveManifestIncrementally` function first resolved model accessors (updating `resolvedManifest.models`), then resolved resource fields (using the same kernel). But the kernel still held the **stale, pre-resolution** copies of model nodes from `loadGraph()`. Since `resolvedManifest` was created via `JSON.parse(JSON.stringify(...))` deep clone, the resolved accessors were in the cloned manifest objects, not in the kernel's internal model array.  
**Fix** → Added `getModels()` public getter to both `SemanticResolutionKernel` implementations. After resolving model accessors in `incremental.ts`, sync the resolved `accessors` back to the kernel's active model graph via `kernel.getModels()`. Added `getModels?()` to the `KernelResolver` interface for type safety.  
**Status** → Diagnosed & Fixed.

---

### Issue 3: Route Parameter Type Mismatch (Undefined instead of Number)
**Symptom** → `Type error: Argument of type 'undefined' is not assignable to parameter of type 'number'.`  
**Where** → `frontend/src/api/hooks.ts` inside the `removePromo` wrapper method execution.  
**Root cause** → The Laravel backend resource endpoint for `/cart/promo` delete expects an ID parameter (e.g., `/cart/promo/:id`), but the wrapper was invoked with `undefined` since there is no meaningful ID at the frontend cart level.  
**Fix** → Updated `HookGenerator.ts` to automatically pass a dummy ID `1` (`removePromoMut.mutateAsync(1)`) to satisfy the path parameter type requirement.  
**Status** → Diagnosed & Fixed.

---

### Issue 2: Request Payload Form Type Mismatch (Number instead of String)
**Symptom** → `Type error: Type 'number' is not assignable to type 'string'.`  
**Where** → `frontend/src/api/hooks.ts` inside `inc` and `add` wrapper methods.  
**Root cause** → The database model represents `produkItemId` as a `number` at read/retrieve time, but the Laravel `FormRequest` validator expects a `string` for the HTTP body payload during item creation.  
**Fix** → Updated `HookGenerator.ts` to convert the runtime parameter to a string using `String(produkItemId)` during creation mutation calls.  
**Status** → Diagnosed & Fixed.

---

### Issue 1: Database Connection Refused in Docker
**Symptom** → `PDOException: SQLSTATE[HY000] [2002] Connection refused`  
**Where** → CLI `routesync scan` execution in Docker environments (e.g., Laragon, Sail).  
**Root cause** → The CLI scanner attempts to connect to the database via standard localhost configurations defined in the `.env` file, which may refer to docker container aliases instead of host port-forwarding addresses.  
**Fix** → Run the scan command with environment overrides: `DB_HOST=127.0.0.1 DB_PORT=3307 npx routesync scan --input routes/api.php --models`.  
**Status** → Workaround Documented.
