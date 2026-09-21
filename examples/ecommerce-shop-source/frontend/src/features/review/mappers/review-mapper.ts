import type { ReviewDetail, ReviewIndex } from "../types/review-read";
import { ReviewFormValues } from "../contracts/api-schema";
import type { ReviewApiResponse, ReviewApiIndex, ReviewApiCreate } from "../contracts/api-contract";
import { ReviewApiField } from "../contracts/api-field";

export const toApiRead = (api: ReviewApiResponse): ReviewDetail => {
  return {
    id: api.id,
    rating: api.rating,
    title: api.title,
    comment: api.comment,
    isVerifiedPurchase: api.is_verified_purchase,
    createdAt: api.created_at,
  };
}

export const toApiReadList = (api: ReviewApiIndex): ReviewIndex[] => {
  return api.map(toApiRead);
}

export const toApiCreate = (form: ReviewFormValues['Create']): ReviewApiCreate => {
  return {
    [ReviewApiField.RATING]: form.rating,
    [ReviewApiField.TITLE]: form.title,
    [ReviewApiField.COMMENT]: form.comment,
  };
};