# Downloads Satoshi and Gambetta from Fontshare (Indian Type Foundry) and copies the
# three variable WOFF2 files into public/fonts.
#   powershell -ExecutionPolicy Bypass -File scripts\get-fonts.ps1
# Licence: free for commercial use, but the files may not be redistributed. Read the
# licence file inside each download before deploying, and never commit the fonts to a
# public repository. If self-hosting is not allowed for your use, use Fontshare's CSS
# link instead (see public/fonts/README.md).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $root 'public\fonts'
$tmp = Join-Path $env:TEMP 'sak-fonts'
New-Item -ItemType Directory -Force $dest | Out-Null
New-Item -ItemType Directory -Force $tmp | Out-Null

foreach ($font in 'satoshi', 'gambetta') {
  $zip = Join-Path $tmp "$font.zip"
  Write-Host "Downloading $font..."
  Invoke-WebRequest "https://api.fontshare.com/v2/fonts/download/$font" -OutFile $zip
  Expand-Archive $zip -DestinationPath (Join-Path $tmp $font) -Force
}

$wanted = 'Satoshi-Variable.woff2', 'Satoshi-VariableItalic.woff2', 'Gambetta-Variable.woff2'
$found = Get-ChildItem $tmp -Recurse -Filter *.woff2 | Where-Object { $wanted -contains $_.Name }
$found | Copy-Item -Destination $dest -Force

$missing = $wanted | Where-Object { -not (Test-Path (Join-Path $dest $_)) }
if ($missing) {
  Write-Warning ("Not found in the downloads: " + ($missing -join ', ') + ". Copy them into public\fonts by hand.")
} else {
  Write-Host "Fonts ready in public\fonts."
}
Get-ChildItem $dest -Filter *.woff2 | Select-Object Name, Length
