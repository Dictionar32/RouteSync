import { CategoryShow, CategoryIndex } from "../types/category-read";
import { CategoryFormValues } from "../contracts/api-schema";
import { CategoryApiField } from "../contracts/api-field";
import { CategoryApiResponse, CategoryApiCreate, CategoryApiUpdate } from "../contracts/api-contract";

export const toApiRead = (api: CategoryApiResponse): CategoryShow => {
  return {
    id: api.id,
    nama: api.nama,
  }
}

export const toApiReadList = (api: CategoryApiResponse[]): CategoryIndex[] => {
  return api.map(toApiRead)
}

export const toApiCreate = (form: CategoryFormValues['Create']): CategoryApiCreate => {
  return {
    [CategoryApiField.NAMA]: form.nama,
  }
}

export const toApiUpdate = (form: CategoryFormValues['Update']): CategoryApiUpdate => {
  return {
    [CategoryApiField.NAMA]: form.nama,
  }
}