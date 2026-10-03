import type { FormAction, FormActionName, RequestField } from "../../../artifacts/RequestTypesArtifact";

export interface ScannedFormActionParams {
    readonly name: FormActionName;
    readonly fields: readonly RequestField[];
}

export type ScannedFormActionDescriptor = FormAction;

const createFormActionDescriptor = ({ name, fields }: ScannedFormActionParams): ScannedFormActionDescriptor => Object.freeze({
    name,
    fields: Object.freeze([...fields]),
});

export const ScannedFormActionDescriptor = Object.freeze({
    create({ name, fields = [] }: { readonly name: FormActionName; readonly fields?: readonly RequestField[] }): ScannedFormActionDescriptor {
        return createFormActionDescriptor({ name, fields });
    },
    empty(name: FormActionName): ScannedFormActionDescriptor {
        return createFormActionDescriptor({ name, fields: [] });
    },
});
