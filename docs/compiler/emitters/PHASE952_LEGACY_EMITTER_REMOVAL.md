# Phase 952 — Legacy Emitter Removal

`TypeScriptEmitter` and `ContractEmitter` were legacy ContractGraph-emitter surfaces with no production consumers. The active target path is:

`RouteManifest -> manifestToSemanticTypes/manifestToContractInput -> output lowerers -> CoreFilesEmitter/client emitters -> generated artifacts`.

`ContractGraph` remains valid because it is still consumed by `compiler/generators/typescript/TypeScriptGenerator` and its domain builders.

Ownership rule: target generation is owned by `compiler/generators/typescript`; the generic pipeline `IEmitter` remains available for the active target-node pipeline. No scanner module owns target emission.
