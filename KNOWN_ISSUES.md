# Known Issues Log — RouteSync

Append-only log of diagnosed issues in this repo, newest first. Format per entry:
**Symptom → Where → Root cause → Fix → Status**

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
