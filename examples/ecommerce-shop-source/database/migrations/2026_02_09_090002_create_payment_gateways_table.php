<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Domain: Gateway Integration
     * Responsibility: Store payment gateway specific data
     */
    public function up(): void
    {
        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payment_id')->unique();
            $table->foreign('payment_id')
                ->references('id')
                ->on('payments')
                ->cascadeOnDelete();
            
            // Provider information
            $table->string('provider')->nullable();
            $table->string('provider_txn_id')->nullable();
            $table->string('idempotency_key')->nullable()->unique();
            
            // Gateway status
            $table->string('gateway_status')->nullable();
            $table->string('gateway_code')->nullable();
            $table->text('gateway_message')->nullable();
            
            // Transaction timestamps
            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('reconciled_at')->nullable();
            
            // Reconciliation
            $table->string('reconciliation_batch_id')->nullable();
            
            $table->timestamps();
            
            // Constraints
            $table->unique(['provider', 'provider_txn_id'], 'uq_payment_gateway_provider_txn');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_gateways');
    }
};
