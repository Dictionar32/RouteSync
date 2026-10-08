# Phase 409 — Scanner Positional Relations

This phase removes raw `index + N` positional arithmetic from the targeted scanner/resolver authority paths.

## Model

`sequence/index evidence -> relational positional advance -> candidate/constraint -> rewrite/witness`

The positional operation is represented by `relationAdvanceIndex`, keeping scanner authority behind the semantic relation kernel instead of embedding magic positional arithmetic in resolver logic.

This is intentionally not a blanket lexical substitution: source-language token vocabulary such as `if` remains data, while host-language control operators are treated as semantic-authority violations.
