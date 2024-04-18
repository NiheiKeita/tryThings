<?php

function codeResult($code){
    ob_start();
    eval($code);
    $output = ob_get_clean();
    return $output;
}
$code = 'echo("テキスト");';
echo codeResult($code) === "テキスト";



