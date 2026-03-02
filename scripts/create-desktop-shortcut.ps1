<#
  Creates "SupplyForge Dev Restart.lnk" on the Desktop.
  Run once: powershell -ExecutionPolicy Bypass -File scripts\create-desktop-shortcut.ps1
#>

$ROOT     = Split-Path $PSScriptRoot -Parent
$SCRIPT   = Join-Path $ROOT "scripts\restart-dev.ps1"
$DESKTOP  = [Environment]::GetFolderPath("Desktop")
$LINK     = Join-Path $DESKTOP "SupplyForge Dev Restart.lnk"

$WS  = New-Object -ComObject WScript.Shell
$SC  = $WS.CreateShortcut($LINK)

$SC.TargetPath       = "powershell.exe"
$SC.Arguments        = "-ExecutionPolicy Bypass -NoExit -File `"$SCRIPT`""
$SC.WorkingDirectory = $ROOT
$SC.WindowStyle      = 1   # Normal window
$SC.Description      = "Clean restart of SupplyForge API (3001) + Web (3003)"

# Use the PowerShell icon
$SC.IconLocation = "powershell.exe,0"

$SC.Save()

Write-Host "Shortcut created: $LINK" -ForegroundColor Green
