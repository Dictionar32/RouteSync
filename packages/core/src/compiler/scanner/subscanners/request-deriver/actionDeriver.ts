/**
 * actionDeriver.ts
 *
 * Derives FormAction descriptors and actions from ParsedRoute.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { ParsedRoute } from "../../../../types/route";
import type { FormAction, RequestField } from "../../../../types/domain/request";
import { TypeInterner } from "../../../types/TypeInterner";
import { ScannedFormActionDescriptor } from "../../descriptors/requestDescriptors";
import { ValidationRuleFieldLowerer } from "../ValidationRuleFieldLowerer";

export interface DerivedActionInfo {
    readonly formActionName: string;
    readonly actionObj: FormAction;
    readonly fields: RequestField[];
    readonly isReadRouteWithoutFields: boolean;
}

export function deriveRouteAction(route: ParsedRoute, interner: TypeInterner): DerivedActionInfo {
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

    const isReadRouteWithoutFields = fields.length === 0 && !route.actionName && !route.schema?.rules && (route.method === 'GET' || route.method === 'HEAD');

    return {
        formActionName,
        actionObj,
        fields,
        isReadRouteWithoutFields
    };
}
