<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'produk_item_id' => 'required|integer|exists:produk_items,id',
            'qty' => 'required|integer|min:1',
        ];
    }
}
