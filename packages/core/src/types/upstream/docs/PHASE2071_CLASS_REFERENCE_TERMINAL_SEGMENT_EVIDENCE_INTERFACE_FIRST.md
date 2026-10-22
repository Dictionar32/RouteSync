# Phase 2071 — Class-Reference Terminal Segment Evidence, Interface First

## Trace finding

Phase 2070 made the parser own the discriminated class-reference evidence, but that evidence only retained the complete source spelling. The AST classifier already derived a terminal class segment for `Resource::collection()` / `Resource::make()`, while controller dataflow independently passed the full class spelling as `ResourceName` for static-call candidates. This left the lexical terminal-name fact inconsistently represented across AST consumers.

## Contract-first change

- Evolved the existing `PhpClassReferenceSourceEvidence` discriminated union with `terminalName: AstIdentifier` on both `simple_name` and `qualified_name` variants.
- The PHP AST classifier derives the terminal segment once alongside the full `sourceName` and class-reference form.
- Resource AST projection reuses `classReference.terminalName` instead of separately splitting the raw class spelling.
- Controller dataflow uses the parser-owned terminal segment when projecting a static-call resource name; it does not reinterpret the full class spelling.
- PHP class-name resolution still receives the full source spelling and form. `terminalName` is lexical projection metadata, not canonical class identity.
- Existing model identity, invocation judgment, integrated response, AST/ADT projection, and runtime executor authorities remain unchanged.

## Architecture boundary

PHP source tokens → typed class-reference source evidence (`sourceName`, `terminalName`, `form`) → existing PHP class-name resolution authority → existing model/static-call judgment → invocation/integrated-response contracts → AST/ADT projection/runtime executor.

No `relation/foundation` subscanner, duplicate resolver, invocation authority, response authority, or AST authority was added.

## Regression coverage

Updated `phpAstStaticCallClassReference.phase2070.test.ts` to assert that a fully-qualified `\App\Http\Resources\PostResource` retains the complete source spelling and terminal segment `PostResource` separately.

## Verification boundary

The phase audit checks the contract, parser projection, scanner consumption, resolver preservation, and regression evidence. This does not replace full TypeScript typecheck, project build, or Vitest; those full checks are not claimed as run.
