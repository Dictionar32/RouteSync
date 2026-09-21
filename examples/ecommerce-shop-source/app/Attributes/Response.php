<?php

namespace App\Attributes;

#[\Attribute(\Attribute::TARGET_METHOD)]
class Response
{
    public function __construct(
        public string $type,
        public bool $collection = false
    ) {}
}
