<?php 

$array = [[1,2,3],[4,5,6]];
$result = "";
foreach($array as $value){
    $result .= implode("|",$value);
}
echo($result);
echo("<br>");
echo("<br>");


$array = [[1,2,3],[4,5,6]];
$resultArray = array();
foreach($array as $value1){
    foreach($value1 as $value2){
        array_push($resultArray, $value2);
    }
}
$result = implode("|",$resultArray);
echo($result);
echo("<br>");
echo("<br>");


$array = [[1,2,3],[4,5,6]];
function imp($value)
{
    return implode("|", $value);
}
$result = implode("|", array_map('imp', $array));
echo($result);
echo("<br>");
echo("<br>");


$array = [[1,2,3],[4,5,6]];
$result =  implode("|", array_reduce($array, 'array_merge', []));
echo($result);