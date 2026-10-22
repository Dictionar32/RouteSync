# Phase 2181 — Interface-first response attribute lexical context

## Trace

`ControllerMethodAst.classNameResolutionContext` is populated by the controller declaration parser from the method's owning PHP namespace/import region. Before this phase, `laravelControllerScanner` projected a declared response attribute's short class spelling, shape, and token span, but discarded that lexical context. The integrated response evidence producer therefore could not invoke the existing `PhpClassNameResolutionRuleInterface` without guessing or reparsing source.

## Changes

- Added `ControllerResponseAttributeClassNameContextEvidence`, a closed `available | unavailable` ADT. Missing parser context is not represented as an empty namespace/import inventory.
- Extended the declared branch of `ControllerResponseAttributeSourceEvidence` and `ControllerMethodEvidenceSyntax` to retain that context.
- Updated `laravelControllerScanner` to forward the parser-owned context and exact unavailable reason.
- Updated the existing `controllerProducer` projection to preserve the context in upstream evidence.
- Kept the existing PHP class-name authority, DTO declaration authority, invocation semantic judgment, integrated response pipeline, and runtime executor as the sole owners. No `relation`, `foundation`, or new subscanner layer was introduced.

## Boundary of this phase

This closes the missing *input evidence* needed for response-attribute name resolution; it does **not** claim that the integrated response judgment now consumes the DTO declaration-resolution judgment end-to-end. That next integration must call the existing class-name authority with the retained lexical context, pass its closed judgment to the existing DTO declaration authority, and expose that result as a first-class part of the integrated response judgment. The legacy response-attribute descriptor scanner must not be removed until that judgment is consumed by the existing response authority.

## Verification

Static source inspection only. The package test runner, TypeScript typecheck, and build were not run in this environment. ZIP integrity is checked separately.
