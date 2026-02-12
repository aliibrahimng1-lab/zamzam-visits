$path = "gitacl.txt"
$sid = "S-1-5-21-3079240371-857178067-1894506151-3025631452"
$text = [IO.File]::ReadAllText($path)
$text = $text -replace "\\(D;[^)]*;$sid\\)", ""
[IO.File]::WriteAllText($path, $text, [Text.Encoding]::Unicode)
