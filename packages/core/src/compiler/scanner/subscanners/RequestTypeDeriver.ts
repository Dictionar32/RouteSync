/**
 * RequestTypeDeriver.ts
 *
 * Derives canonical RequestType[] AST streams from parsed routes and resources.
 *
 * @module core/compiler/scanner/subscanners/RequestTypeDeriver
 */

import {
    ParsedRoute,
    ParsedResource,
    DatabaseColumnTypeMapper
} from "../../../types/route";
import {
    RequestType,
    FormAction,
    RequestField,
    ResponseData
} from "../../artifacts/RequestTypesArtifact";
import {
    ObjectType,
    PrimitiveType,
    PrimitiveKind,
    ReadonlyCollectionType,
    CollectionKind,
    ReferenceType,
    SemanticType
} from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";
import { ImmutableMap, ImmutableSet } from "../../utils/ImmutableCollections";
import {
    toCamelCase,
    toPascalCase
} from "../../../utils/resource-naming";
import {
    ScannedFormActionDescriptor,
    ScannedRequestTypeDescriptor
} from "../descriptors/requestDescriptors";
import { resolvePrimitiveKind, resolveRouteDomain } from "./typeDeriverUtils";
import { ValidationRuleFieldLowerer } from "./ValidationRuleFieldLowerer";

export class RequestTypeDeriver {
    /**
     * Derives Canonical RequestType[] AST streams from parsed routes and resources.
     */
    public static derive(
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
                const primKind = resolvePrimitiveKind(raw.type);
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
            const rawDomain = resolveRouteDomain(route);
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

            const fields: RequestField[] = ValidationRuleFieldLowerer.lower(route, interner);

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
}
