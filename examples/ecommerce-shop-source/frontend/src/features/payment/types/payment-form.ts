export type PaymentForm = {
  /**
   * Input untuk membuat payment baru
   */
  Create: {
    /** Metode pembayaran yang dipilih, wajib */
    metode: string;

    /** Provider payment (opsional, default "mock") */
    provider?: string;

    /** Idempotency key opsional untuk mencegah double request, default dibuat otomatis */
    idempotencyKey?: string;

    /** Data tambahan payment, default { source: 'mock' } */
    detail?: Record<string, unknown>;

    /** Kode gateway opsional, misal untuk mock atau override */
    gatewayCode?: string;

    /** Pesan gateway opsional */
    gatewayMessage?: string;
  };

  /**
   * Input untuk update payment (misal update transaction_id)
   */
  Update: {
    transactionId: string;
  };
}