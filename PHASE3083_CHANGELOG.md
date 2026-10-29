# Phase 3083 Changelog

- Added monotonic open/rejected state to upstream source identity binding batch aggregation.
- Removed `rejections.length === 0` as the batch classification rule.
- Preserved successful identity bindings and their read results when another identity judgment rejects.
- Preserved every rejection in encounter order.
- Added a 14-check structural audit and npm script `audit:phase3083-identity-binding-monotonic-batch`.
- No deleted semantic relation foundation modules were restored.
