<?php

namespace App\Http\DTOs;

class RegisterResponse
{
    public bool $success;
    public string $message;
    public mixed $data;
}
