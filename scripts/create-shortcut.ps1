$ws = New-Object -ComObject WScript.Shell
$desktop = $ws.SpecialFolders("Desktop")
$shortcut = $ws.CreateShortcut("$desktop\Future Self Projection.lnk")
$shortcut.TargetPath = "C:\Users\kirill\.vscode\future-self-projection\start-silent.vbs"
$shortcut.WorkingDirectory = "C:\Users\kirill\.vscode\future-self-projection"
$shortcut.IconLocation = "C:\Users\kirill\.vscode\future-self-projection\build\icon.ico,0"
$shortcut.Description = "Future Self Projection"
$shortcut.Save()
Write-Host "Shortcut created at: $desktop\Future Self Projection.lnk"
