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
import type { ChannelAst, ControllerAst, ModelAst, RequestAst, ResourceAst, RouteAst, ServiceAst } from "../../../types/upstream/ast";
import type { SourceDiscovery, Sequence } from "../../../types/upstream/collections";
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import { expressionAstFromExpression } from "../subscanners/expressionAstCanonical";
import { schemaProducer } from "../subscanners/schemaProducer";
import { queryProducer } from "../subscanners/queryProducer";
import type { ExpressionAst, ExpressionOrigin } from "../../../types/upstream/ast";
import type { Expression } from "../../../types/upstream/expression";

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

const sequenceToArray = <T>(items: Sequence<T>): readonly T[] => {
    const result: T[] = [];
    let cursor: Sequence<T> = items;
    while (cursor.kind === "cons") {
        result.push(cursor.head);
        cursor = cursor.tail;
    }
    return result;
};

const expressionAstsFromResources = (items: readonly ResourceAst[]): readonly ExpressionAst[] => items.flatMap(resource =>
    sequenceToArray(resource.definition.fields.items).map(field =>
        expressionAstFromExpression(field.expression, {
            kind: "resource_field",
            resource: resource.definition.name,
            field: field.name,
        })
    )
);

const expressionAstsFromModels = (items: readonly ModelAst[]): readonly ExpressionAst[] => items.flatMap(model =>
    sequenceToArray(model.definition.computed.items).flatMap(accessor =>
        accessor.computation.kind === "expression"
            ? [expressionAstFromExpression(accessor.computation.expression, {
                kind: "model_accessor",
                model: model.definition.identity.name,
                accessor: accessor.name,
            })]
            : []
    )
);

const expressionAstsFromControllers = (items: readonly ControllerAst[]): readonly ExpressionAst[] => items.flatMap(controller =>
    sequenceToArray(controller.methods).flatMap(method => {
        if (method.kind !== "controller_action") return [];
        const origin = { kind: "controller_action" as const, controller: method.controller, action: method.action };
        const expressions: Expression[] = [];
        if (method.semantic.returned.kind !== "absent") expressions.push(method.semantic.returned.expression);
        for (const binding of sequenceToArray(method.semantic.variables)) {
            for (const definition of sequenceToArray(binding.definitions)) expressions.push(definition.expression);
        }
        return expressions.map(expression => expressionAstFromExpression(expression, origin));
    })
);

const expressionsFromServiceStatement = (statement: import("../../../types/upstream/sourceStatements").SourceStatement): readonly Expression[] => {
    switch (statement.kind) {
        case "assignment": return [statement.value.expression];
        case "expression": return [statement.value.expression];
        case "return": return [statement.expression];
        case "return_void": return [];
        case "conditional": return expressionsFromServiceConditional(statement);
        case "for_each": return [statement.iterable.expression, ...expressionsFromServiceStatements(statement.body)];
        case "for_loop": return [...expressionsFromServiceForClause(statement.initializer), ...expressionsFromServiceForClause(statement.condition), ...expressionsFromServiceForClause(statement.update), ...expressionsFromServiceStatements(statement.body)];
        case "transaction": return expressionsFromServiceStatements(statement.body);
        case "try": return [...expressionsFromServiceStatements(statement.body), ...sequenceToArray(statement.catches.items).flatMap(handler => expressionsFromServiceStatements(handler.body))];
        case "throw": return [statement.error.expression];
        case "abort": return [statement.message.expression];
        case "unset": return sequenceToArray(statement.targets.items).flatMap(target => {
            switch (target.kind) {
                case "variable": return [];
                case "property": return [target.receiver];
                case "static_property": return [];
                case "index": return [target.receiver, target.key];
            }
        });
        case "include": return [statement.expression.expression];
    }
};

const expressionsFromServiceConditional = (statement: Extract<import("../../../types/upstream/sourceStatements").SourceStatement, { readonly kind: "conditional" }>): readonly Expression[] => {
    switch (statement.branches.kind) {
        case "then_only": return [statement.condition.expression, ...expressionsFromServiceStatements(statement.branches.whenTrue)];
        case "then_else": return [statement.condition.expression, ...expressionsFromServiceStatements(statement.branches.whenTrue), ...expressionsFromServiceStatements(statement.branches.whenFalse)];
    }
};

const expressionsFromServiceForClause = (clause: import("../../../types/upstream/sourceStatements").SourceForClause): readonly Expression[] => {
    switch (clause.kind) {
        case "empty": return [];
        case "expression": return [clause.value.expression];
        case "assignment": return [clause.value.expression];
    }
};

const expressionsFromServiceStatements = (statements: import("../../../types/upstream/sourceStatements").SourceStatements): readonly Expression[] =>
    sequenceToArray(statements.items).flatMap(expressionsFromServiceStatement);

const expressionsFromServiceParameterDefaults = (parameters: Sequence<import("../../../types/upstream/service").ServiceParameter>): readonly Expression[] =>
    sequenceToArray(parameters).flatMap(parameter => {
        switch (parameter.defaultValue.kind) {
            case "absent": return [];
            case "present": return [parameter.defaultValue.value];
        }
    });

const expressionAstsFromServices = (items: readonly ServiceAst[]): readonly ExpressionAst[] => items.flatMap(service =>
    sequenceToArray(service.definition.methods.items).flatMap(method => {
        const origin: ExpressionOrigin = {
            kind: "service_method",
            service: service.definition.name,
            method: method.name,
        };
        const expressions = [
            ...expressionsFromServiceParameterDefaults(method.parameters.items),
            ...expressionsFromServiceStatements(method.body),
        ];
        return expressions.map(expression => expressionAstFromExpression(expression, origin));
    })
);



export async function scanSourceAsts(sourceProject: SourceProjectIdentity): Promise<SourceAsts> {
    const migrations = await scanMigrationAsts(sourceProject);
    const migrationDiscovery = { kind: "migration_asts" as const, items: scanned(migrations) };
    const schema = schemaProducer.produce({ migrations: migrationDiscovery, projectSource: sourceProject.source });
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
    const channels: readonly ChannelAst[] = await ChannelScanner.scanCanonicalAsts(sourceProject);
    const expressions = [
        ...expressionAstsFromModels(models),
        ...expressionAstsFromResources(resources),
        ...expressionAstsFromControllers(controllers),
        ...expressionAstsFromServices(services),
    ];

    const queries = queryProducer.produce({ expressions });

    return {
        kind: "source_asts",
        models: { kind: "model_asts", items: scanned(models) },
        resources: { kind: "resource_asts", items: scanned(resources) },
        requests: { kind: "request_asts", items: scanned(requests) },
        routes: { kind: "route_asts", items: scanned(routes) },
        controllers: { kind: "controller_asts", items: scanned(controllers) },
        services: { kind: "service_asts", items: scanned(services) },
        migrations: migrationDiscovery,
        schemas: { kind: "schema_asts", items: scanned([schema]) },
        responses: { kind: "response_asts", items: scanned(responses) },
        dtos: { kind: "dto_asts", items: scanned(dtos) },
        middlewares: { kind: "middleware_asts", items: scanned(middlewares) },
        providers: { kind: "provider_asts", items: scanned(providers) },
        attributes: { kind: "attribute_asts", items: scanned(attributes) },
        channels: { kind: "channel_asts", items: scanned(channels) },
        properties: { kind: "property_asts", items: notScanned() },
        assignments: { kind: "assignment_asts", items: notScanned() },
        expressions: { kind: "expression_asts", items: scanned(expressions) },
        queries: { kind: "query_asts", items: scanned(queries) }
    };
}
