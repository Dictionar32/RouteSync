<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'metode' => 'required|string|max:50',
            'detail' => 'nullable|array',
            'provider' => 'nullable|string|in:mock,midtrans',
            'provider_txn_id' => 'nullable|string|max:100',
            'idempotency_key' => 'nullable|string|max:100',
            'gateway_code' => 'nullable|string|max:50',
            'gateway_message' => 'nullable|string',
        ];
    }
}
