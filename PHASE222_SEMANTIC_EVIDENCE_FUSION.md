# Phase 222 — Semantic Evidence Fusion

## Purpose

RouteSync now treats parser, lexer, language-service, framework-model, reflection,
inference, compiler-IR, and runtime-metadata outputs as independent witnesses.
They are fused only in a derived evidence layer; none becomes the semantic source
of truth.

## Model

```text
multiple evidence providers
        ↓
canonical semantic facts
        ↓
 evidence-neutral derived claim key
        ↓
 semantic evidence clusters
        ↓
 single-source / corroborated
```

The claim key is an index only. Semantic identity remains `KnowledgeId`.
No provider is assigned a priority or authority by this layer.

## Why this goes beyond syntax

A Tree-sitter parse can establish syntax evidence, but framework models,
reflection, language services, compiler IR, and runtime metadata can independently
support the same semantic fact. Fusion lets later analyses consume corroboration
without embedding provider-specific branches in consumers.

This resembles the layered/overlay principle seen in Code Property Graph systems,
while RouteSync deliberately keeps its typed semantic facts canonical rather than
making the graph itself authoritative.
