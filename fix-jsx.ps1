# PowerShell script to fix the JSX syntax errors
$filePath = "e:\Personal\My Sites\storyfoundry\src\components\world-building\arcs-panel.tsx"
$lines = Get-Content $filePath

# Remove the orphaned closing parenthesis on lines 3516 and 3835
$fixedLines = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    $lineNumber = $i + 1
    $line = $lines[$i]
    
    # Skip the problematic lines (3516 and 3835) that contain just closing parenthesis
    if (($lineNumber -eq 3516 -or $lineNumber -eq 3835) -and $line.Trim() -eq ")") {
        Write-Host "Removing orphaned closing parenthesis on line $lineNumber"
        continue
    }
    
    $fixedLines += $line
}

# Write the fixed content back to the file
$fixedLines | Set-Content $filePath -Encoding UTF8
Write-Host "Fixed JSX syntax errors in arcs-panel.tsx"