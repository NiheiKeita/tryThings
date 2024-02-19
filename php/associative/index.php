<?php

$array = [
    ["id" => 1,"name" => "taro"],
    ["id" => 2,"name" => "jiro"],
    ["id" => 3,"name" => "saburo"]
];

$result = [];
foreach($array as $value){
    array_push($result, $value['id']);
}

print_r($result);
echo("<br>");
echo("<br>");



$array = [
    ["id" => 1,"name" => "taro"],
    ["id" => 2,"name" => "jiro"],
    ["id" => 3,"name" => "saburo"]
];

$result = array_column($array, "id");

print_r($result);
echo("<br>");
echo("<br>");


$array = [
    ["id" => 1,"name" => "taro","test_scores" => ["math" => 25, "science" => 59]],
    ["id" => 2,"name" => "jiro","test_scores" => ["math" => 66, "science" => 19]],
    ["id" => 3,"name" => "saburo","test_scores" => ["math" => 40, "science" => 80]]
];

$testScores = array_column($array, "test_scores");
$result = array_column($testScores, "math");

print_r($result);
echo("<br>");
echo("<br>");


$array = [
    ["id" => 1, "name" => "taro", "test_scores" => ["math" => 25, "science" => 59]],
    ["id" => 2, "name" => "jiro", "test_scores" => ["math" => 66, "science" => 19]],
    ["id" => 3, "name" => "saburo", "test_scores" => ["math" => 40, "science" => 80]]
];

function mathTestScores($value)
{
    return $value["test_scores"]["math"];
}

$result = array_map("mathTestScores", $array);

print_r($result);
