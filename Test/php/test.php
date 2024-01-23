<?php

class Calculation {
    public static function addition($value1, $value2) {
        return $value1 + $value2;
    }
};


class Test {
    public static function SuccessTest(callable $method, $guess, ...$values) {
        $methodResult = $method(...$values);
        $result = "NG";
        if($methodResult === $guess){
            $result = "OK";
        }
        self::resultShow("SuccessTest" ,$result, ...$values);
    }
    public static function FailesTest(callable $method, $guess, ...$values) {
        $methodResult = $method(...$values);
        $result = "OK";
        if($methodResult === $guess){
            $result = "NG";
        }
        self::resultShow("FailedTest" ,$result, ...$values);
    }
    public static function resultShow($testName, $result, ...$values) {
        echo $testName.":".$result."　　値:".implode(",",$values);
        echo "<br/>";
    }
};

Test::SuccessTest([new Calculation(),"addition"],3,1,2);
Test::FailesTest([new Calculation(),"addition"],4,1,2);