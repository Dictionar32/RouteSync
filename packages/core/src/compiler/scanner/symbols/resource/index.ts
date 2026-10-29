/** Scanner compatibility barrel; semantic binding ownership lives outside scanner. */
export {
    ResourceModelBindingSource,
    type MonoModelBinding,
    type PolyModelBinding,
    type UnbackedDtoBinding,
    type ResourceModelBinding,
    type ResourceModelBindingVisitor,
    type ResourceModelBindingMatcherInterface,
    type ResourceModelBindingFactoryInterface,
    resourceModelBindingMatcher,
    resourceModelBindingFactory,
} from '../../../semantic/resource-model/resourceModelBinding';
