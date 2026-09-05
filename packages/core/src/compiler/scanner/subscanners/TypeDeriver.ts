/**
 * TypeDeriver.ts
 *
 * Derives canonical RequestType[] and ObjectType[] semantic AST streams
 * from parsed routes, resources, and models.
 *
 * @module core/compiler/scanner/subscanners/TypeDeriver
 */

import {
    ParsedRoute,
    ParsedResource,
    ParsedModel,
    ResourceFieldDescriptor,
    ResourceFieldExpressionFactory,
    RouteSchemaPayload,
    RouteValidationRuleEntry,
    ValidationRuleNode,
    ValidationRuleParser,
    DatabaseColumnTypeMapper,
    InlineResponseDescriptor
} from "../../../types/route";
import {
    RequestType,
    FormAction,
    RequestField,
    ResponseData
} from "../../artifacts/RequestTypesArtifact";
import {
    ObjectType,
    ObjectProperty,
    ScannedObjectProperty,
    PrimitiveType,
    PrimitiveKind,
    NullableType,
    ReadonlyCollectionType,
    CollectionKind,
    ReferenceType,
    SemanticType
} from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";
import { ImmutableMap, ImmutableSet } from "../../utils/ImmutableCollections";
import {
    toCamelCase,
    toPascalCase,
    extractClassBasename,
    ResourceNamingConvention
} from "../../../utils/resource-naming";
import {
    ScannedFormFieldDescriptor,
    ScannedFormActionDescriptor,
    ScannedRequestTypeDescriptor
} from "../descriptors/requestDescriptors";
import { ScannedResourceFieldDescriptor } from "../descriptors/resourceDescriptors";

export class TypeDeriver {
    /**
     * 5. Derives Canonical RequestType[] AST streams from parsed routes and resources.
     */
    public static deriveRequestTypes(
        routes: readonly ParsedRoute[] = [],
        resources: readonly ParsedResource[] = [],
        interner: TypeInterner = new TypeInterner(),
        models: readonly any[] = []
    ): readonly RequestType[] {
        const resourceIndex = new Map<string, ParsedResource>();
        for (const res of resources) {
            resourceIndex.set(res.name, res);
            resourceIndex.set(res.name.toLowerCase(), res);
            const bare = res.name.replace(/Resource$/, '').toLowerCase();
            resourceIndex.set(bare, res);
        }

        const modelIndex = new Map<string, any>();
        for (const m of models) {
            modelIndex.set(m.name, m);
            modelIndex.set(m.name.toLowerCase(), m);
        }

        const toSemanticType = (raw: any): SemanticType => {
            if (!raw) return interner.intern(new PrimitiveType(PrimitiveKind.STRING));
            if (raw.kind === 'primitive') {
                const pType = String(raw.type || '').toLowerCase();
                const isNum = pType === 'int' || pType === 'float' || pType.includes('number') || pType.includes('decimal');
                const isBool = pType === 'bool' || pType === 'boolean';
                const primKind = isNum ? PrimitiveKind.NUMBER : (isBool ? PrimitiveKind.BOOLEAN : PrimitiveKind.STRING);
                return interner.intern(new PrimitiveType(primKind));
            }
            if (raw.kind === 'model') {
                const m = modelIndex.get(raw.model) || modelIndex.get(String(raw.model).toLowerCase());
                if (m && m.columns) {
                    const propMap = new Map<string, SemanticType>();
                    for (const col of m.columns) {
                        const primKind = col.semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(col.type);
                        propMap.set(col.name, interner.intern(new PrimitiveType(primKind)));
                    }
                    return new ObjectType(new ImmutableMap(propMap), new ImmutableSet(new Set()));
                }
                return new ReferenceType('App\\Models', raw.model);
            }
            if (raw.kind === 'static_method_call' || raw.kind === 'resource' || (raw.resolved && (raw.resolved.type === 'resource' || raw.resolved.resource))) {
                const resInfo = raw.resolved || raw;
                const resName = resInfo.resource || raw.className || resInfo.model;
                const isCollection = resInfo.collection === true || raw.name === 'collection';
                if (resName) {
                    const refType = new ReferenceType('App\\Http\\Resources', resName);
                    if (isCollection) {
                        return interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, refType));
                    }
                    return refType;
                }
            }
            if (raw.kind === 'array') {
                const elemType = toSemanticType(raw.element);
                return new ReadonlyCollectionType(CollectionKind.ARRAY, elemType);
            }
            if (raw.kind === 'object' || raw.fields) {
                const childFields = raw.fields || {};
                const propMap = new Map<string, SemanticType>();
                for (const [k, v] of Object.entries(childFields)) {
                    propMap.set(k, toSemanticType(v));
                }
                return new ObjectType(new ImmutableMap(propMap), new ImmutableSet(new Set()));
            }
            return interner.intern(new PrimitiveType(PrimitiveKind.STRING));
        };

        const groups = new Map<string, RequestType>();
        for (const route of routes) {
            let rawDomain = route.resourceName;
            if (rawDomain) {
                rawDomain = ResourceNamingConvention.stripSuffix(rawDomain);
            }
            if (!rawDomain && (route.path === '/register' || route.actionName?.endsWith('register'))) {
                rawDomain = 'Register';
            }
            if (!rawDomain && route.name) {
                const nameParts = route.name.split('.');
                rawDomain = nameParts.length > 1
                    ? nameParts.slice(0, -1).map((p, i) => i === 0 ? toCamelCase(p) : toPascalCase(p)).join('')
                    : route.name;
            }
            const rawSegments = (route.path || '').replace(/^\//, '').split('/')
                .filter(segment => segment && segment !== 'api' && segment !== 'v1' && !segment.startsWith('{') && !segment.startsWith(':'));
            if (!rawDomain && rawSegments.length > 1) {
                const camelSegments = rawSegments.map((seg, idx) => {
                    const clean = toCamelCase(seg);
                    return idx === 0 ? clean : toPascalCase(clean);
                });
                rawDomain = camelSegments.join('');
            }
            if (!rawDomain && (route as any).domain) {
                rawDomain = (route as any).domain;
            }
            const routeAction = (route as any).action || route.actionName;
            if (!rawDomain && routeAction) {
                const ctrlMatch = String(routeAction).match(/([A-Z][a-zA-Z0-9_]*?)Controller/);
                if (ctrlMatch) {
                    rawDomain = ctrlMatch[1];
                }
            }
            if (!rawDomain && (route as any).schema?.formTypeName) {
                rawDomain = (route as any).schema.formTypeName.replace(/Form$/, '');
            }
            if (!rawDomain && (route as any).schema?.resourceName) {
                rawDomain = ResourceNamingConvention.stripSuffix((route as any).schema.resourceName);
            }
            if (!rawDomain && route.groupName) {
                rawDomain = route.groupName;
            }
            if (!rawDomain && rawSegments.length > 0) {
                const camelSegments = rawSegments.map((seg, idx) => {
                    const clean = toCamelCase(seg);
                    return idx === 0 ? clean : toPascalCase(clean);
                });
                rawDomain = camelSegments.join('');
            }
            if (!rawDomain) {
                rawDomain = 'App';
            }
            const bareDomain = rawDomain.replace(/Resource$/, '').toLowerCase();

            const actionName = route.actionName || 'action';
            let actionKind = route.actionKind;
            const schemaAction = (route.schema as any)?.action;
            if (schemaAction === 'update' || schemaAction === 'create') {
                actionKind = schemaAction;
            } else if (route.method === 'PUT' || route.method === 'PATCH' || route.name?.endsWith('.update') || route.actionName === 'update') {
                actionKind = 'update';
            } else if (route.method === 'POST' || route.name?.endsWith('.store') || route.actionName === 'store' || route.actionName === 'create') {
                actionKind = 'create';
            } else {
                actionKind = route.isMutating ? 'create' : 'read';
            }

            let fields: RequestField[] = [];
            if (route.schema?.rules) {
                const arrayProps = new Map<string, ObjectProperty[]>();
                const primitiveArrayProps = new Map<string, SemanticType>();
                const regularRules: [string, string][] = [];

                const routeActionDesc = (route as any).action || route.actionName || route.resourceName || (route as any).controllerAction || '';
                const rawRules = route.schema.rules;
                const ruleEntries: readonly [string, string][] = Array.isArray(rawRules)
                    ? (rawRules as readonly any[]).map(r => [String(r.fieldName || r.field || ''), Array.isArray(r.rules) ? r.rules.join('|') : String(r.rules || '')])
                    : Object.entries((rawRules as any) || {}).map(([key, val]) => [String(key || ''), Array.isArray(val) ? val.join('|') : String(val || '')]);

                for (const [key, ruleStr] of ruleEntries) {
                    if (key.includes('.*')) {
                        const hasExplicitType = ruleStr.includes('string') || ruleStr.includes('integer') || ruleStr.includes('numeric') || ruleStr.includes('boolean') || ruleStr.includes('file') || ruleStr.includes('image');
                        if (!hasExplicitType) {
                            console.warn(`[RouteSync Compiler Warning] Tipe elemen untuk wildcard '${key}' pada route ${route.path} (${routeActionDesc}) belum eksplisit.`);
                        }
                    } else {
                        const hasExplicitType = ruleStr.includes('string') || ruleStr.includes('integer') || ruleStr.includes('numeric') || ruleStr.includes('boolean') || ruleStr.includes('array') || ruleStr.includes('file') || ruleStr.includes('image');
                        if (!hasExplicitType) {
                            console.warn(`[RouteSync Compiler Warning] Tipe field untuk '${key}' pada route ${route.path} (${routeActionDesc}) belum eksplisit.`);
                        }
                    }

                    if (key.includes('.*.')) {
                        const [parentKey, childKey] = key.split('.*.');
                        if (!arrayProps.has(parentKey)) {
                            arrayProps.set(parentKey, []);
                        }
                        const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                        const isBool = ruleStr.includes('boolean');
                        let primKind = PrimitiveKind.STRING;
                        if (isNum) {
                            primKind = PrimitiveKind.NUMBER;
                        } else if (isBool) {
                            primKind = PrimitiveKind.BOOLEAN;
                        }
                        const semanticType = interner.intern(new PrimitiveType(primKind));

                        arrayProps.get(parentKey)!.push(ScannedObjectProperty.create({
                            name: childKey,
                            type: semanticType,
                            required: ruleStr.includes('required'),
                            nullable: ruleStr.includes('nullable')
                        }));
                    } else if (key.endsWith('.*')) {
                        const baseKey = key.slice(0, -2);
                        const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                        const isBool = ruleStr.includes('boolean');
                        let primKind = PrimitiveKind.STRING;
                        if (isNum) {
                            primKind = PrimitiveKind.NUMBER;
                        } else if (isBool) {
                            primKind = PrimitiveKind.BOOLEAN;
                        }
                        const semanticType = interner.intern(new PrimitiveType(primKind));
                        const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, semanticType));
                        primitiveArrayProps.set(baseKey, arrayType);
                    } else {
                        regularRules.push([key, ruleStr]);
                    }
                }

                const processedKeys = new Set<string>();
                for (const [key, ruleStr] of regularRules) {
                    processedKeys.add(key);
                    if (arrayProps.has(key)) {
                        const childProperties = arrayProps.get(key)!;
                        const childObjectType = new ObjectType({ name: key, baseName: key, properties: childProperties });
                        const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

                        fields.push(ScannedFormFieldDescriptor.create({
                            name: key,
                            originalName: key,
                            type: arrayType,
                            required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                            nullable: ruleStr.includes('nullable')
                        }));
                    } else if (primitiveArrayProps.has(key)) {
                        fields.push(ScannedFormFieldDescriptor.create({
                            name: key,
                            originalName: key,
                            type: primitiveArrayProps.get(key)!,
                            required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                            nullable: ruleStr.includes('nullable')
                        }));
                    } else {
                        const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                        const isBool = ruleStr.includes('boolean');
                        let primKind = PrimitiveKind.STRING;
                        if (isNum) {
                            primKind = PrimitiveKind.NUMBER;
                        } else if (isBool) {
                            primKind = PrimitiveKind.BOOLEAN;
                        }
                        const semanticType = interner.intern(new PrimitiveType(primKind));

                        fields.push(ScannedFormFieldDescriptor.create({
                            name: key,
                            originalName: key,
                            type: semanticType,
                            required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                            nullable: ruleStr.includes('nullable')
                        }));
                    }
                }

                for (const [parentKey, childProperties] of arrayProps.entries()) {
                    if (!processedKeys.has(parentKey)) {
                        processedKeys.add(parentKey);
                        const childObjectType = new ObjectType({ name: toCamelCase(parentKey), baseName: toCamelCase(parentKey), properties: childProperties });
                        const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

                        fields.push(ScannedFormFieldDescriptor.create({
                            name: parentKey,
                            originalName: parentKey,
                            type: arrayType,
                            required: true,
                            nullable: false
                        }));
                    }
                }

                for (const [baseKey, arrayType] of primitiveArrayProps.entries()) {
                    if (!processedKeys.has(baseKey)) {
                        processedKeys.add(baseKey);
                        fields.push(ScannedFormFieldDescriptor.create({
                            name: baseKey,
                            originalName: baseKey,
                            type: arrayType,
                            required: false,
                            nullable: false
                        }));
                    }
                }
            }

            let formActionName = route.actionName;
            if (formActionName === 'update' || actionKind === 'update' || route.method === 'PUT' || route.method === 'PATCH' || route.name?.endsWith('.update')) {
                formActionName = 'update';
            } else if (!formActionName || formActionName === 'store' || formActionName === 'create' || actionKind === 'create') {
                formActionName = 'create';
            }
            const actionObj: FormAction = new ScannedFormActionDescriptor({
                name: formActionName,
                fields
            });

            let actionRespData: ResponseData | undefined = undefined;
            if (route.response) {
                let respFields: Record<string, SemanticType> = {};
                const resName = (route.response as any)?.resourceName || (route.response as any)?.resource;
                if (route.response.kind === 'resource' && resName) {
                    const foundRes = resourceIndex.get(resName) || resourceIndex.get(resName.toLowerCase());
                    if (foundRes && foundRes.fields) {
                        const rawFields = Array.isArray(foundRes.fields)
                            ? Object.fromEntries(foundRes.fields.map(f => [f.name, f.expression ?? f]))
                            : foundRes.fields;
                        for (const [k, v] of Object.entries(rawFields)) {
                            respFields[k] = toSemanticType(v);
                        }
                    }
                } else if ('fields' in route.response) {
                    const rawFields = Array.isArray((route.response as any).fields)
                        ? Object.fromEntries(((route.response as any).fields as any[]).map(f => [f.name, f.expression ?? f]))
                        : (route.response as any).fields;
                    for (const [k, v] of Object.entries(rawFields || {})) {
                        respFields[k] = toSemanticType(v);
                    }
                }

                const defaultResName = resName || rawDomain;

                actionRespData = {
                    resourceName: defaultResName,
                    fields: respFields,
                    collection: 'collection' in route.response ? !!(route.response as any).collection : false,
                    wrapped: 'wrapped' in route.response ? !!(route.response as any).wrapped : false
                };
            }

            const isReadRouteWithoutFields = fields.length === 0 && !route.actionName && !route.schema?.rules && (route.method === 'GET' || route.method === 'HEAD');

            if (groups.has(bareDomain)) {
                const existing = groups.get(bareDomain)!;
                const newActions = [...existing.actions];
                const existingIdx = newActions.findIndex(a => a.name === formActionName);
                if (!isReadRouteWithoutFields) {
                    if (existingIdx >= 0) {
                        if (fields.length > 0 || newActions[existingIdx].fields.length === 0) {
                            newActions[existingIdx] = actionObj;
                        }
                    } else {
                        newActions.push(actionObj);
                    }
                }

                let newRespData = existing.responseData;
                if (actionRespData && (!existing.responseData || !existing.responseData.fields || Object.keys(existing.responseData.fields).length === 0)) {
                    newRespData = actionRespData;
                }

                groups.set(bareDomain, ScannedRequestTypeDescriptor.create({
                    resourceName: existing.resourceName,
                    formTypeName: existing.formTypeName,
                    actions: newActions,
                    responseData: newRespData
                }));
            } else {
                let respData: ResponseData | undefined = actionRespData;
                if (!respData) {
                    const foundRes = resourceIndex.get(rawDomain) || resourceIndex.get(bareDomain);
                    if (foundRes && foundRes.fields) {
                        const respFields: Record<string, SemanticType> = {};
                        const rawFields = Array.isArray(foundRes.fields)
                            ? Object.fromEntries(foundRes.fields.map(f => [f.name, f.expression ?? f]))
                            : foundRes.fields;
                        for (const [k, v] of Object.entries(rawFields)) {
                            respFields[k] = toSemanticType(v);
                        }
                        respData = {
                            resourceName: `${rawDomain}Resource`,
                            fields: respFields,
                            collection: false,
                            wrapped: false
                        };
                    }
                }

                groups.set(bareDomain, ScannedRequestTypeDescriptor.create({
                    resourceName: toCamelCase(rawDomain),
                    formTypeName: `${toPascalCase(rawDomain)}Form`,
                    actions: isReadRouteWithoutFields ? [] : [actionObj],
                    responseData: respData
                }));
            }
        }

        for (const res of resources) {
            const cleanKey = res.name.replace(/Resource$/, '').toLowerCase();
            const respFields: Record<string, SemanticType> = {};
            const rawFields = Array.isArray(res.fields)
                ? Object.fromEntries(res.fields.map(f => [f.name, f.expression ?? f]))
                : (res.fields || {});
            for (const [k, v] of Object.entries(rawFields)) {
                respFields[k] = toSemanticType(v);
            }

            if (!groups.has(cleanKey)) {
                groups.set(cleanKey, ScannedRequestTypeDescriptor.create({
                    resourceName: res.name,
                    formTypeName: `${res.name}Form`,
                    actions: [],
                    responseData: {
                        resourceName: res.name,
                        fields: respFields,
                        collection: false,
                        wrapped: false
                    }
                }));
            } else {
                const existing = groups.get(cleanKey)!;
                if (!existing.responseData || !existing.responseData.fields || Object.keys(existing.responseData.fields).length === 0) {
                    groups.set(cleanKey, ScannedRequestTypeDescriptor.create({
                        resourceName: existing.resourceName,
                        formTypeName: existing.formTypeName,
                        actions: existing.actions,
                        responseData: {
                            resourceName: res.name,
                            fields: respFields,
                            collection: false,
                            wrapped: false
                        }
                    }));
                }
            }
        }

        return Array.from(groups.values());
    }


    /**
     * 6. Derives Canonical ObjectType[] AST streams leveraging Core TypeInterner and SymbolTable.
     */
    public static deriveSemanticTypes(
        resources: readonly ParsedResource[] = [],
        models: readonly ParsedModel[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): readonly ObjectType[] {
        const types: ObjectType[] = [];
        const seenNames = new Set<string>();

        for (const res of resources) {
            const rawFields: readonly ResourceFieldDescriptor[] = Array.isArray(res.fields)
                ? res.fields
                : Object.entries((res.fields as any) || {}).map(([name, val]: [string, any]) => {
                    const isNull = !!(val?.nullable ?? val?.expression?.nullable ?? val?.resolved?.nullable ?? (typeof val?.resolved?.type === 'string' && val.resolved.type.includes('null')));
                    const expr = val?.expression ?? (val?.kind ? val : ResourceFieldExpressionFactory.primitive(val?.type));
                    const resolvedType = String(val?.resolved?.type ?? expr?.resolved?.type ?? expr?.type ?? '').toLowerCase();
                    const isNum = resolvedType === 'number' || resolvedType === 'int' || resolvedType.includes('int') || resolvedType.includes('decimal') || resolvedType.includes('float') || resolvedType.includes('numeric');
                    const isBool = resolvedType === 'boolean' || resolvedType === 'bool';
                    let semType = PrimitiveKind.STRING;
                    if (isNum) semType = PrimitiveKind.NUMBER;
                    else if (isBool) semType = PrimitiveKind.BOOLEAN;

                    return ScannedResourceFieldDescriptor.create({
                        name,
                        propertyName: toCamelCase(name),
                        expression: expr,
                        semanticType: semType,
                        nullable: isNull
                    });
                });

            const properties: ObjectProperty[] = [];

            const processField = (field: ResourceFieldDescriptor, prefix = '', isNullable = false) => {
                const camelKey = toCamelCase(field.name);
                const propName = prefix ? `${prefix}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}` : camelKey;
                const fKind = field.expression as any;

                if (fKind && typeof fKind === 'object' && (fKind.kind === 'object' || fKind.fields)) {
                    const rawChild = Array.isArray(fKind.fields) ? fKind.fields : Object.entries(fKind.fields || {});
                    for (const cf of rawChild) {
                        const cName = Array.isArray(cf) ? cf[0] : cf.name;
                        const cVal = Array.isArray(cf) ? cf[1] : cf;
                        const childTypeStr = String(cVal?.type ?? cVal?.resolved?.type ?? cVal?.expression?.type ?? '').toLowerCase();
                        const isChildNum = childTypeStr === 'number' || childTypeStr === 'integer' || childTypeStr === 'int' || childTypeStr.includes('int') || childTypeStr.includes('decimal') || childTypeStr.includes('float') || childTypeStr.includes('numeric');
                        const isChildBool = childTypeStr === 'boolean' || childTypeStr === 'bool';
                        let childSemType = PrimitiveKind.STRING;
                        if (isChildNum) childSemType = PrimitiveKind.NUMBER;
                        else if (isChildBool) childSemType = PrimitiveKind.BOOLEAN;

                        const childDesc: ResourceFieldDescriptor = (cVal && typeof cVal === 'object' && 'expression' in cVal)
                            ? (cVal as ResourceFieldDescriptor)
                            : ScannedResourceFieldDescriptor.create({
                                name: cName,
                                propertyName: toCamelCase(cName),
                                expression: cVal?.expression ?? (cVal?.kind ? cVal : ResourceFieldExpressionFactory.primitive(cVal?.type)),
                                semanticType: childSemType,
                                nullable: isNullable || !!fKind.nullable
                            });
                        processField(childDesc, propName, isNullable || !!fKind.nullable);
                    }
                    return;
                }

                let propType: SemanticType = new PrimitiveType(PrimitiveKind.STRING);
                const resolvedType = String(field.semanticType ?? fKind?.resolved?.type ?? fKind?.type ?? '').toLowerCase();
                const isNum = field.semanticType === PrimitiveKind.NUMBER || resolvedType === 'number' || resolvedType === 'int' || resolvedType.includes('int') || resolvedType.includes('decimal') || resolvedType.includes('float') || resolvedType.includes('numeric');
                const isBool = field.semanticType === PrimitiveKind.BOOLEAN || resolvedType === 'boolean' || resolvedType === 'bool';
                const fieldNullable = isNullable || field.nullable || fKind?.nullable || resolvedType.includes('null');

                if (isNum) {
                    propType = new PrimitiveType(PrimitiveKind.NUMBER);
                } else if (isBool) {
                    propType = new PrimitiveType(PrimitiveKind.BOOLEAN);
                } else if (fKind && (fKind.kind === 'array' || fKind.collection)) {
                    const targetRes = fKind.resolved?.resource ?? fKind.resource;
                    const elemType = targetRes 
                        ? new ReferenceType('', `${toPascalCase(targetRes)}Transformed`)
                        : new PrimitiveType(PrimitiveKind.STRING);
                    propType = new ReadonlyCollectionType(CollectionKind.ARRAY, elemType);
                }

                if (fieldNullable) {
                    propType = new NullableType(propType);
                }
                const internedType = interner.intern(propType);

                properties.push(ScannedObjectProperty.create({
                    name: propName,
                    type: internedType,
                    required: true,
                    nullable: !!fieldNullable
                }));
            };

            for (const f of rawFields) {
                processField(f, '', !!f.nullable);
            }
            const baseName = res.name.endsWith('Transformed') ? res.name.replace(/Transformed$/, '') : res.name;
            const typeName = res.typeName ?? (res.name.endsWith('Transformed') ? res.name : `${res.name}Transformed`);
            seenNames.add(typeName);
            const objType = new ObjectType({ name: typeName, baseName, properties });
            types.push(interner.intern(objType) as ObjectType);
        }

        for (const route of routes) {
            let typeName = '';
            let baseName = '';
            let rawFields: any[] = [];

            if (route.response && route.response.kind === 'inline') {
                const inlineResp = route.response as InlineResponseDescriptor;
                typeName = inlineResp.typeName;
                baseName = inlineResp.baseName;
                rawFields = Array.isArray(inlineResp.fields) ? inlineResp.fields : Object.entries(inlineResp.fields || {});
            } else if (route.response && 'fields' in route.response && (route.response as any).fields) {
                const rawDomain = (route as any).domain || route.resourceName || (route.actionName ? route.actionName.replace(/Controller$/, '') : '') || 'Inline';
                typeName = `${toPascalCase(rawDomain)}Transformed`;
                baseName = toPascalCase(rawDomain);
                rawFields = Array.isArray((route.response as any).fields) ? (route.response as any).fields : Object.entries((route.response as any).fields);
            } else if (route.response && (route.response.kind === 'resource' || (route.response as any).resourceName)) {
                const rawDomain = (route as any).domain || route.resourceName || '';
                if (rawDomain && !rawDomain.endsWith('Resource')) {
                    const pascalDomain = toPascalCase(rawDomain);
                    typeName = `${pascalDomain}Transformed`;
                    baseName = pascalDomain;
                    const resName = (route.response as any).resourceName;
                    const targetRes = resName ? `${toPascalCase(resName)}Transformed` : 'unknown';
                    rawFields = [{
                        name: 'data',
                        kind: 'collection',
                        elementType: { kind: 'reference', name: targetRes }
                    }];
                }
            }

            if (typeName && !seenNames.has(typeName)) {
                seenNames.add(typeName);
                const properties: ObjectProperty[] = [];
                const processEntries = (entries: any[], prefix = '') => {
                    for (const item of entries) {
                        const name = Array.isArray(item) ? item[0] : item.name;
                        const val = Array.isArray(item) ? item[1] : item;
                        const camelKey = toCamelCase(name);
                        const propName = prefix ? `${prefix}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}` : camelKey;

                        const valExpr = val?.expression ?? val;

                        if (valExpr && typeof valExpr === 'object' && (valExpr.kind === 'object' || valExpr.fields)) {
                            const childEntries = Array.isArray(valExpr.fields) ? valExpr.fields : Object.entries(valExpr.fields || {});
                            processEntries(childEntries, propName);
                        } else if (valExpr && (valExpr.kind === 'collection' || valExpr.kind === 'array' || valExpr.collection || valExpr.elementType)) {
                            const elem = valExpr.elementType ?? valExpr.element;
                            let elemType: SemanticType = new PrimitiveType(PrimitiveKind.STRING);
                            if (elem?.model) {
                                const foundModel = models.find(m => m.name === elem.model || m.name.toLowerCase() === elem.model.toLowerCase());
                                if (foundModel && foundModel.columns) {
                                    const modelProps: ObjectProperty[] = foundModel.columns.map(c => {
                                        const primKind = c.semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(c.type);
                                        let pType: SemanticType = new PrimitiveType(primKind);
                                        if (c.nullable) {
                                            pType = new NullableType(pType);
                                        }
                                        return ScannedObjectProperty.create({
                                            name: toCamelCase(c.name),
                                            type: interner.intern(pType),
                                            nullable: !!c.nullable,
                                            required: true
                                        });
                                    });
                                    const modelBaseName = extractClassBasename(elem.model);
                                    elemType = new ObjectType({ name: toCamelCase(elem.model), baseName: modelBaseName, properties: modelProps });
                                } else {
                                    elemType = new ReferenceType('', `${toPascalCase(elem.model)}Transformed`);
                                }
                            } else if (elem?.name) {
                                elemType = new ReferenceType('', elem.name);
                            }
                            properties.push(ScannedObjectProperty.create({
                                name: propName,
                                type: interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, elemType)),
                                nullable: false,
                                required: true
                            }));
                        } else {
                            const vType = String(valExpr?.type ?? val?.type ?? val?.resolved?.type ?? '').toLowerCase();
                            const isUnknown = valExpr?.kind === 'unknown' || vType === 'unknown';
                            const isNum = !isUnknown && (val?.semanticType === PrimitiveKind.NUMBER || vType === 'number' || vType === 'int' || vType.includes('int') || vType.includes('decimal') || vType.includes('float') || vType.includes('numeric'));
                            const isBool = !isUnknown && (val?.semanticType === PrimitiveKind.BOOLEAN || vType === 'boolean' || vType === 'bool');
                            const isNull = !!(val?.nullable || valExpr?.nullable || val?.resolved?.nullable || vType.includes('null'));
                            let prim = PrimitiveKind.STRING;
                            if (isUnknown) {
                                prim = PrimitiveKind.UNKNOWN;
                            } else if (isNum) {
                                prim = PrimitiveKind.NUMBER;
                            } else if (isBool) {
                                prim = PrimitiveKind.BOOLEAN;
                            }
                            let propType: SemanticType = new PrimitiveType(prim);
                            if (isNull) {
                                propType = new NullableType(propType);
                            }
                            properties.push(ScannedObjectProperty.create({
                                name: propName,
                                type: interner.intern(propType),
                                nullable: isNull,
                                required: true
                            }));
                        }
                    }
                };

                processEntries(rawFields);
                types.push(interner.intern(new ObjectType({ name: typeName, baseName, properties })) as ObjectType);
            }
        }

        for (const model of models) {
            const modelTypeName = `${toPascalCase(model.name)}Transformed`;
            const modelBaseName = toPascalCase(model.name);
            if (!seenNames.has(modelTypeName)) {
                seenNames.add(modelTypeName);
                const properties: ObjectProperty[] = [];
                const seenPropNames = new Set<string>();

                for (const col of (model.columns || [])) {
                    if (model.hidden && model.hidden.includes(col.name)) continue;
                    const propName = toCamelCase(col.name);
                    seenPropNames.add(propName);

                    const cast = model.casts ? (model.casts as any)[col.name] : undefined;
                    const colTypeStr = String(cast ?? col.semanticType ?? col.type ?? '').toLowerCase();
                    const isNum = colTypeStr === 'number' || colTypeStr === 'int' || colTypeStr === 'integer' || colTypeStr === 'float' || colTypeStr === 'double' || colTypeStr === 'real' || colTypeStr.includes('int') || colTypeStr.includes('decimal') || colTypeStr.includes('float') || colTypeStr.includes('numeric');
                    const isBool = colTypeStr === 'boolean' || colTypeStr === 'bool';
                    let primKind = PrimitiveKind.STRING;
                    if (isNum) primKind = PrimitiveKind.NUMBER;
                    else if (isBool) primKind = PrimitiveKind.BOOLEAN;

                    let propType: SemanticType = new PrimitiveType(primKind);
                    if (col.nullable) {
                        propType = new NullableType(propType);
                    }
                    properties.push(ScannedObjectProperty.create({
                        name: propName,
                        type: interner.intern(propType),
                        nullable: !!col.nullable,
                        required: true
                    }));
                }

                const appendKeys = new Set<string>([
                    ...(model.appends || []),
                    ...Object.keys(model.accessors || {})
                ]);
                for (const key of appendKeys) {
                    const propName = toCamelCase(key);
                    if (seenPropNames.has(propName)) continue;
                    seenPropNames.add(propName);

                    const accessor = model.accessors ? (model.accessors as any)[key] : undefined;
                    const accType = String(accessor?.semantic?.type ?? 'string').toLowerCase();
                    const isNum = accType === 'number' || accType === 'int' || accType === 'float';
                    const isBool = accType === 'boolean' || accType === 'bool';
                    let primKind = PrimitiveKind.STRING;
                    if (isNum) primKind = PrimitiveKind.NUMBER;
                    else if (isBool) primKind = PrimitiveKind.BOOLEAN;

                    properties.push(ScannedObjectProperty.create({
                        name: propName,
                        type: interner.intern(new PrimitiveType(primKind)),
                        nullable: false,
                        required: true
                    }));
                }

                types.push(interner.intern(new ObjectType({
                    name: modelTypeName,
                    baseName: modelBaseName,
                    properties
                })) as ObjectType);
            }
        }

        return types;
    }
}
