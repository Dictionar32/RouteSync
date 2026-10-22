# Phase 2062 — Grouped PHP Class-Import Resolution, Interface First

## Trace finding

The class-name environment parser previously treated any grouped `use` statement as an incomplete class-import inventory. That was conservative, but unnecessarily blocked resolvable PHP references such as `use App\\Http\\{BaseController as ParentController, Models\\User};`. It also treated a comma-separated non-grouped import statement as one target instead of separate import bindings.

## Change

`controllerDeclarationParser.ts` now projects import syntax into the existing `PhpClassImportBinding` contract:

- grouped imports retain their shared namespace prefix and expand each member into a binding;
- explicit aliases are preserved;
- nested member paths are joined to the grouped prefix;
- class imports mixed with `function` and `const` imports do not incorrectly make the class-import inventory incomplete;
- multiple non-grouped imports in one statement are parsed as distinct bindings;
- malformed or unsupported import syntax remains incomplete rather than being silently treated as an empty inventory.

The same phase also closes a related facade-identity gap: static-call origin rules now match `Illuminate\Support\Facades\DB` by canonical class identity, not by the raw short token `DB`. The existing class-reference resolution rule resolves explicit imports, aliases, fully qualified names, and namespace-relative names before rule matching. Consequently, `use Illuminate\Support\Facades\DB as Database; Database::table('posts')` is recognized, while an unimported `DB::table(...)` inside a namespace is not silently treated as the Laravel facade.

No parallel name-resolution authority was introduced: `ControllerStaticCallOriginAuthorityInterface` now exposes the existing class-reference resolution rule, and both facade applicability and model identity use that same judgment. The origin contract advances to version 7. No `relation/foundation` subscanner was added.

## Semantics

This is an evidence-projection improvement, not a new resolution authority. The parser records import bindings; the existing upstream resolution judgment still resolves the class name against namespace/import context and canonical model identities. Runtime does not guess from short class names.

## Verification boundary

The Phase 2062 structural audit is registered as `audit:phase2062-grouped-class-import-resolution-interface-first`. Vitest regression files cover grouped aliases, nested members, mixed class/function/constant groups, comma-separated imports, canonical DB facade aliases, fully qualified facade references, and the negative case for an unimported short `DB` name. Full TypeScript typecheck, build, and Vitest execution are not claimed unless run separately.
