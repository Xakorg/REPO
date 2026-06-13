$DesktopPath = [Environment]::GetFolderPath('Desktop')
$AppsFolderPath = Join-Path -Path $DesktopPath -ChildPath "Xakteir Apps"
$WshShell = New-Object -comObject WScript.Shell

if (!(Test-Path -Path $AppsFolderPath)) {
    New-Item -ItemType Directory -Path $AppsFolderPath | Out-Null
}

$ExePath = "c:\Users\ridwa\Downloads\download (31)\dist-electron\win-unpacked\Xakteir Suite.exe"

# Xakteir Hub
$Shortcut = $WshShell.CreateShortcut((Join-Path -Path $AppsFolderPath -ChildPath "Xakteir Hub.lnk"))
$Shortcut.TargetPath = $ExePath
$Shortcut.Save()

# Xak AI
$Shortcut2 = $WshShell.CreateShortcut((Join-Path -Path $AppsFolderPath -ChildPath "Xak AI.lnk"))
$Shortcut2.TargetPath = $ExePath
$Shortcut2.Save()

# Xakteir Suite
$Shortcut3 = $WshShell.CreateShortcut((Join-Path -Path $AppsFolderPath -ChildPath "Xakteir Suite.lnk"))
$Shortcut3.TargetPath = $ExePath
$Shortcut3.Save()

Write-Host "Created Xakteir Apps folder on Desktop with shortcuts!"
