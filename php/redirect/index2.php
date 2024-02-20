<?php

echo("POSTの値：");
echo($_POST["name"] ?? "POSTなし");

echo("<br>GETの値：");
echo($_GET["name"] ?? "GETなし");