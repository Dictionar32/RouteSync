import { laravelModelScanner } from "../laravelModelScanner";
import { laravelResponseScanner } from "../subscanners/responseScanner";
import { createModelSymbolTable } from "../symbols/ModelSymbolTable";
import type { LaravelSourceAstPipelineDependenciesInterface } from "../../../types/upstream/laravelSourceAstPipelineInterface";
import { resourceSourceEvidenceScanner, type ResourceScanEvidence } from '../lexer/resourceSourceEvidence';
import { sourceAstSemanticProducer } from "../../semantic/sourceAstSemanticProducer";
import { laravelControllerScanner } from './laravelControllerScanner';
import { laravelRouteScanner } from './laravelRouteScanner';
import { laravelResourceScanner } from './laravelResourceScanner';
import { laravelFormRequestScanner } from "../laravelFormRequestScanner";
import { schemaProducer as canonicalSchemaProducer } from '../subscanners/schemaProducer';
import { scanMigrationAsts } from '../subscanners/migrationAstCanonical';
import { laravelAttributeScanner } from '../laravelAttributeScanner';
import { scanDtoDeclarationInventory } from '../subscanners/dtoAstCanonical';
import { queryProducer as canonicalQueryProducer } from '../subscanners/queryProducer';
import type { LaravelMigrationScannerInterface } from '../../../types/upstream/laravelMigrationScannerInterface';
import type { LaravelAttributeScannerInterface } from '../../../types/upstream/laravelAttributeScannerInterface';
import type { LaravelDtoDeclarationInventoryScannerInterface } from '../../../types/upstream/laravelDtoDeclarationInventoryScannerInterface';
import type { LaravelQueryProducerInterface } from '../../../types/upstream/laravelQueryProducerInterface';
import type { LaravelServiceScannerInterface } from '../../../types/upstream/laravelServiceScannerInterface';
import type { LaravelMiddlewareScannerInterface } from '../../../types/upstream/laravelMiddlewareScannerInterface';
import type { LaravelProviderScannerInterface } from '../../../types/upstream/laravelProviderScannerInterface';
import { scanServiceBundle } from '../subscanners/serviceAstCanonical';
import { scanMiddlewareAsts } from '../subscanners/middlewareAstCanonical';
import { scanProviderBundle } from '../subscanners/providerAstCanonical';

/** Canonical composition root selects the existing scanner contracts and binding authority once. */
export const laravelSourceAstPipelineDependencies: LaravelSourceAstPipelineDependenciesInterface<ResourceScanEvidence> = Object.freeze({
    resourceEvidenceScanner: resourceSourceEvidenceScanner,
    migrationScanner: Object.freeze({
        kind: 'laravel_migration_scanner',
        closed: true,
        contractVersion: 1,
        scan: scanMigrationAsts,
    }) satisfies LaravelMigrationScannerInterface,
    attributeScanner: laravelAttributeScanner satisfies LaravelAttributeScannerInterface,
    dtoDeclarationInventoryScanner: Object.freeze({
        kind: 'laravel_dto_declaration_inventory_scanner',
        closed: true,
        contractVersion: 1,
        scan: scanDtoDeclarationInventory,
    }) satisfies LaravelDtoDeclarationInventoryScannerInterface,
    queryProducer: Object.freeze({
        kind: 'laravel_query_producer',
        closed: true,
        contractVersion: 1,
        produce: canonicalQueryProducer.produce,
    }) satisfies LaravelQueryProducerInterface,
    serviceScanner: Object.freeze({
        kind: 'laravel_service_scanner',
        closed: true,
        contractVersion: 1,
        scan: async input => {
            const bundle = await scanServiceBundle(input.sourceProject, createModelSymbolTable(input.models));
            return Object.freeze({
                kind: 'laravel_service_scan_judgment',
                closed: true,
                contractVersion: 1,
                artifacts: Object.freeze(bundle.artifacts.map(artifact => Object.freeze({
                    kind: 'laravel_service_scan_artifact' as const,
                    ast: artifact.ast,
                    definition: artifact.definition,
                }))),
            });
        },
    }) satisfies LaravelServiceScannerInterface,
    middlewareScanner: Object.freeze({
        kind: 'laravel_middleware_scanner',
        closed: true,
        contractVersion: 1,
        scan: async sourceProject => Object.freeze({
            kind: 'laravel_middleware_scan_judgment',
            closed: true,
            contractVersion: 1,
            asts: await scanMiddlewareAsts(sourceProject),
        }),
    }) satisfies LaravelMiddlewareScannerInterface,
    providerScanner: Object.freeze({
        kind: 'laravel_provider_scanner',
        closed: true,
        contractVersion: 1,
        scan: async sourceProject => {
            const bundle = await scanProviderBundle(sourceProject);
            return Object.freeze({
                kind: 'laravel_provider_scan_judgment',
                closed: true,
                contractVersion: 1,
                artifacts: Object.freeze(bundle.artifacts.map(artifact => Object.freeze({
                    kind: 'laravel_provider_scan_artifact' as const,
                    ast: artifact.ast,
                    definition: artifact.definition,
                }))),
            });
        },
    }) satisfies LaravelProviderScannerInterface,
    modelScanner: laravelModelScanner,
    formRequestScanner: laravelFormRequestScanner,
    schemaProducer: canonicalSchemaProducer,
    sourceAstSemanticProducer,
    controllerScanner: laravelControllerScanner,
    resourceScanner: laravelResourceScanner,
    responseScanner: laravelResponseScanner,
    routeScanner: laravelRouteScanner,
});

