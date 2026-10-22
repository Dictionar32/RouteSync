/**
 * actionDeriver.ts
 *
 * Derives FormAction descriptors and actions from RouteSemanticFlow.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { type RouteSemanticFlow, matchRouteActionKind } from "../../../types/route";
import { FormActionName, type FormAction, type RequestField } from "../../../types/domain/request";
import type { Option } from "../../../types/upstream/collections";
import { ScannedFormActionDescriptor } from "../../scanner/descriptors/requestDescriptors";

export interface DerivedActionInfo {
    readonly formActionName: Option<FormActionName>;
    readonly actionObj: readonly FormAction[];
    readonly fields: readonly RequestField[];
}

export interface RequestTypeRouteActionDerivationInterface {
    readonly derive: (route: RouteSemanticFlow) => DerivedActionInfo;
}

export const requestTypeRouteActionDerivation: RequestTypeRouteActionDerivationInterface = Object.freeze({
    derive: (route: RouteSemanticFlow): DerivedActionInfo => {
    const actionKind = route.capability.actionKind;

    const fields: readonly RequestField[] = Object.freeze([...route.binding.schema.fields]);

    const formActionName: Option<FormActionName> = matchRouteActionKind<Option<FormActionName>>(actionKind, {
        create: () => ({ kind: 'some', value: FormActionName.Create }),
        update: () => ({ kind: 'some', value: FormActionName.Update }),
        read: () => ({ kind: 'none' }),
        delete: () => ({ kind: 'none' })
    });

    const actionObj: readonly FormAction[] = matchRouteActionKind<readonly FormAction[]>(actionKind, {
        create: () => [ScannedFormActionDescriptor.create({ name: FormActionName.Create, fields })],
        update: () => [ScannedFormActionDescriptor.create({ name: FormActionName.Update, fields })],
        read: () => [],
        delete: () => []
    });

    return Object.freeze({
        formActionName,
        actionObj,
        fields
    });
    },
});
