import type { EndpointSuccessResponseContract } from '../contracts';
import type {
  InlineResponseDescriptor,
  ModelResponseDescriptor,
  ResourceResponseDescriptor,
  VoidResponseDescriptor,
} from '../responseDescriptors';

type Assert<T extends true> = T;
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;
type NotHasKey<T, K extends PropertyKey> = K extends keyof T ? false : true;

// Response descriptors carry source/API semantics only. Generator artifact names
// (mapper/validator/transformed type) are not upstream contract data.
type DescriptorIdentityRemoved = Assert<
  NotHasKey<
    ResourceResponseDescriptor | ModelResponseDescriptor | InlineResponseDescriptor | VoidResponseDescriptor,
    'identity'
  >
>;

type SuccessContractIsSemantic = Assert<
  NotHasKey<EndpointSuccessResponseContract, 'readTypeName'>
>;
type SuccessContractHasNoMapperName = Assert<
  NotHasKey<EndpointSuccessResponseContract, 'mapperName'>
>;
type SuccessContractHasNoValidatorName = Assert<
  NotHasKey<EndpointSuccessResponseContract, 'validatorName'>
>;
type SuccessContractShapeIsDescriptorOwned = Assert<
  NotHasKey<EndpointSuccessResponseContract, 'shape'>
>;

void (0 as DescriptorIdentityRemoved);
void (0 as SuccessContractIsSemantic);
void (0 as SuccessContractHasNoMapperName);
void (0 as SuccessContractHasNoValidatorName);
void (0 as SuccessContractShapeIsDescriptorOwned);

export {};
