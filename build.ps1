# Build script for BTEazy extension
# Creates a distributable zip file for Chrome/Edge Web Store

Write-Host ""
Write-Host "Building BTEazy extension..." -ForegroundColor Cyan
Write-Host ""

# Get version from manifest.json
$manifest = Get-Content "manifest.json" -Raw | ConvertFrom-Json
$version = $manifest.version

# Create dist directory if it doesn't exist
if (-not (Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist" | Out-Null
}

# Output filename
$outputFile = "dist\bteazy-v$version.zip"

# Remove old build if exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
}

# Files and directories to include
$filesToInclude = @(
    "manifest.json",
    "background.js",
    "content.js",
    "content.css",
    "popup.html",
    "popup.js",
    "popup.css",
    "options.html",
    "options.js",
    "options.css",
    "icons"
)

Write-Host "Creating zip file: $outputFile"
Write-Host ""

# Create temporary directory for staging files
$tempDir = "temp_build_$([System.IO.Path]::GetRandomFileName())"
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    # Copy files to temp directory
    foreach ($file in $filesToInclude) {
        if (Test-Path $file) {
            Write-Host "  + $file" -ForegroundColor Green

            if (Test-Path $file -PathType Container) {
                # Copy directory
                Copy-Item -Path $file -Destination $tempDir -Recurse -Force
            } else {
                # Copy file
                Copy-Item -Path $file -Destination $tempDir -Force
            }
        } else {
            Write-Host "  ⚠ Warning: $file not found, skipping..." -ForegroundColor Yellow
        }
    }

    # Create zip file
    Compress-Archive -Path "$tempDir\*" -DestinationPath $outputFile -Force

    # Get file size
    $size = (Get-Item $outputFile).Length
    $sizeInMB = [math]::Round($size / 1MB, 2)

    Write-Host ""
    Write-Host "Build complete" -ForegroundColor Green
    Write-Host "  Version: $version"
    Write-Host "  File: $outputFile"
    Write-Host "  Size: $sizeInMB MB"
    Write-Host ""
    Write-Host "Ready to upload to Chrome/Edge Web Store" -ForegroundColor Cyan
    Write-Host ""

} finally {
    # Clean up temp directory
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
    }
}
