$ws = New-Object -ComObject WScript.Shell
$desktop = $ws.SpecialFolders("Desktop")
$shortcut = $ws.CreateShortcut("$desktop\Future Self Projection.lnk")
# Point to wscript.exe so Windows allows pinning to taskbar
$shortcut.TargetPath = "C:\Windows\System32\wscript.exe"
$shortcut.Arguments = "`"C:\Users\kirill\.vscode\future-self-projection\start-silent.vbs`""
$shortcut.WorkingDirectory = "C:\Users\kirill\.vscode\future-self-projection"
$shortcut.IconLocation = "C:\Users\kirill\.vscode\future-self-projection\build\icon.ico,0"
$shortcut.Description = "Future Self Projection"
$shortcut.Save()
Write-Host "Shortcut created at $desktop\Future Self Projection.lnk"
