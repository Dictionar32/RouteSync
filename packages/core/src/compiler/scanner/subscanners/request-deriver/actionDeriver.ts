/**
 * actionDeriver.ts
 *
 * Derives FormAction descriptors and actions from ParsedRoute.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { ParsedRoute, matchRouteActionKind } from "../../../../types/route";
import { FormActionName, type FormAction, type RequestField } from "../../../../types/domain/request";
import type { Option } from "../../../../types/upstream/collections";
import { ScannedFormActionDescriptor } from "../../descriptors/requestDescriptors";

export interface DerivedActionInfo {
    readonly formActionName: Option<FormActionName>;
    readonly actionObj: readonly FormAction[];
    readonly fields: RequestField[];
}

export function deriveRouteAction(route: ParsedRoute): DerivedActionInfo {
    const actionKind = route.capability.actionKind;

    const fields: RequestField[] = [...route.binding.schema.fields];

    const formActionName: Option<FormActionName> = matchRouteActionKind(actionKind, {
        create: () => ({ kind: 'some', value: FormActionName.Create }),
        update: () => ({ kind: 'some', value: FormActionName.Update }),
        read: () => ({ kind: 'none' }),
        delete: () => ({ kind: 'none' })
    });

    const actionObj: readonly FormAction[] = matchRouteActionKind(actionKind, {
        create: () => [new ScannedFormActionDescriptor({ name: FormActionName.Create, fields })],
        update: () => [new ScannedFormActionDescriptor({ name: FormActionName.Update, fields })],
        read: () => [],
        delete: () => []
    });

    return {
        formActionName,
        actionObj,
        fields
    };
}
