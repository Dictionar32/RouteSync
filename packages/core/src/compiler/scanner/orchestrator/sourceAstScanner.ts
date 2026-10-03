import { relationUnique } from '../../../semantic/kernel/relationMembership';
import { PHP_STATEMENT_KINDS } from '../lexer/phpAstStatementKinds';
import { ChannelScanner, ControllerScanner, FormRequestScanner, ModelScanner, ResourceScanner, RouteScanner } from "../subscanners";
import { scanResponseAsts } from "../subscanners/responseScanner";
import { scanMigrationAsts } from "../subscanners/migrationAstCanonical";
import { scanServiceAsts } from "../subscanners/serviceAstCanonical";
import { scanMiddlewareAsts } from "../subscanners/middlewareAstCanonical";
import { scanDtoAsts } from "../subscanners/dtoAstCanonical";
import { scanProviderAsts } from "../subscanners/providerAstCanonical";
import { scanAttributeAsts } from "../subscanners/attributeAstCanonical";
import { createModelSymbolTable, type ModelSymbolTable } from "../symbols/ModelSymbolTable";
import type { FormRequestSource } from "../../../types/domain/request";
import type { SourceAsts } from "../../../types/upstream/collections";
import type { ChannelAst, ControllerAst, ModelAst, RequestAst, ResourceAst, RouteAst, ServiceAst } from "../../../types/upstream/ast";
import type { SourceDiscovery, Sequence } from "../../../types/upstream/collections";
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import { expressionProducer } from "../subscanners/expressionProducer";
import { assignmentProducer } from "../subscanners/assignmentProducer";
import { propertyProducer } from "../subscanners/model/propertyProducer";
import { parseModelPropertyAsts } from "../subscanners/model/modelPropertyAstParser";
import type { PropertyAst } from "../../../types/upstream/property";
import { createClassName, createActionName } from "../../../types/upstream/names";
import type { AssignmentAst } from "../../../types/upstream/assignment";
import path from "node:path";
import { collectPhpFiles, readSourceText } from "../subscanners/scannerUtils";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import { parsePhpMethod } from "../lexer/phpMethodParser";
import { schemaProducer } from "../subscanners/schemaProducer";
import { queryProducer } from "../subscanners/queryProducer";
import { relationAsyncFold, relationExpand, relationFirstOption, relationOptionFold, relationIndexOf, relationAdvanceIndex, relationGate, relationProject, relationSelect, relationRefine, relationVariant, relationSome, relationNone, relationFold, relationRange, type RelationOption } from "../../../semantic/kernel/relationalSequence";
import { relationEqual, relationAll, relationAny } from "../../../semantic/kernel/semanticRelations";
import type { ExpressionAst, ExpressionOrigin } from "../../../types/upstream/ast";
import type { PhpStatement, PhpBlock, PhpForClause, PhpIfAlternative, PhpFinallyClause } from "../lexer/phpAstStatementTypes";
import type { PhpMethodAst } from "../lexer/phpMethodAstTypes";
import type { PhpAstValue, PhpArrayEntry, PhpArrayKey } from "../lexer/phpAstExpressionTypes";

const sequence = <T>(items: readonly T[], index = items.length - 1, tail: Sequence<T> = { kind: "empty" }): Sequence<T> =>
    relationGate(index < 0, () => tail, () => sequence(items, relationAdvanceIndex(index, -1), { kind: "cons", head: items[index], tail }));

const scanned = <T>(items: readonly T[]): SourceDiscovery<T> => ({
    kind: "scanned",
    result: relationGate(relationEqual(items.length, 0), () => ({ kind: "discovered_empty" }), () => ({ kind: "discovered_many", items: sequence(items) })),
});

const notScanned = <T>(): SourceDiscovery<T> => ({ kind: "not_scanned" });

const stringValue = (value: string) => ({ kind: "string_value" as const, value });
const methodName = (value: string) => ({ kind: "method_name" as const, value: stringValue(value) });
const propertyName = (value: string) => ({ kind: "property_name" as const, value: stringValue(value) });
const modelName = (value: string) => ({ kind: "model_name" as const, value: stringValue(value) });
const resourceName = (value: string) => ({ kind: "resource_name" as const, value: stringValue(value) });
const controllerName = (value: string) => ({ kind: "controller_name" as const, value: stringValue(value) });
const serviceName = (value: string) => ({ kind: "service_name" as const, value: stringValue(value) });

const sourceSpan = (file: string, start: number, end: number) => ({
    kind: "source_span" as const,
    file: { kind: "source_file" as const, value: stringValue(file) },
    start: { kind: "number_value" as const, value: start },
    end: { kind: "number_value" as const, value: end },
});

type StatementOfKind<K extends PhpStatement["kind"]> = Extract<PhpStatement, { readonly kind: K }>;
type AlternativeOfKind<K extends PhpIfAlternative["kind"]> = Extract<PhpIfAlternative, { readonly kind: K }>;
type ClauseOfKind<K extends PhpForClause["kind"]> = Extract<PhpForClause, { readonly kind: K }>;
type FinallyOfKind<K extends PhpFinallyClause["kind"]> = Extract<PhpFinallyClause, { readonly kind: K }>;

const statementIs = <K extends PhpStatement["kind"]>(kind: K) =>
    (statement: PhpStatement): statement is StatementOfKind<K> => relationEqual(statement.kind, kind);
const alternativeIs = <K extends PhpIfAlternative["kind"]>(kind: K) =>
    (alternative: PhpIfAlternative): alternative is AlternativeOfKind<K> => relationEqual(alternative.kind, kind);
const clauseIs = <K extends PhpForClause["kind"]>(kind: K) =>
    (clause: PhpForClause): clause is ClauseOfKind<K> => relationEqual(clause.kind, kind);
const finallyIs = <K extends PhpFinallyClause["kind"]>(kind: K) =>
    (clause: PhpFinallyClause): clause is FinallyOfKind<K> => relationEqual(clause.kind, kind);

const statementExpressionRules: readonly ((statement: PhpStatement) => RelationOption<readonly PhpAstValue[]>)[] = [
    statement => relationOptionFold(relationRefine(statement, statementIs("expression_statement")), () => relationNone(), value => relationSome([value.expression])),
    statement => relationOptionFold(relationRefine(statement, statementIs("return_with_value")), () => relationNone(), value => relationSome([value.expression])),
    statement => relationOptionFold(relationRefine(statement, statementIs("assignment")), () => relationNone(), value => relationSome([value.value])),
    statement => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.conditional)), () => relationNone(), value => relationSome([
        value.condition,
        ...blockExpressions(value.thenBlock),
        ...relationOptionFold(relationRefine(value.alternative, alternativeIs("else_if")),
            () => relationOptionFold(relationRefine(value.alternative, alternativeIs("else_block")),
                () => [],
                alternative => blockExpressions(alternative.block)),
            alternative => statementExpressions(alternative.statement)),
    ])),
    statement => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.collectionRecurrence)), () => relationNone(), value => relationSome([value.iterable, ...blockExpressions(value.body)])),
    statement => relationOptionFold(relationRefine(statement, statementIs("throw_statement")), () => relationNone(), value => relationSome([value.expression])),
    statement => relationOptionFold(relationRefine(statement, statementIs("include_statement")), () => relationNone(), value => relationSome([value.expression])),
    statement => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.countedRecurrence)), () => relationNone(), value => relationSome([
        ...relationOptionFold(relationRefine(value.initializer, clauseIs("empty")), () => relationOptionFold(relationRefine(value.initializer, clauseIs("expression")), () => [], clause => [clause.value]), () => []),
        ...relationOptionFold(relationRefine(value.condition, clauseIs("empty")), () => relationOptionFold(relationRefine(value.condition, clauseIs("expression")), () => [], clause => [clause.value]), () => []),
        ...relationOptionFold(relationRefine(value.update, clauseIs("empty")), () => relationOptionFold(relationRefine(value.update, clauseIs("expression")), () => [], clause => [clause.value]), () => []),
        ...blockExpressions(value.body),
    ])),
    statement => relationOptionFold(relationRefine(statement, statementIs("try_statement")), () => relationNone(), value => relationSome([
        ...blockExpressions(value.body),
        ...relationExpand(value.catches, catchClause => blockExpressions(catchClause.body)),
        ...relationOptionFold(relationRefine(value.finallyBlock, finallyIs("present")), () => [], finallyClause => blockExpressions(finallyClause.block)),
    ])),
];

const statementExpressions = (statement: PhpStatement): readonly PhpAstValue[] =>
    relationOptionFold(
        relationFirstOption(statementExpressionRules, rule => {
            const result = rule(statement);
            return relationEqual(result.kind, "some");
        }),
        () => [],
        rule => relationOptionFold(rule(statement), () => [], value => value),
    );

const blockExpressions = (block: PhpBlock): readonly PhpAstValue[] =>
    relationExpand(block.statements, statementExpressions);

const statementAssignmentRules: readonly ((statement: PhpStatement, file: string) => RelationOption<readonly AssignmentAst[]>)[] = [
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs("assignment")), () => relationNone(), value => relationSome([assignmentProducer.produce({ statement: value, source: sourceSpan(file, value.source.startOffset, value.source.endOffset) })])),
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.conditional)), () => relationNone(), value => relationSome([
        ...blockAssignments(value.thenBlock, file),
        ...relationOptionFold(relationRefine(value.alternative, alternativeIs("else_if")),
            () => relationOptionFold(relationRefine(value.alternative, alternativeIs("else_block")),
                () => [],
                alternative => blockAssignments(alternative.block, file)),
            alternative => statementAssignments(alternative.statement, file)),
    ])),
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.collectionRecurrence)), () => relationNone(), value => relationSome(blockAssignments(value.body, file))),
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.countedRecurrence)), () => relationNone(), value => relationSome([
        ...relationOptionFold(relationRefine(value.initializer, clauseIs("assignment")), () => [], clause => [assignmentProducer.produce({ statement: { kind: "assignment", target: clause.target, operator: clause.operator, reference: clause.reference, value: clause.value, source: clause.source }, source: sourceSpan(file, clause.source.startOffset, clause.source.endOffset) })]),
        ...relationOptionFold(relationRefine(value.update, clauseIs("assignment")), () => [], clause => [assignmentProducer.produce({ statement: { kind: "assignment", target: clause.target, operator: clause.operator, reference: clause.reference, value: clause.value, source: clause.source }, source: sourceSpan(file, clause.source.startOffset, clause.source.endOffset) })]),
        ...blockAssignments(value.body, file),
    ])),
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs("try_statement")), () => relationNone(), value => relationSome([
        ...blockAssignments(value.body, file),
        ...relationExpand(value.catches, catchClause => blockAssignments(catchClause.body, file)),
        ...relationOptionFold(relationRefine(value.finallyBlock, finallyIs("present")), () => [], finallyClause => blockAssignments(finallyClause.block, file)),
    ])),
];

const blockAssignments = (block: PhpBlock, file: string): readonly AssignmentAst[] =>
    relationExpand(block.statements, statement => statementAssignments(statement, file));

const statementAssignments = (statement: PhpStatement, file: string): readonly AssignmentAst[] =>
    relationOptionFold(
        relationFirstOption(statementAssignmentRules, rule => relationEqual(rule(statement, file).kind, "some")),
        () => [],
        rule => relationOptionFold(rule(statement, file), () => [], value => value),
    );

type ResourceFieldEvidence = { readonly syntax: PhpAstValue; readonly field: string };
const valueIsNestedArray = (value: PhpAstValue): value is Extract<PhpAstValue, { readonly kind: "nested_array" }> => relationEqual(value.kind, "nested_array");
type KeyedStringEntry = Extract<PhpArrayEntry, { readonly kind: "keyed" }> & { readonly key: Extract<PhpArrayKey, { readonly kind: "string" }> };
const entryIsKeyed = (entry: PhpArrayEntry): entry is Extract<PhpArrayEntry, { readonly kind: "keyed" }> => relationEqual(entry.kind, "keyed");
const entryIsKeyedString = (entry: PhpArrayEntry): entry is KeyedStringEntry =>
    relationOptionFold(relationRefine(entry, entryIsKeyed),
        () => false,
        candidate => relationEqual(candidate.key.kind, "string"));
const statementIsReturn = statementIs("return_with_value");

const resourceFieldEvidence = (parsed: PhpMethodAst): readonly ResourceFieldEvidence[] =>
    relationFold(parsed.body, [] as ResourceFieldEvidence[], (fields, statement) =>
        relationOptionFold(relationRefine(statement, statementIsReturn), () => fields, value =>
            relationOptionFold(relationRefine(value.expression, valueIsNestedArray), () => fields, array => [
                ...fields,
                ...relationProject(
                    relationSelect(array.entries, entryIsKeyedString),
                    entry => ({ syntax: entry.value, field: entry.key.value }),
                ),
            ]),
        ),
    );

const expressionOrigin = (directoryKind: "model" | "resource" | "controller" | "service", owner: string, method: string, field: string): ExpressionOrigin =>
    relationGate(relationEqual(directoryKind, "model"),
        () => ({ kind: "model_accessor", model: modelName(owner), accessor: propertyName(method) }),
        () => relationGate(relationEqual(directoryKind, "controller"),
            () => ({ kind: "controller_action", controller: controllerName(owner), action: createActionName(method) }),
            () => relationGate(relationEqual(directoryKind, "service"),
                () => ({ kind: "service_method", service: serviceName(owner), method: methodName(method) }),
                () => ({ kind: "resource_field", resource: resourceName(owner), field: propertyName(field) }))),
    );

const expressionAstsFromMethod = (
    file: string,
    owner: string,
    method: string,
    directoryKind: "model" | "resource" | "controller" | "service",
    parsed: PhpMethodAst,
): readonly ExpressionAst[] => {
    const resourceEvidence = relationGate(relationEqual(directoryKind, "resource"), () => resourceFieldEvidence(parsed), () => [] as ResourceFieldEvidence[]);
    const resourceExpressions = relationProject(resourceEvidence, evidence => expressionProducer.produce({
        syntax: evidence.syntax,
        origin: expressionOrigin(directoryKind, owner, method, evidence.field),
        source: sourceSpan(file, evidence.syntax.source.startOffset, evidence.syntax.source.endOffset),
    }));
    const ordinaryExpressions = relationProject(relationExpand(parsed.body, statementExpressions), syntax => expressionProducer.produce({
        syntax,
        origin: expressionOrigin(directoryKind, owner, method, ""),
        source: sourceSpan(file, syntax.source.startOffset, syntax.source.endOffset),
    }));
    return relationGate(relationEqual(directoryKind, "resource"), () => resourceExpressions, () => ordinaryExpressions);
};

const scanPropertyAsts = async (sourceProject: SourceProjectIdentity): Promise<readonly PropertyAst[]> => {
    const root = sourceProject.root.value.value;
    const files = await collectPhpFiles(path.join(root, "app/Models"));
    const result = await relationAsyncFold(files, [] as PropertyAst[], async (accumulator, file) => {
        const source = await readSourceText(file);
        const tokens = LaravelSourceLexer.tokenize(source);
        const properties = parseModelPropertyAsts(tokens);
        const owner = createClassName(path.basename(file, ".php"));
        const sourceFile = sourceSpan(file, 0, source.length);
        const produced = relationExpand(properties, property => [propertyProducer.produce({
            property,
            context: { kind: "class_property", owner, declaration: { kind: "class_property", owner, role: { kind: "ordinary" } } },
            source: sourceFile,
        })]);
        return relationFold(produced, accumulator, (items, value) => [...items, value]);
    }, 0);
    return Object.freeze(result);
};

const scanSourceExpressionAndAssignmentAsts = async (sourceProject: SourceProjectIdentity): Promise<{ readonly expressions: readonly ExpressionAst[]; readonly assignments: readonly AssignmentAst[] }> => {
    const root = sourceProject.root.value.value;
    const targets: readonly [string, "model" | "resource" | "controller" | "service"][] = [
        ["app/Models", "model"],
        ["app/Http/Resources", "resource"],
        ["app/Http/Controllers", "controller"],
        ["app/Services", "service"],
    ];
    const state = await relationAsyncFold(targets, { expressions: [] as ExpressionAst[], assignments: [] as AssignmentAst[] }, async (outer, [relative, kind]) => {
        const files = await collectPhpFiles(path.join(root, relative));
        return relationAsyncFold(files, outer, async (fileState, file) => {
            const source = await readSourceText(file);
            const tokens = LaravelSourceLexer.tokenize(source);
            const classToken = relationIndexOf(tokens, token => relationEqual(token.value, "class"));
            const classStart = relationGate(classToken < 0, () => 0, () => relationAdvanceIndex(classToken, 1));
            const classTail = relationRange(tokens, classStart, tokens.length);
            const owner = relationOptionFold(
                relationFirstOption(classTail, token => relationEqual(token.type, "IDENTIFIER")),
                () => path.basename(file, ".php"),
                token => token.value,
            );
            const methods: readonly { readonly expression: readonly ExpressionAst[]; readonly assignments: readonly AssignmentAst[] }[] = relationExpand(
                tokens,
                (token, index) => relationGate(relationEqual(token.value, "function"), () => {
                    return relationOptionFold(parsePhpMethod(source, tokens, index), () => [], method => {
                    const accepted = relationGate(relationEqual(kind, "model"), () => {
                        const legacy = relationAll([valueStartsWith(method.name, "get"), valueEndsWith(method.name, "Attribute")]);
                        const modern = relationAll([
                            relationOptionFold(relationVariant(method.declaredReturnType, "declared"), () => false, declared =>
                                relationOptionFold(relationVariant(declared.type, "named"), () => false, named => relationEqual(named.name, "Attribute"))),
                        ]);
                        return relationAny([legacy, modern]);
                    }, () => true);
                    return relationGate(accepted, () => [{
                        expression: expressionAstsFromMethod(file, owner, method.name, kind, method),
                        assignments: relationExpand(method.body, statement => statementAssignments(statement, file)),
                    }], () => []);
                    });
                }, () => []),
            );
            const flattened = methods;
            const expressions = relationExpand(flattened, value => value.expression);
            const assignments = relationExpand(flattened, value => value.assignments);
            return {
                expressions: relationFold(expressions, fileState.expressions, (items, values) => [...items, values]),
                assignments: relationFold(assignments, fileState.assignments, (items, values) => [...items, values]),
            };
        }, 0);
    }, 0);
    return { expressions: Object.freeze(state.expressions), assignments: Object.freeze(state.assignments) };
};

const valueStartsWith = (value: string, prefix: string): boolean => relationEqual(value.startsWith(prefix), true);
const valueEndsWith = (value: string, suffix: string): boolean => relationEqual(value.endsWith(suffix), true);



export async function scanSourceAsts(sourceProject: SourceProjectIdentity): Promise<SourceAsts> {
    const migrations = await scanMigrationAsts(sourceProject);
    const migrationDiscovery = { kind: "migration_asts" as const, items: scanned(migrations) };
    const schema = schemaProducer.produce({ migrations: migrationDiscovery, projectSource: sourceProject.source });
    const models: readonly ModelAst[] = await ModelScanner.scanAsts(sourceProject, migrations);
    const modelSymbolTable = createModelSymbolTable(models);
    const requestBundle = await FormRequestScanner.scanCanonicalBundle(sourceProject);
    const requests: readonly RequestAst[] = requestBundle.asts;
    const requestSources: readonly FormRequestSource[] = requestBundle.sources;
    const formRequestIndex = Object.freeze(relationProject(requestSources, request => [request.identity.requestClass.value.value, request] as const));
    const modelNames = relationUnique(relationProject(models, model => model.definition.identity.name.value.value));
    const attributes = await scanAttributeAsts(sourceProject);
    const customContextualAttributeNames = relationUnique(
        relationProject(
            relationSelect(attributes, attribute => Boolean(attribute.definition.contextual)),
            attribute => attribute.definition.name.value.value,
        ),
    );
    const controllerBundle = await ControllerScanner.scanCanonicalBundle(sourceProject, formRequestIndex, modelNames, customContextualAttributeNames);
    const controllers: readonly ControllerAst[] = controllerBundle.asts;
    const responses = await scanResponseAsts(sourceProject);
    const services = await scanServiceAsts(sourceProject, modelSymbolTable);
    const middlewares = await scanMiddlewareAsts(sourceProject);
    const dtos = await scanDtoAsts(sourceProject);
    const providers = await scanProviderAsts(sourceProject);
    const resources: readonly ResourceAst[] = await ResourceScanner.scanAsts(sourceProject, modelSymbolTable);
    const routes: readonly RouteAst[] = await RouteScanner.scanAsts(sourceProject, requestSources, controllerBundle.controllerIndex, modelNames);
    const channels: readonly ChannelAst[] = await ChannelScanner.scanCanonicalAsts(sourceProject);
    const properties = await scanPropertyAsts(sourceProject);
    const sourceSyntax = await scanSourceExpressionAndAssignmentAsts(sourceProject);
    const expressions = sourceSyntax.expressions;
    const assignments = sourceSyntax.assignments;

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
        properties: { kind: "property_asts", items: sequence(properties) },
        assignments: { kind: "assignment_asts", items: sequence(assignments) },
        expressions: { kind: "expression_asts", items: sequence(expressions) },
        queries: { kind: "query_asts", items: scanned(queries) }
    };
}
