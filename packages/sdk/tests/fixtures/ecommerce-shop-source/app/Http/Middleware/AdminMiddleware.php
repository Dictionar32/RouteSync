<?php

class AdminMiddleware
{
    public function handle($request, $next)
    {
        return $next($request);
    }
}
