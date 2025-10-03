$filePath = "e:\Personal\My Sites\storyfoundry\src\components\world-building\philosophies-panel.tsx"
$lines = Get-Content $filePath
$output = $lines[0..1541] + $lines[1849..($lines.Count-1)]
Set-Content -Path $filePath -Value $output
Write-Host "File fixed! Removed lines 1542-1849"
