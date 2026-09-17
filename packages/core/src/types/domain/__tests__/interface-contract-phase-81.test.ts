import type {
  FormTypeName,
  PropertyName,
  RequestFieldName,
  ResourceName,
} from '../semanticValues';
import type { RequestField, RequestType, ResponseData } from '../request';

const resourceName = { kind: 'resource_name', value: 'RegisterResponse' } satisfies ResourceName;
const formTypeName = { kind: 'form_type_name', value: 'RegisterRequest' } satisfies FormTypeName;
const sourceName = { kind: 'request_field_name', value: 'email_address' } satisfies RequestFieldName;
const targetName = { kind: 'property_name', value: 'emailAddress' } satisfies PropertyName;

const field = {
  sourceName,
  name: targetName,
  type: { kind: 'primitive', primitive: 'string' },
  fileConstraints: { kind: 'none' },
  required: true,
  nullable: false,
  validationAst: [],
} as unknown as RequestField;

const response: ResponseData = {
  contract: {
    kind: 'object',
    name: { kind: 'response_type_name', value: resourceName.value },
    shape: 'single',
    fields: [],
  },
  fields: [],
};

const request: RequestType = {
  resourceName,
  formTypeName,
  actions: [{ name: 'create', fields: [field] }],
  response: { kind: 'data', value: response },
};

void request;
