# PowerShell script to fix the missing closing parenthesis for both instances
$filePath = "e:\Personal\My Sites\storyfoundry\src\components\world-building\arcs-panel.tsx"
$lines = Get-Content $filePath

# Fix the missing closing parenthesis for the return statement
$fixedLines = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    $lineNumber = $i + 1
    $line = $lines[$i]
    
    # Add the missing closing parenthesis before the })} on specific lines
    if (($lineNumber -eq 3835) -and $line.Trim() -eq "})}") {
        Write-Host "Adding missing closing parenthesis before })} on line $lineNumber"
        $fixedLines += "                          )"
        $fixedLines += $line
        continue
    }
    
    $fixedLines += $line
}

# Write the fixed content back to the file
$fixedLines | Set-Content $filePath -Encoding UTF8
Write-Host "Fixed missing closing parenthesis in arcs-panel.tsx"