"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Lock, Package, ArrowLeft, MapPin, Loader2,
  CreditCard, Wallet, Building2, ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { AuthGuard, SectionHeader } from "@/components/shared"

import {
  PageContainer, ContentWrapper, BackLink, GridContainer,
  Step1Card, FormGrid,
  Step2Wrapper, SummaryAddressCard,
  PaymentCard, PaymentMethodBtn, PaymentMethodIconBox, PaymentMethodTitle, PaymentMethodDesc, PaymentRadioCircle, PaymentRadioDot,
  OrderSummaryCard, TotalsList, GrandTotalWrapper, InvoiceWrapper,
  StepIndicatorContainer, StepItemWrapper, StepInnerWrapper, StepLine, StepCircle, StepLabel,
  IconArrowLeft, IconChevronRight, IconMapPin, IconCreditCard, IconLock, IconLockSubmit, IconPackage, IconLoader,
  StyledInput, StyledTextarea, SkelOrder, StyledSeparator, SubmitBtn, PaymentBtn, SummaryAddressChangeBtn, OrderItemImg
} from "./checkout.styles"

import { useCheckout, usePayment, Enums, useCart } from '@/api'
import useAuthStore from "@/lib/stores/auth-store"
import { formatPrice } from "@/lib/utils-frontend"
import type * as Types from "@/api/types"
import { z } from "zod"

const CheckoutSchema = z.object({
  shippingNama:    z.string().min(1, "Nama penerima wajib diisi"),
  shippingTelepon: z.string().optional(),
  shippingAlamat:  z.string().min(5, "Alamat lengkap wajib diisi"),
  shippingKota:    z.string().optional(),
  shippingKodePos: z.string().optional(),
})

type OrderFormValues = {
  Create: z.infer<typeof CheckoutSchema>
}

const OrderDefaultValues = {
  create: {
    shippingNama: "", shippingTelepon: "",
    shippingAlamat: "", shippingKota: "", shippingKodePos: "",
  } as OrderFormValues['Create']
}

// ── Metode pembayaran ──────────────────────────────────────
const PAYMENT_METHODS = [
  { id: "transfer_bank", label: "Transfer Bank",    icon: Building2, desc: "BCA · Mandiri · BNI · BRI" },
  { id: "e_wallet",      label: "E-Wallet",         icon: Wallet,    desc: "GoPay · OVO · DANA · ShopeePay" },
  { id: "kartu_kredit",  label: "Kartu Kredit/Debit", icon: CreditCard, desc: "Visa · Mastercard · JCB" },
] as const

type PaymentMethodId = typeof PAYMENT_METHODS[number]["id"]


// ── Step indicator ─────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <StepIndicatorContainer>
      {[
        { n: 1, label: "Alamat" },
        { n: 2, label: "Pembayaran" },
      ].map(({ n, label }, i) => (
        <StepItemWrapper key={n}>
          {i > 0 && <StepLine passed={step > 1 ? "true" : "false"} />}
          <StepInnerWrapper>
            <StepCircle status={step === n ? "current" : step > n ? "passed" : "upcoming"}>{n}</StepCircle>
            <StepLabel status={step === n ? "current" : step > n ? "passed" : "upcoming"}>{label}</StepLabel>
          </StepInnerWrapper>
        </StepItemWrapper>
      ))}
    </StepIndicatorContainer>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { cart, isLoading: cartLoading } = useCart()

  const createOrder = useCheckout.useCreate()

  const createPayment = usePayment.usePost()

  const [step, setStep] = useState<1 | 2>(1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("transfer_bank")
  const [savedOrder, setSavedOrder] = useState<Types.OrderResourceTransformed | null>(null)

  const form = useForm<OrderFormValues['Create']>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: OrderDefaultValues.create,
  })

  // ── Step 1: buat order ──────────────────────────────────
  const onShippingSubmit = async (values: OrderFormValues['Create']) => {
    try {
      const order = await createOrder.mutateAsync(values)
      setSavedOrder(order)
      setStep(2)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      toast.error("Gagal membuat pesanan, coba lagi")
    }
  }

  // ── Step 2: proses payment ──────────────────────────────
  const onPaymentSubmit = async () => {
    if (!savedOrder) return
    try {
      const paymentPayload = {
        orderId: savedOrder.id,
        metode: paymentMethod,
        provider: Enums.Payment.Provider.MOCK,
      }
      const payment = await createPayment.mutateAsync(paymentPayload)
      toast.success("Pembayaran berhasil!")
      router.push(
        `/payment/success?orderId=${savedOrder.id}&invoice=${savedOrder.invoiceNumber}&status=${payment.status}`
      )
    } catch {
      toast.error("Pembayaran gagal, coba lagi")
    }
  }

  if (!isAuthenticated) return <AuthGuard icon={Lock} title="Masuk untuk checkout" />

  const items = cart?.items ?? [];

  return (
    <PageContainer>
      <ContentWrapper>

        <BackLink href="/keranjang">
          <IconArrowLeft size={13} /> Kembali ke Keranjang
        </BackLink>

        <SectionHeader label="Checkout" title="Selesaikan Pesanan" />
        <StepIndicator step={step} />

        <GridContainer>

          {/* ── Left: form ── */}
          <div>

            {/* STEP 1 — Alamat */}
            {step === 1 && (
              <Step1Card>
                <Step1Card.header>
                  <IconMapPin size={16} />
                  <Step1Card.title>Alamat Pengiriman</Step1Card.title>
                </Step1Card.header>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onShippingSubmit)}>

                    <FormField name="shippingNama" control={form.control} render={({ field }) => (
                      <FormItem>
                        <Step1Card.label>
                          Nama Penerima *
                        </Step1Card.label>
                        <FormControl>
                          <StyledInput placeholder="Nama lengkap penerima" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField name="shippingTelepon" control={form.control} render={({ field }) => (
                      <FormItem>
                        <Step1Card.label>
                          Nomor Telepon
                        </Step1Card.label>
                        <FormControl>
                          <StyledInput type="tel" placeholder="08xx-xxxx-xxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField name="shippingAlamat" control={form.control} render={({ field }) => (
                      <FormItem>
                        <Step1Card.label>
                          Alamat Lengkap *
                        </Step1Card.label>
                        <FormControl>
                          <StyledTextarea
                            placeholder="Jalan, nomor, RT/RW, kelurahan, kecamatan..."
                            rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormGrid>
                      <FormField name="shippingKota" control={form.control} render={({ field }) => (
                        <FormItem>
                          <Step1Card.label>Kota</Step1Card.label>
                          <FormControl><StyledInput placeholder="Jakarta" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="shippingKodePos" control={form.control} render={({ field }) => (
                        <FormItem>
                          <Step1Card.label>Kode Pos</Step1Card.label>
                          <FormControl><StyledInput placeholder="12345" maxLength={10} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </FormGrid>

                    <SubmitBtn type="submit"
                      disabled={createOrder.isPending || items.length === 0}>
                      {createOrder.isPending
                        ? <><IconLoader size={14} /> Menyimpan...</>
                        : <>Lanjut ke Pembayaran <IconChevronRight size={14} /></>
                      }
                    </SubmitBtn>
                  </form>
                </Form>
              </Step1Card>
            )}

            {/* STEP 2 — Pembayaran */}
            {step === 2 && savedOrder && (
              <Step2Wrapper>

                {/* Alamat ringkas */}
                <SummaryAddressCard>
                  <SummaryAddressCard.header>
                    <SummaryAddressCard.headerLeft>
                      <IconMapPin size={14} />
                      <SummaryAddressCard.label>Alamat Pengiriman</SummaryAddressCard.label>
                    </SummaryAddressCard.headerLeft>
                    <SummaryAddressChangeBtn onClick={() => setStep(1)}>Ubah</SummaryAddressChangeBtn>
                  </SummaryAddressCard.header>
                  <SummaryAddressCard.name>{form.getValues("shippingNama")}</SummaryAddressCard.name>
                  <SummaryAddressCard.address>{form.getValues("shippingAlamat")}</SummaryAddressCard.address>
                  <SummaryAddressCard.city>
                    {form.getValues("shippingKota")}
                    {form.getValues("shippingKodePos") ? `, ${form.getValues("shippingKodePos")}` : ""}
                  </SummaryAddressCard.city>
                  {form.getValues("shippingTelepon") && (
                    <SummaryAddressCard.phone>{form.getValues("shippingTelepon")}</SummaryAddressCard.phone>
                  )}
                </SummaryAddressCard>

                {/* Pilih metode */}
                <PaymentCard>
                  <PaymentCard.header>
                    <IconCreditCard size={14} />
                    <PaymentCard.label>Metode Pembayaran</PaymentCard.label>
                  </PaymentCard.header>
                  <PaymentCard.list>
                    {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                      <PaymentMethodBtn as="button" key={id} type="button" onClick={() => setPaymentMethod(id)} selected={paymentMethod === id ? "true" : "false"}>
                        <PaymentMethodIconBox selected={paymentMethod === id ? "true" : "false"}>
                          <Icon size={18} className={paymentMethod === id ? "text-gold-400" : "text-obsidian-500"} />
                        </PaymentMethodIconBox>
                        <PaymentMethodBtn.content>
                          <PaymentMethodTitle selected={paymentMethod === id ? "true" : "false"}>{label}</PaymentMethodTitle>
                          <PaymentMethodDesc>{desc}</PaymentMethodDesc>
                        </PaymentMethodBtn.content>
                        <PaymentRadioCircle selected={paymentMethod === id ? "true" : "false"}>
                          {paymentMethod === id && <PaymentRadioDot />}
                        </PaymentRadioCircle>
                      </PaymentMethodBtn>
                    ))}
                  </PaymentCard.list>

                  <PaymentCard.securityInfo>
                    <IconLock size={12} />
                    <PaymentCard.securityText>Transaksi aman & terenkripsi SSL</PaymentCard.securityText>
                  </PaymentCard.securityInfo>
                </PaymentCard>

                <PaymentBtn onClick={onPaymentSubmit}
                  disabled={createPayment.isPending}>
                  {createPayment.isPending
                    ? <><IconLoader size={16} /> Memproses Pembayaran...</>
                    : <><IconLockSubmit size={15} /> Bayar Sekarang</>
                  }
                </PaymentBtn>
              </Step2Wrapper>
            )}
          </div>

          {/* ── Right: order summary ── */}
          <OrderSummaryCard>
            <OrderSummaryCard.header>
              <IconPackage size={14} />
              <OrderSummaryCard.label>Ringkasan Pesanan</OrderSummaryCard.label>
            </OrderSummaryCard.header>

            {cartLoading ? (
              <OrderSummaryCard.skelWrapper>
                <SkelOrder />
                <SkelOrder />
              </OrderSummaryCard.skelWrapper>
            ) : (
              <OrderSummaryCard.list>
                {items.map((item) => (
                  <OrderSummaryCard.itemRow key={item.produkItemId}>
                    <OrderSummaryCard.imgWrapper>
                      {typeof item.produkImageUrl === 'string' && item.produkImageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <OrderItemImg src={item.produkImageUrl} alt={String(item.produkNama ?? '')} />
                      )}
                    </OrderSummaryCard.imgWrapper>
                    <OrderSummaryCard.itemInfo>
                      <OrderSummaryCard.name>{String(item.produkNama ?? '')}</OrderSummaryCard.name>
                      <OrderSummaryCard.desc>×{item.qty} · {formatPrice(item.harga)}</OrderSummaryCard.desc>
                    </OrderSummaryCard.itemInfo>
                    <OrderSummaryCard.subtotal>{formatPrice(item.subtotal)}</OrderSummaryCard.subtotal>
                  </OrderSummaryCard.itemRow>
                ))}
              </OrderSummaryCard.list>
            )}

            <StyledSeparator />
            <TotalsList>
              <TotalsList.row>
                <TotalsList.label>Subtotal</TotalsList.label><TotalsList.value>{formatPrice(cart?.subtotalMinor ?? 0)}</TotalsList.value>
              </TotalsList.row>
              {(cart?.discountMinor ?? 0) > 0 && (
                <TotalsList.discountRow>
                  <TotalsList.label>Diskon</TotalsList.label><TotalsList.value>-{formatPrice(cart?.discountMinor ?? 0)}</TotalsList.value>
                </TotalsList.discountRow>
              )}
              {(cart?.shippingMinor ?? 0) > 0 && (
                <TotalsList.row>
                  <TotalsList.label>Ongkir</TotalsList.label><TotalsList.value>{formatPrice(cart?.shippingMinor ?? 0)}</TotalsList.value>
                </TotalsList.row>
              )}
            </TotalsList>
            <StyledSeparator />
            <GrandTotalWrapper>
              <GrandTotalWrapper.label>Total</GrandTotalWrapper.label>
              <GrandTotalWrapper.value>{formatPrice(cart?.totalHargaMinor ?? 0)}</GrandTotalWrapper.value>
            </GrandTotalWrapper>

            {savedOrder && (
              <InvoiceWrapper>
                <InvoiceWrapper.label>Nomor Pesanan</InvoiceWrapper.label>
                <InvoiceWrapper.value>{savedOrder.invoiceNumber ?? `#${savedOrder.id}`}</InvoiceWrapper.value>
              </InvoiceWrapper>
            )}
          </OrderSummaryCard>
        </GridContainer>
      </ContentWrapper>
    </PageContainer>
  )
}
