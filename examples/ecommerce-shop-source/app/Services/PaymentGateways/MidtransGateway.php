<?php

namespace App\Services\PaymentGateways;

use App\Models\Order;
use Illuminate\Support\Facades\Http;

class MidtransGateway
{
    public function createSnapTransaction(array $payload, string $idempotencyKey): array
    {
        $serverKey = (string) config('services.midtrans.server_key');

        if (trim($serverKey) === '') {
            abort(422, 'Konfigurasi MIDTRANS_SERVER_KEY belum diisi.');
        }

        $baseUrl = $this->baseUrl();
        $response = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'X-Idempotency-Key' => $idempotencyKey,
            ])
            ->post($baseUrl . '/snap/v1/transactions', $payload);

        if (! $this->responseSuccessful($response)) {
            $statusCode = $this->responseStatus($response) >= 500 ? 502 : 422;
            abort($statusCode, 'Midtrans transaction gagal: ' . $this->responseBody($response));
        }

        $data = $this->responseJson($response);

        if (! is_array($data) || empty($data['token']) || empty($data['redirect_url'])) {
            abort(422, 'Respons Midtrans tidak valid.');
        }

        return $data;
    }

    public function buildSnapPayload(Order $order, int $grossAmount, ?string $metode = null): array
    {
        $shipping = $order->shipping;
        $customerName = $shipping?->nama ?: $order->user?->name ?: 'Customer';
        $firstName = trim(explode(' ', $customerName)[0] ?? 'Customer');

        $payload = [
            'transaction_details' => [
                'order_id' => $order->order_number,
                'gross_amount' => $grossAmount,
            ],
            'customer_details' => [
                'first_name' => $firstName,
                'last_name' => trim(str_replace($firstName, '', $customerName)),
                'email' => $order->user?->email ?: 'customer@example.com',
                'phone' => $shipping?->telepon,
            ],
        ];

        $enabledPayments = $this->resolveEnabledPayments($metode);
        if ($enabledPayments !== []) {
            $payload['enabled_payments'] = $enabledPayments;
        }

        return $payload;
    }

    public function isValidSignature(array $payload): bool
    {
        $serverKey = (string) config('services.midtrans.server_key');
        $signatureKey = (string) ($payload['signature_key'] ?? '');
        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');

        if ($serverKey === '' || $signatureKey === '' || $orderId === '' || $statusCode === '' || $grossAmount === '') {
            return false;
        }

        $expected = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        return hash_equals($expected, $signatureKey);
    }

    private function resolveEnabledPayments(?string $metode): array
    {
        $metode = strtolower((string) $metode);

        return match ($metode) {
            'credit_card', 'kartu', 'kartu_kredit' => ['credit_card'],
            'bank_transfer', 'transfer_bank' => ['bank_transfer'],
            'e-wallet', 'ewallet', 'gopay', 'shopeepay' => ['gopay', 'shopeepay'],
            default => [],
        };
    }

    private function baseUrl(): string
    {
        return (bool) config('services.midtrans.is_production')
            ? 'https://app.midtrans.com'
            : 'https://app.sandbox.midtrans.com';
    }

    private function responseSuccessful(mixed $response): bool
    {
        if (is_object($response) && method_exists($response, 'successful')) {
            return (bool) call_user_func([$response, 'successful']);
        }

        $status = $this->responseStatus($response);

        return $status >= 200 && $status < 300;
    }

    private function responseStatus(mixed $response): int
    {
        if (is_object($response) && method_exists($response, 'status')) {
            return (int) call_user_func([$response, 'status']);
        }

        if (is_object($response) && method_exists($response, 'getStatusCode')) {
            return (int) call_user_func([$response, 'getStatusCode']);
        }

        return 500;
    }

    private function responseBody(mixed $response): string
    {
        if (is_object($response) && method_exists($response, 'body')) {
            return (string) call_user_func([$response, 'body']);
        }

        if (is_object($response) && method_exists($response, '__toString')) {
            return (string) $response;
        }

        return '';
    }

    private function responseJson(mixed $response): array
    {
        if (is_object($response) && method_exists($response, 'json')) {
            $data = call_user_func([$response, 'json']);

            return is_array($data) ? $data : [];
        }

        $decoded = json_decode($this->responseBody($response), true);

        return is_array($decoded) ? $decoded : [];
    }
}
