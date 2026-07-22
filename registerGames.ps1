$gamesDir = "src\components\games"
$dbFile = "src\lib\games-db.ts"
$pageFile = "src\app\games\play\[id]\page.tsx"

$files = Get-ChildItem -Path $gamesDir -Filter "*.tsx"
$baseNames = $files | Select-Object -ExpandProperty BaseName

$dbContent = Get-Content $dbFile -Raw
$pageContent = Get-Content $pageFile -Raw

$existingIds = New-Object System.Collections.Generic.HashSet[string]
$regex = [regex]"id:\s*'([^']+)'"
$matches = $regex.Matches($dbContent)
foreach ($match in $matches) {
    $existingIds.Add($match.Groups[1].Value) | Out-Null
}

$genres = @("Arcade", "Puzzle", "Strategy", "Action", "Sports")

$newGamesData = @()
$newGameMapEntries = @()

foreach ($name in $baseNames) {
    # camelCase
    $first = $name.Substring(0,1).ToLower()
    $rest = $name.Substring(1)
    $id = "$first$rest"
    
    if (-not $existingIds.Contains($id) -and $id -ne "blockDrop" -and $id -ne "mazeMuncher" -and $id -ne "wordGuess" -and $id -ne "spaceRocks" -and $id -ne "rhythmTap") {
        # human name regex replace
        $humanName = $name -creplace '([A-Z])', ' $1'
        $humanName = $humanName.Trim()
        
        $genre = $genres[(Get-Random -Maximum $genres.Length)]
        
        $newGamesData += "  { id: '$id', name: '$humanName', type: '$genre' }"
        $newGameMapEntries += "  ${id}: dynamic(() => import(`"@/components/games/$name`")),"
    }
}

Write-Host "Found $($newGamesData.Count) new games to register."

if ($newGamesData.Count -gt 0) {
    # Update games-db.ts
    $insertIndex = $dbContent.LastIndexOf('];')
    if ($insertIndex -ne -1) {
        $updatedDbContent = $dbContent.Substring(0, $insertIndex) + ",`r`n" + ($newGamesData -join ",`r`n") + "`r`n" + $dbContent.Substring($insertIndex)
        Set-Content -Path $dbFile -Value $updatedDbContent -NoNewline
        Write-Host "Updated games-db.ts"
    }

    # Update page.tsx
    $mapInsertIndex = $pageContent.LastIndexOf('};')
    if ($mapInsertIndex -ne -1) {
        $updatedPageContent = $pageContent.Substring(0, $mapInsertIndex) + ($newGameMapEntries -join "`r`n") + "`r`n" + $pageContent.Substring($mapInsertIndex)
        Set-Content -Path $pageFile -Value $updatedPageContent -NoNewline
        Write-Host "Updated page.tsx"
    }
}
