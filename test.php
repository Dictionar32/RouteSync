<?php
$code = "test";
if (preg_match('/^[\'\"].*[\'\"]$/s', $code)) {
    echo "test";
}
