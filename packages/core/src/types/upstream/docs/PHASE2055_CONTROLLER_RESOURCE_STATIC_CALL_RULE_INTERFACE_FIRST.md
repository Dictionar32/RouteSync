# Phase 2055 — Controller Resource Static-Call Rule Interface First

## Trace finding

Phase 2054 moved static-call applicability upstream, but the existing `ControllerResourceBindingAuthorityInterface` implementation still encoded the semantic rule as a `switch` on `candidate.methodName.value.value`. The scanner was no longer the decision owner, but the authority's method applicability was still hardcoded control flow rather than an explicit typed rule contract.

## Change

- Extended the existing `ControllerResourceBindingAuthorityInterface` to contract version 4.
- Added `ControllerResourceStaticCallRuleInterface`, which couples a typed `MethodName` identity with a closed semantic judgment operation.
- Registered the resource `collection` rule in `controllerResourceStaticCallRules`.
- Replaced the method-name `switch` with generic rule lookup; the rule itself owns the semantic judgment through the existing `judgeResourceCollection` implementation.
- Unknown method names still produce the closed `{ kind: 'not_applicable', closed: true }` judgment.
- Preserved the existing authority for model-origin resolution and canonical response correlation.
- Preserved `controllerDataflowContract.ts` as a structural AST evidence adapter; it does not decide that `collection` is semantically applicable.
- Added behavior-focused contract assertions and a Phase 2055 audit.

## What this does not claim

This is not a claim that all `switch` statements are wrong. Closed ADT dispatch such as `candidate.kind` remains useful for exhaustive judgment handling. The removed switch was specifically the semantic method-name classifier that could instead be represented by a registered typed rule. This phase does not change invocation or integrated response ownership, does not add a parallel AST/response/resource authority, and does not add a relation/foundation subscanner.

## Intended dataflow

`PHP AST → typed static-call evidence → registered semantic rule interface → closed resource-binding judgment → binding projection`

The existing ControllerResourceBindingAuthorityInterface is the rule contract owner; the existing authority remains the only owner of the resource-binding judgment; the scanner remains evidence projection and wiring.
