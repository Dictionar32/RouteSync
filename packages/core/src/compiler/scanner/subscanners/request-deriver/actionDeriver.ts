/**
 * actionDeriver.ts
 *
 * Derives FormAction descriptors and actions from ParsedRoute.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { ParsedRoute, matchRouteActionKind } from "../../../../types/route";
import type { FormAction, RequestField } from "../../../../types/domain/request";
import { ScannedFormActionDescriptor } from "../../descriptors/requestDescriptors";

export interface DerivedActionInfo {
    readonly formActionName: string;
    readonly actionObj: FormAction;
    readonly fields: RequestField[];
    readonly isReadRouteWithoutFields: boolean;
}

export function deriveRouteAction(route: ParsedRoute): DerivedActionInfo {
    const actionKind = route.capability.actionKind;

    const fields: RequestField[] = [...route.binding.schema.fields];

    const formActionName = matchRouteActionKind(actionKind, {
        create: () => 'create',
        update: () => 'update',
        read: () => route.binding.actionName.value.value,
        delete: () => 'delete'
    });

    const actionObj: FormAction = new ScannedFormActionDescriptor({
        name: formActionName,
        fields
    });

    const isReadRouteWithoutFields = fields.length === 0 && actionKind === 'read';

    return {
        formActionName,
        actionObj,
        fields,
        isReadRouteWithoutFields
    };
}
