<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Domain: Monetary Domain
     * Responsibility: Store payment monetary values
     */
    public function up(): void
    {
        Schema::create('payment_amounts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payment_id')->unique();
            $table->foreign('payment_id')
                ->references('id')
                ->on('payments')
                ->cascadeOnDelete();
            
            // Monetary fields
            $table->string('currency_code', 3)->default('IDR');
            $table->bigInteger('amount_minor')->unsigned()->default(0);
            $table->bigInteger('fee_minor')->unsigned()->default(0);
            $table->bigInteger('net_amount_minor')->unsigned()->default(0);
            $table->bigInteger('refund_amount_minor')->unsigned()->default(0);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_amounts');
    }
};
