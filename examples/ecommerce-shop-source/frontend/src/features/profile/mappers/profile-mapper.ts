import { ProfileShow, ProfileIndex } from "../types/profile-read";
import { ProfileFormValues } from "../contracts/api-schema";
import { ProfileApiResponse, ProfileApiUpdate } from "../contracts/api-contract";
import { ProfileApiField } from "../contracts/api-field";

export const toApiRead = (api: ProfileApiResponse): ProfileShow => {
  return {
    id: api.id,
    name: api.name,
    email: api.email,
  }
}

export const toApiReadList = (api: ProfileApiResponse[]): ProfileIndex[] => {
  return api.map(toApiRead)
}

export const toApiUpdate = (form: ProfileFormValues['Update']): ProfileApiUpdate => {
  return {
    [ProfileApiField.NAME]: form.name,
    [ProfileApiField.EMAIL]: form.email,
  }
}