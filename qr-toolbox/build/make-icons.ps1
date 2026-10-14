# Generate extension icons (pure ASCII). Run: pwsh -NoProfile -ExecutionPolicy Bypass -File make-icons.ps1
# All coordinates hardcoded for a 256px master, then scaled to 16/48/128.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$qrDir = Join-Path $root 'qr-toolbox\icons'
$mdDir = Join-Path $root 'mock-data-generator\icons'
foreach ($d in @($qrDir, $mdDir)) {
    if (Test-Path $d) { Remove-Item $d -Recurse -Force }
    New-Item -ItemType Directory -Path $d | Out-Null
}

function New-Canvas([int]$px) {
    $bmp = New-Object System.Drawing.Bitmap($px, $px)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $c = @($bmp, $g)
    return $c
}

function Fill-Rounded([System.Drawing.Graphics]$g, [int]$x, [int]$y, [int]$w, [int]$h, [int]$r, $brush) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc($x, $y, $r, $r, 180, 90)
    $p.AddArc(($x + $w - $r), $y, $r, $r, 270, 90)
    $p.AddArc(($x + $w - $r), ($y + $h - $r), $r, $r, 0, 90)
    $p.AddArc($x, ($y + $h - $r), $r, $r, 90, 90)
    $p.CloseFigure()
    $g.FillPath($brush, $p)
    $p.Dispose()
}

# ---------------- QR icon ----------------
$cs = New-Canvas 256
$bmp = $cs[0]; $g = $cs[1]
$white = [System.Drawing.Brushes]::White
$dark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 37, 46))
$accent = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(91, 95, 239))
Fill-Rounded $g 10 10 236 236 44 $white

$N = 21        # modules
$area = 205.0  # px
$off = 25.5    # (256-205)/2
$cell = $area / $N

# finder patterns (7x7 ring + 3x3 core) at module origins (0,0) (14,0) (0,14)
foreach ($origin in @(@(0, 0), @(14, 0), @(0, 14))) {
    for ($i = 0; $i -lt 7; $i++) {
        for ($j = 0; $j -lt 7; $j++) {
            $edge = ($i -eq 0) -or ($i -eq 6) -or ($j -eq 0) -or ($j -eq 6)
            $core = ($i -ge 2) -and ($i -le 4) -and ($j -ge 2) -and ($j -le 4)
            if ($edge -or $core) {
                $mx = $off + ($origin[0] + $i) * $cell
                $my = $off + ($origin[1] + $j) * $cell
                $g.FillRectangle($dark, [float]($mx + 0.5), [float]($my + 0.5), [float]($cell - 1.0), [float]($cell - 1.0))
            }
        }
    }
}

# deterministic data modules
$seed = 20261014
for ($x = 0; $x -lt $N; $x++) {
    for ($y = 0; $y -lt $N; $y++) {
        $inFinder = ($x -lt 7 -and $y -lt 7) -or ($x -ge 14 -and $y -lt 7) -or ($x -lt 7 -and $y -ge 14)
        if ($inFinder) { continue }
        $seed = [double]($seed) * 1103515245.0 + 12345.0
        $seed = $seed % 2147483648.0
        if (($seed % 100.0) -lt 42.0) {
            $mx = $off + $x * $cell
            $my = $off + $y * $cell
            $g.FillRectangle($dark, [float]($mx + 0.5), [float]($my + 0.5), [float]($cell - 1.0), [float]($cell - 1.0))
        }
    }
}
# solid accent 3x3 block in the center
for ($x = 9; $x -le 11; $x++) {
    for ($y = 9; $y -le 11; $y++) {
        $mx = $off + $x * $cell
        $my = $off + $y * $cell
        $g.FillRectangle($accent, [float]($mx + 0.5), [float]($my + 0.5), [float]($cell - 1.0), [float]($cell - 1.0))
    }
}
$g.Dispose()
$qrMaster = $bmp

# ---------------- mock-data icon ----------------
$cs2 = New-Canvas 256
$bmp2 = $cs2[0]; $g2 = $cs2[1]
$white2 = [System.Drawing.Brushes]::White
$head = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(91, 95, 239))
$r1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(64, 67, 176))
$r2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 160, 119))
$r3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 150, 46))
Fill-Rounded $g2 14 14 228 228 40 $white2
$m = 48; $w = 160; $barH = 22; $gap = 22
$y = 58
Fill-Rounded $g2 $m $y $w $barH 11 $head
$y = $y + $barH + $gap
Fill-Rounded $g2 $m $y 138 $barH 11 $r1
$y = $y + $barH + $gap
Fill-Rounded $g2 $m $y 108 $barH 11 $r2
$y = $y + $barH + $gap
Fill-Rounded $g2 $m $y 124 $barH 11 $r3
$g2.Dispose()
$mdMaster = $bmp2

# ---------------- export ----------------
function Export-Icons($master, $dir) {
    foreach ($s in @(16, 48, 128)) {
        $cs3 = New-Canvas $s
        $b = $cs3[0]; $gg = $cs3[1]
        $gg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gg.DrawImage($master, 0, 0, $s, $s)
        $gg.Dispose()
        $path = Join-Path $dir ("icon$s.png")
        $b.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
        $b.Dispose()
        Write-Host ("saved " + $path)
    }
}
Export-Icons $qrMaster $qrDir
Export-Icons $mdMaster $mdDir
$qrMaster.Dispose()
$mdMaster.Dispose()
Write-Host 'ALL DONE'
