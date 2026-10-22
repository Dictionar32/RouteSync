import { ChannelScanner } from "../subscanners";
import { migrationInterfaceAdapter } from "../wiring/migrationInterfaceAdapter";
import type { FormRequestSource } from "../../../types/domain/request";
import type { SourceAsts, SourceDiscovery, Sequence } from "../../../types/upstream/collections";
import { validateCompleteSourceAst } from "../../../types/upstream/completeness";
import type { LaravelSourceAstProjectionJudgment, LaravelSourceAstPipelineDependenciesInterface, LaravelSourceAstPipelineExecutionInput, LaravelSourceAstPipelineInterface } from "../../../types/upstream/laravelSourceAstPipelineInterface";
import type { ChannelAst, ControllerAst, ModelAst, RequestAst, ResourceAst, RouteAst, ServiceAst, ResponseAst, ProviderAst } from "../../../types/upstream/ast";
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import type { ControllerStaticCallModelClassIdentity } from "../../../types/upstream/controllerStaticCallOriginInterface";
import type { LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt } from "../../../types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface";
import type { ResourceScanEvidence } from '../lexer/resourceSourceEvidence';
import type { LaravelResourceResolvedArtifact } from '../../../types/upstream/laravelResourceScannerInterface';
function sequence<T>(items: readonly T[]): Sequence<T> {
    return items.reduceRight<Sequence<T>>(
        (tail, head) => ({ kind: "cons", head, tail }),
        { kind: "empty" },
    );
}

function scanned<T>(items: readonly T[]): SourceDiscovery<T> {
    if (items.length === 0) {
        return { kind: "scanned", result: { kind: "discovered_empty" } };
    }

    return { kind: "scanned", result: { kind: "discovered_many", items: sequence(items) } };
}

function sequenceToArray<T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] {
    if (items.kind === "empty") {
        return output;
    }

    return sequenceToArray(items.tail, [...output, items.head]);
}

function attributeScannedFilesToSequence(items: import("../../../types/upstream/laravelAttributeScannerInterface").LaravelAttributeScannedFileSequence): Sequence<import("../../../types/upstream/ast").AttributeAst> {
    if (items.kind === "laravel_attribute_scanned_file_sequence_empty") return { kind: "empty" };
    return { kind: "cons", head: items.evidence.attribute, tail: attributeScannedFilesToSequence(items.rest) };
}

function attributeScannedFilesToDiscovery(items: import("../../../types/upstream/laravelAttributeScannerInterface").LaravelAttributeScannedFileSequence): SourceDiscovery<import("../../../types/upstream/ast").AttributeAst> {
    if (items.kind === "laravel_attribute_scanned_file_sequence_empty") return { kind: "scanned", result: { kind: "discovered_empty" } };
    return { kind: "scanned", result: { kind: "discovered_many", items: attributeScannedFilesToSequence(items) } };
}

/** Interface contract for constructing the input-bound source-AST runtime operation. */
export interface LaravelSourceAstPipelineFactoryInterface {
    readonly create: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(
        dependencies: LaravelSourceAstPipelineDependenciesInterface<ResourceScanEvidence>,
        input: LaravelSourceAstPipelineExecutionInput<Receipt>,
    ) => LaravelSourceAstPipelineInterface<Receipt, ResourceScanEvidence>;
}

/** Builds an input-bound pipeline operation; execute() consumes only its explicit operation data. */
export const laravelSourceAstPipelineFactory: LaravelSourceAstPipelineFactoryInterface = Object.freeze({
    create: <Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>(
        dependencies: LaravelSourceAstPipelineDependenciesInterface<ResourceScanEvidence>,
        input: LaravelSourceAstPipelineExecutionInput<Receipt>,
    ): LaravelSourceAstPipelineInterface<Receipt, ResourceScanEvidence> => {
    const operation: LaravelSourceAstPipelineInterface<Receipt, ResourceScanEvidence> = {
        kind: "laravel_source_ast_pipeline",
        closed: true,
        contractVersion: 17,
        input,
        dependencies,
        async execute(): Promise<LaravelSourceAstProjectionJudgment<Receipt>> {
            const dependencies = this.dependencies;
            const input = this.input;
    const { controllerScanner, resourceScanner, responseScanner, routeScanner } = dependencies;
    const invocationInventoryReceipt = input.invocationInventoryReceipt;
    const sourceProject: SourceProjectIdentity = invocationInventoryReceipt.sourceInventory.sourceProject;
    const attributeScan = await dependencies.attributeScanner.scan(sourceProject);
    if (attributeScan.kind === 'laravel_attribute_scan_blocked') {
        return Object.freeze({
            kind: 'laravel_source_ast_projection_attribute_scan_blocked',
            sourceProject,
            invocationInventoryReceipt,
            scan: attributeScan,
        });
    }
    const migrations = await dependencies.migrationScanner.scan(sourceProject);
    const migrationDiscovery = { kind: "migration_asts" as const, items: scanned(migrations) };
    const migrationInterfaces = Object.freeze(migrations.map(migrationInterfaceAdapter.fromAst));
    const schema = dependencies.schemaProducer.produce({ migrations: migrationInterfaces, projectSource: sourceProject.source });
    const modelJudgment = await dependencies.modelScanner.scan({ sourceProject, schema });
    const models: readonly ModelAst[] = Object.freeze(modelJudgment.models.map(model => model.ast));
    const modelDefinitions = Object.freeze(modelJudgment.models.map(model => model.definition));
    const controllerModelClasses: readonly ControllerStaticCallModelClassIdentity[] = Object.freeze(modelJudgment.models.map(model => model.classIdentity));
    const requestJudgment = await dependencies.formRequestScanner.scan({ sourceProject });
    const requests: readonly RequestAst[] = Object.freeze(requestJudgment.requests.map(request => request.ast));
    const requestDefinitions = Object.freeze(requestJudgment.requests.map(request => request.definition));
    const requestSources: readonly FormRequestSource[] = requestJudgment.sources;
    const semanticProducts = await dependencies.sourceAstSemanticProducer.produce(sourceProject);
    const expressions = semanticProducts.expressions;
    const assignments = semanticProducts.assignments;
    const properties = semanticProducts.properties;
    const queries = dependencies.queryProducer.produce({ expressions });
    const attributeDiscovery = attributeScannedFilesToDiscovery(attributeScan.discoveryReceipt.files);
    const dtoDeclarationInventory = await dependencies.dtoDeclarationInventoryScanner.scan(sourceProject);
    if (dtoDeclarationInventory.kind === 'laravel_project_dto_declaration_inventory_incomplete') {
        return Object.freeze({
            kind: 'laravel_source_ast_projection_dto_declaration_inventory_blocked',
            sourceProject,
            invocationInventoryReceipt,
            scan: dtoDeclarationInventory,
        });
    }
    const dtos = Object.freeze(dtoDeclarationInventory.receipt.declarations.map(evidence => evidence.declaration));
    const controllerScan = await controllerScanner.scan({
        formRequests: requestSources,
        queries,
        contextualAttributeInventory: attributeScan.contextualAttributeInventory,
        modelClasses: controllerModelClasses,
        dtoDeclarationInventory,
        invocationInventory: invocationInventoryReceipt,
    });
    if (controllerScan.kind === 'laravel_controller_scan_blocked') {
        return Object.freeze({
            kind: 'laravel_source_ast_projection_controller_scan_blocked',
            sourceProject,
            invocationInventoryReceipt,
            scan: controllerScan,
        });
    }
    const routeOperation = await routeScanner.prepare({
        controllerScan,
        sourceSelectionIntent: input.routeSelection,
    });
    const routeScan = await routeOperation.execute();
    if (routeScan.kind === 'laravel_route_scan_blocked') {
        return Object.freeze({
            kind: 'laravel_source_ast_projection_route_scan_blocked',
            sourceProject,
            invocationInventoryReceipt,
            scan: routeScan,
        });
    }
    if (routeScan.kind === 'laravel_route_scan_response_blocked') {
        return Object.freeze({
            kind: 'laravel_source_ast_projection_route_response_blocked',
            sourceProject,
            invocationInventoryReceipt,
            scan: routeScan,
        });
    }
    if (routeScan.kind === 'laravel_route_scan_policy_blocked') {
        return Object.freeze({
            kind: 'laravel_source_ast_projection_route_policy_blocked',
            sourceProject,
            invocationInventoryReceipt,
            scan: routeScan,
        });
    }
    const controllers: readonly ControllerAst[] = Object.freeze(controllerScan.controllers.map(artifact => artifact.ast));
    const controllerActions = Object.freeze(controllerScan.controllers.flatMap(artifact => artifact.actions));
    // Acquire Resource evidence once; binding judgment and AST projection consume this same inventory.
    const resourceSourceEvidence = await dependencies.resourceEvidenceScanner.scan(sourceProject);
    const resourceScan = await resourceScanner.scan({
        controllerScan,
        modelDefinitions,
        modelAsts: models,
        resourceEvidence: resourceSourceEvidence,
    });
    if (resourceScan.kind === 'laravel_resource_scan_blocked') {
        return Object.freeze({
            kind: 'laravel_source_ast_projection_resource_scan_blocked',
            sourceProject,
            invocationInventoryReceipt,
            scan: resourceScan,
        });
    }
    const resolvedResourceArtifacts = sequenceToArray<LaravelResourceResolvedArtifact>(resourceScan.response.artifacts.items);
    const resources: readonly ResourceAst[] = Object.freeze(resolvedResourceArtifacts.map(artifact => artifact.ast));
    const resourceDefinitions = Object.freeze(resolvedResourceArtifacts.map(artifact => artifact.definition));
    const responseBundle = await responseScanner.scan(Object.freeze({
        sourceProject,
        controllerScan,
        resourceDefinitions,
        responsePipeline: controllerScanner.responseSemanticPipeline,
    }));
    const responses: readonly ResponseAst[] = responseBundle.asts;
    const responseDefinitions = responseBundle.definitions;
    const serviceJudgment = await dependencies.serviceScanner.scan({ sourceProject, models });
    const services: readonly ServiceAst[] = Object.freeze(serviceJudgment.artifacts.map(artifact => artifact.ast));
    const serviceDefinitions = Object.freeze(serviceJudgment.artifacts.map(artifact => artifact.definition));
    const middlewareJudgment = await dependencies.middlewareScanner.scan(sourceProject);
    const middlewares = middlewareJudgment.asts;
    const providerJudgment = await dependencies.providerScanner.scan(sourceProject);
    const providers: readonly ProviderAst[] = Object.freeze(providerJudgment.artifacts.map(artifact => artifact.ast));
    const providerDefinitions = Object.freeze(providerJudgment.artifacts.map(artifact => artifact.definition));
    const routes: readonly RouteAst[] = Object.freeze(routeScan.artifacts.map(artifact => artifact.ast));
    const routeFlows = Object.freeze(routeScan.artifacts.map(artifact => artifact.flow));
    const channels: readonly ChannelAst[] = await ChannelScanner.scanCanonicalAsts(sourceProject);
    const ast: SourceAsts & { readonly controllerInvocationSemanticInventory: Receipt } = {
        kind: "source_asts",
        // Preserve the exact authority-closed receipt and its integrated responses.
        // Do not rebuild judgments from ASTs or detach source identity from response.
        controllerInvocationSemanticInventory: invocationInventoryReceipt,
        controllerScan,
        modelDefinitions,
        resourceDefinitions,
        resourceScan,
        requestDefinitions,
        models: { kind: "model_asts", items: scanned(models) },
        resources: { kind: "resource_asts", items: scanned(resources) },
        requests: { kind: "request_asts", items: scanned(requests) },
        routes: { kind: "route_asts", items: scanned(routes) },
        routeFlows,
        routeScan,
        controllers: {
            kind: "controller_asts",
            items: controllerScan.declarationSelection.kind === 'controller_declaration_selection_inventory_complete'
                ? scanned(controllers)
                : { kind: 'not_scanned' },
        },
        controllerActions,
        services: { kind: "service_asts", items: scanned(services) },
        serviceDefinitions,
        migrations: migrationDiscovery,
        schemas: { kind: "schema_asts", items: scanned([{ kind: "schema_ast" as const, definition: schema.definition, source: schema.source }]) },
        responses: { kind: "response_asts", items: scanned(responses) },
        responseDefinitions,
        responseProjectionJudgments: responseBundle.projectionJudgments,
        dtos: { kind: "dto_asts", items: scanned(dtos) },
        middlewares: { kind: "middleware_asts", items: scanned(middlewares) },
        providerDefinitions,
        providers: { kind: "provider_asts", items: scanned(providers) },
        attributes: { kind: "attribute_asts", items: attributeDiscovery },
        channels: { kind: "channel_asts", items: scanned(channels) },
        properties: { kind: "property_asts", items: sequence(properties) },
        assignments: { kind: "assignment_asts", items: sequence(assignments) },
        expressions: { kind: "expression_asts", items: sequence(expressions) },
        queries: { kind: "query_asts", items: scanned(queries) }
    };
    const completeness = validateCompleteSourceAst(ast, sourceProject.source);
    return completeness.kind === 'complete_source_ast'
        ? Object.freeze({ kind: 'laravel_source_ast_projection_complete', completion: completeness })
        : Object.freeze({ kind: 'laravel_source_ast_projection_blocked', partial: ast, completeness });
        },
    };
    return Object.freeze(operation);
    },
});

/** Backward-compatible export; canonical ownership lives in the composition module. */
export { laravelSourceAstPipelineDependencies } from './laravelSourceAstPipelineDependencies';
