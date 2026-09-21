import { api } from './api/api'
import { EndpointCallable } from 'routesync'

type TestUpdate = typeof api.cartItems.update;
type IsCallable = TestUpdate extends EndpointCallable<any, any, any, any> ? true : false;
type ExtractedBody = TestUpdate extends EndpointCallable<any, any, infer U, any> ? U : never;

const a: IsCallable = true;
const b: ExtractedBody = {} as any;
