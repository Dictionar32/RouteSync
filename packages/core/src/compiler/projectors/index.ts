/**
 * index.ts
 *
 * Sub-domain exports for Catamorphic Domain Projectors.
 *
 * @module compiler/projectors
 */

export {
    type DomainProjector,
    type ProjectorOutput
} from './types';

export {
    deriveApiFieldKey,
    extractFieldNamesFromField,
    streamAllRequestFieldNames,
    projectApiFieldConstants
} from './ApiFieldProjector';

export {
    type FormProjectorDependencies,
    FormModelProjector
} from './FormModelProjector';

export {
    ContractProjector
} from './ContractProjector';

export {
    ReadModelProjector
} from './ReadModelProjector';

export {
    MapperProjector
} from './MapperProjector';
