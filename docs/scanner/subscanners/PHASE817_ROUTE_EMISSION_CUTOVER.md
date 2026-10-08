# Phase 817 — Route Emission Cutover

## Purpose

Move the route emitter and scanner off the legacy `RouteSemanticFlowFactory` construction boundary without creating a second `RouteAst` constructor.

## Changes

- Added `RouteEmission` as the route-scanner semantic emission ADT.
- `routeEmitter.ts` now emits `RouteEmission[]` for standard and API-resource routes.
- Removed direct `RouteSemanticFlowFactory` construction from `routeEmitter.ts`.
- Removed `RouteSemanticFlow` / `RouteSemanticFlowFactory` references from `RouteScanner.ts`.
- `RouteScanner.scanSource()` now carries `RouteEmission[]` through its internal origin stream.
- `routeProducerRelations.ts` now accepts `RouteEmission` as its input boundary.
- The compatibility conversion from `RouteEmission` to the legacy flow remains isolated inside `routeProducerRelations.ts` and is therefore the next removable bridge.
- `routeProducer.produce()` remains the sole `RouteAst` constructor.

## Audit

Phase 817 audit confirms:

- `routeProducerConstructorCount = 1`
- emitter has no legacy flow/factory reference
- scanner has no legacy flow/factory reference
- emitter returns `RouteEmission[]`
- scanner consumes `RouteEmission`
- public scanner returns `RouteAst[]`
- compatibility bridge still references `RouteSemanticFlowFactory`

## Build status

A full TypeScript build is not claimed in this extracted workspace because the local `node_modules/.bin/tsc` is absent.

## Next frontier

Eliminate `RouteSemanticFlowFactory` from `routeProducerRelations.ts` by constructing `RouteProducerInput` directly from `RouteEmission` and the declaration semantic facts. Only after that bridge reaches zero should the route descriptor/factory tree be considered for deletion.
