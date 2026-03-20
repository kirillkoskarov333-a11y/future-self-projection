Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\kirill\.vscode\future-self-projection"
WshShell.Run "node scripts\launch-electron.cjs", 0, False
