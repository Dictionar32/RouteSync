<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    public function download(Request $request, int $id): Response
    {
        $order = Order::where('user_id', $request->user()->id)
            ->with(['details.produkItem', 'shipping', 'payment', 'promotion'])
            ->findOrFail($id);

        $invoiceNumber = $order->order_number ?: ('INV-' . $order->id);
        $filename = strtolower($invoiceNumber) . '.pdf';

        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $order,
            'invoiceNumber' => $invoiceNumber,
            'issuedAt' => now()->toDateTimeString(),
        ])->setPaper('a4');

        return $pdf->download($filename);
    }
}
