import { ApiApiField } from '../contracts/api-field';

import type {
  BuyNowContract,
  CartItemContract,
  LoginContract,
  OrderContract,
  PaymentContract,
  ProfileContract,
  RegisterContract
} from '../contracts/api-contract';

import type {
  BuyNowForm,
  CartItemForm,
  LoginForm,
  OrderForm,
  PaymentForm,
  ProfileForm,
  RegisterForm
} from '../forms/api-form';

// ========== FORM MAPPERS ==========
export const toApiLoginUpdate = (form: LoginForm['Update']): LoginContract['Update'] => ({
  [ApiApiField.EMAIL]: form.email,
  [ApiApiField.PASSWORD]: form.password,
})

export const toApiRegisterUpdate = (form: RegisterForm['Update']): RegisterContract['Update'] => ({
  [ApiApiField.NAME]: form.name,
  [ApiApiField.EMAIL]: form.email,
  [ApiApiField.PASSWORD]: form.password,
})

export const toApiBuyNowCreate = (form: BuyNowForm['Create']): BuyNowContract['Create'] => ({
  [ApiApiField.PRODUKITEMID]: form.produkItemId,
  [ApiApiField.QTY]: form.qty,
  [ApiApiField.SHIPPINGNAMA]: form.shippingNama,
  [ApiApiField.SHIPPINGTELEPON]: form.shippingTelepon,
  [ApiApiField.SHIPPINGALAMAT]: form.shippingAlamat,
  [ApiApiField.SHIPPINGKOTA]: form.shippingKota,
  [ApiApiField.SHIPPINGKODEPOS]: form.shippingKodePos,
})

export const toApiCartItemCreate = (form: CartItemForm['Create']): CartItemContract['Create'] => ({
  [ApiApiField.PRODUKITEMID]: form.produkItemId,
  [ApiApiField.QTY]: form.qty,
})

export const toApiCartItemUpdate = (form: CartItemForm['Update']): CartItemContract['Update'] => ({
  [ApiApiField.QTY]: form.qty,
})

export const toApiOrderCreate = (form: OrderForm['Create']): OrderContract['Create'] => ({
  [ApiApiField.ITEMS]: form.items?.map(item => ({
    [ApiApiField.PRODUKITEMID]: item.produkItemId,
    [ApiApiField.QTY]: item.qty
  })),
  [ApiApiField.SHIPPINGNAMA]: form.shippingNama,
  [ApiApiField.SHIPPINGTELEPON]: form.shippingTelepon,
  [ApiApiField.SHIPPINGALAMAT]: form.shippingAlamat,
  [ApiApiField.SHIPPINGKOTA]: form.shippingKota,
  [ApiApiField.SHIPPINGKODEPOS]: form.shippingKodePos,
})

export const toApiPaymentCreate = (form: PaymentForm['Create']): PaymentContract['Create'] => ({
  [ApiApiField.METODE]: form.metode,
  [ApiApiField.DETAIL]: form.detail,
  [ApiApiField.PROVIDER]: form.provider,
  [ApiApiField.PROVIDERTXNID]: form.providerTxnId,
  [ApiApiField.IDEMPOTENCYKEY]: form.idempotencyKey,
  [ApiApiField.GATEWAYCODE]: form.gatewayCode,
  [ApiApiField.GATEWAYMESSAGE]: form.gatewayMessage,
})

export const toApiProfileUpdate = (form: ProfileForm['Update']): ProfileContract['Update'] => ({
  [ApiApiField.NAME]: form.name,
  [ApiApiField.EMAIL]: form.email,
})
