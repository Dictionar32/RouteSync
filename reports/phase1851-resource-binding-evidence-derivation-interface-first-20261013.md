# Phase 1851 — Resource Binding Evidence Derivation Interface-First

## Trace finding

Phase 1850 moved precedence into a declarative rule set, but the authority still performed controller-origin matching, convention candidate derivation, relation propagation, and local precedence selection through functions. The rule set did not yet own the full candidate derivation path.

## Changes

- Extended `ResourceModelBindingSemanticRuleSetInterface` to version 2.
- Added declarative relations for controller class/table origins, model aliases/table names, resource convention keys, resource-to-resource relations, model relation targets, candidate evidence, candidate provenance, selected precedence, and selected candidates.
- Added rewrite rules for controller evidence, table evidence, convention evidence, precedence, selected candidate, and relation propagation.
- Changed `resourceModelBindingAuthority.ts` to map typed source evidence into semantic facts, execute the upstream rule set, and reattach typed source provenance to the derived candidates.
- Removed local `originMatchesModel`, `relationPropagationEvidence`, and `conventionBindingEvidence` decision functions.
- Removed the authority's local selected-precedence lookup; selection now comes from `resource_model_selected_candidate` facts derived by the rule set.
- Advanced the semantic judgment contract to version 9 and resource scanner contract to version 10.
- Kept runtime scanner responsible for source acquisition and AST projection only; model binding decisions remain behind `ResourceModelBindingJudgmentAuthority`.

## Verification

The phase audit checks the declarative rule inventory, authority delegation, provenance restoration, absence of local semantic decision functions, and the resource scanner authority boundary. Historical static audits are also run. Build, typecheck, and E2E are intentionally not run.

## Remaining work

- Judgment ADT construction (`resolved` / `unresolved` / `ambiguous`) and cycle receipt handling remain ordinary typed projection code in the authority.
- The outer batch closure still compares prior judgments; a later phase can model whole-project closure through one shared semantic relation execution if provenance and cycle contracts are preserved.
- `resourceProducer` and other lower-level producer modules remain under `subscanners`; they are not removed until consumer tracing confirms they are unused.

## Static audit receipt

- Phase 1851 checks: 15/15.
- All maintained phase audits from Phase 1836 through Phase 1851: 188/188 checks passed across 16 scripts.
- `package.json` parses successfully.
- Build, typecheck, and E2E were not run, per the repository workflow constraint.
