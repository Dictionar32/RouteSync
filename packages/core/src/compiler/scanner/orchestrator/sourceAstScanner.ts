import { ChannelScanner, ControllerScanner, FormRequestScanner, ModelScanner, ResourceScanner, RouteScanner } from "../subscanners";
import { scanResponseAsts } from "../subscanners/responseScanner";
import { scanMigrationAsts } from "../subscanners/migrationAstCanonical";
import { scanServiceAsts } from "../subscanners/serviceAstCanonical";
import { scanMiddlewareAsts } from "../subscanners/middlewareAstCanonical";
import { scanDtoAsts } from "../subscanners/dtoAstCanonical";
import { scanProviderAsts } from "../subscanners/providerAstCanonical";
import { scanAttributeAsts } from "../subscanners/attributeAstCanonical";
import { ModelSymbolTable } from "../symbols/ModelSymbolTable";
import type { FormRequestSource } from "../../../types/domain/request";
import type { SourceAsts } from "../../../types/upstream/collections";
import type { ChannelAst, ControllerAst, ModelAst, RequestAst, ResourceAst, RouteAst } from "../../../types/upstream/ast";
import type { SourceDiscovery, Sequence } from "../../../types/upstream/collections";
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>(
    (tail, item) => ({ kind: "cons", head: item, tail }),
    { kind: "empty" }
);

const scanned = <T>(items: readonly T[]): SourceDiscovery<T> => ({
    kind: "scanned",
    result: items.length === 0
        ? { kind: "discovered_empty" }
        : { kind: "discovered_many", items: sequence(items) }
});

const notScanned = <T>(): SourceDiscovery<T> => ({ kind: "not_scanned" });

export async function scanSourceAsts(sourceProject: SourceProjectIdentity): Promise<SourceAsts> {
    const migrations = await scanMigrationAsts(sourceProject);
    const models: readonly ModelAst[] = await ModelScanner.scanAsts(sourceProject, migrations);
    const modelSymbolTable = new ModelSymbolTable(models);
    const requestBundle = await FormRequestScanner.scanCanonicalBundle(sourceProject);
    const requests: readonly RequestAst[] = requestBundle.asts;
    const requestSources: readonly FormRequestSource[] = requestBundle.sources;
    const formRequestMap = new Map(requestSources.map(request => [request.identity.requestClass.value.value, request] as const));
    const controllerBundle = await ControllerScanner.scanCanonicalBundle(sourceProject, formRequestMap);
    const controllers: readonly ControllerAst[] = controllerBundle.asts;
    const responses = await scanResponseAsts(sourceProject);
    const services = await scanServiceAsts(sourceProject, modelSymbolTable);
    const middlewares = await scanMiddlewareAsts(sourceProject);
    const dtos = await scanDtoAsts(sourceProject);
    const providers = await scanProviderAsts(sourceProject);
    const attributes = await scanAttributeAsts(sourceProject);
    const controllerDataflow = ControllerScanner.extractResourceDataflow(controllerBundle.controllerMap);
    const resources: readonly ResourceAst[] = await ResourceScanner.scanAsts(sourceProject, modelSymbolTable, controllerDataflow);
    const routes: readonly RouteAst[] = await RouteScanner.scanAsts(sourceProject, requestSources, controllerBundle.controllerMap);
    const channelDescriptors = await ChannelScanner.scan(sourceProject);
    const channels: readonly ChannelAst[] = channelDescriptors.map(definition => ({ kind: 'channel_ast', definition, source: sourceProject.source }));

    return {
        kind: "source_asts",
        models: { kind: "model_asts", items: scanned(models) },
        resources: { kind: "resource_asts", items: scanned(resources) },
        requests: { kind: "request_asts", items: scanned(requests) },
        routes: { kind: "route_asts", items: scanned(routes) },
        controllers: { kind: "controller_asts", items: scanned(controllers) },
        services: { kind: "service_asts", items: scanned(services) },
        migrations: { kind: "migration_asts", items: scanned(migrations) },
        responses: { kind: "response_asts", items: scanned(responses) },
        dtos: { kind: "dto_asts", items: scanned(dtos) },
        middlewares: { kind: "middleware_asts", items: scanned(middlewares) },
        providers: { kind: "provider_asts", items: scanned(providers) },
        attributes: { kind: "attribute_asts", items: scanned(attributes) },
        channels: { kind: "channel_asts", items: scanned(channels) }
    };
}
