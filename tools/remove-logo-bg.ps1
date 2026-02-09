Add-Type -AssemblyName System.Drawing
$src = "assets\zamzam-logo.png"
$dest = "assets\zamzam-logo-transparent.png"
if (-not (Test-Path $src)) { throw "Logo not found at $src" }
$bmp = [System.Drawing.Bitmap]::new($src)
$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0
$found = $false
for ($y = 0; $y -lt $bmp.Height; $y++) {
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.A -gt 10 -and $c.R -gt 200 -and $c.G -lt 90 -and $c.B -lt 90) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
      $found = $true
    }
  }
}
if (-not $found) { throw "Could not detect red region in logo." }
$centerX = ($minX + $maxX) / 2.0
$centerY = ($minY + $maxY) / 2.0
$radius = [Math]::Max(($maxX - $minX), ($maxY - $minY)) / 2.0
$radius = $radius + 2.0
$radiusSq = $radius * $radius
for ($y = 0; $y -lt $bmp.Height; $y++) {
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $dx = $x - $centerX
    $dy = $y - $centerY
    $distSq = ($dx * $dx) + ($dy * $dy)
    if ($distSq -gt $radiusSq) {
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}
$bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output $dest
