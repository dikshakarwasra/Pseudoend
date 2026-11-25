Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\portal\public\logo-source.jpg"
$outDir = Join-Path $PSScriptRoot "..\portal\public"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found at $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutPath
    )
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $destImage = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $destImage.SetResolution($Image.HorizontalResolution, $Image.VerticalResolution)

    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $wrapMode = New-Object System.Drawing.Imaging.ImageAttributes
    $wrapMode.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $graphics.DrawImage($Image, $destRect, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel, $wrapMode)

    $destImage.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destImage.Dispose()
    Write-Host "Created $OutPath ($($Width)x$($Height))"
}

# 1. Standard PNG icons
Resize-Image -Image $srcImg -Width 16 -Height 16 -OutPath (Join-Path $outDir "favicon-16x16.png")
Resize-Image -Image $srcImg -Width 32 -Height 32 -OutPath (Join-Path $outDir "favicon-32x32.png")
Resize-Image -Image $srcImg -Width 48 -Height 48 -OutPath (Join-Path $outDir "favicon-48x48.png")
Resize-Image -Image $srcImg -Width 180 -Height 180 -OutPath (Join-Path $outDir "apple-touch-icon.png")
Resize-Image -Image $srcImg -Width 192 -Height 192 -OutPath (Join-Path $outDir "android-chrome-192x192.png")
Resize-Image -Image $srcImg -Width 512 -Height 512 -OutPath (Join-Path $outDir "android-chrome-512x512.png")
Resize-Image -Image $srcImg -Width 512 -Height 512 -OutPath (Join-Path $outDir "logo.png")

# 2. OpenGraph / Twitter Card banner (1200x630)
$ogWidth = 1200
$ogHeight = 630
$ogBitmap = New-Object System.Drawing.Bitmap($ogWidth, $ogHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ogGraphics = [System.Drawing.Graphics]::FromImage($ogBitmap)
$darkBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#0b0f19"))
$ogGraphics.FillRectangle($darkBgBrush, 0, 0, $ogWidth, $ogHeight)

# Center the logo (400x400)
$logoSize = 420
$logoX = ($ogWidth - $logoSize) / 2
$logoY = ($ogHeight - $logoSize) / 2
$ogGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ogGraphics.DrawImage($srcImg, $logoX, $logoY, $logoSize, $logoSize)

$ogPath = Join-Path $outDir "og-image.png"
$ogBitmap.Save($ogPath, [System.Drawing.Imaging.ImageFormat]::Png)
$ogGraphics.Dispose()
$ogBitmap.Dispose()
Write-Host "Created $ogPath (1200x630)"

$srcImg.Dispose()
Write-Host "All icons generated successfully!"
