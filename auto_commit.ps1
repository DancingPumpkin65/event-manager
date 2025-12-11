# Auto Commit Script - Backfill GitHub Contribution Graph
# Skips weekends + random weekdays for realistic human pattern

$StartDate = Get-Date "2025-12-10"
$EndDate = Get-Date "2026-02-09"

# Realistic commit messages
$commitMessages = @(
    "docs: update documentation",
    "chore: minor cleanup",
    "refactor: code improvements",
    "style: formatting updates",
    "docs: add notes",
    "chore: update config",
    "fix: minor corrections",
    "docs: clarify instructions",
    "chore: routine maintenance",
    "refactor: optimize structure"
)

# Files to modify
$filesToModify = @(
    "CHANGELOG.md",
    "docs/notes.md", 
    "docs/updates.md",
    "README.md"
)

# Create docs folder if not exists
if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force
}

# Create initial files
if (-not (Test-Path "CHANGELOG.md")) {
    "# Changelog`n`nAll notable changes to this project.`n" | Out-File -FilePath "CHANGELOG.md" -Encoding UTF8
}
if (-not (Test-Path "docs/notes.md")) {
    "# Development Notes`n`n" | Out-File -FilePath "docs/notes.md" -Encoding UTF8
}
if (-not (Test-Path "docs/updates.md")) {
    "# Project Updates`n`n" | Out-File -FilePath "docs/updates.md" -Encoding UTF8
}

$currentDate = $StartDate
$totalCommits = 0
$skippedDays = 0

while ($currentDate -le $EndDate) {
    $dayOfWeek = $currentDate.DayOfWeek
    
    # Skip Saturday and Sunday
    if ($dayOfWeek -eq "Saturday" -or $dayOfWeek -eq "Sunday") {
        Write-Host "Skipping $($currentDate.ToString('yyyy-MM-dd')) (Weekend)" -ForegroundColor Yellow
        $currentDate = $currentDate.AddDays(1)
        continue
    }
    
    # ~35% chance to skip a weekday (realistic gaps)
    $skipChance = Get-Random -Minimum 1 -Maximum 100
    if ($skipChance -le 35) {
        Write-Host "Skipping $($currentDate.ToString('yyyy-MM-dd')) (Day off)" -ForegroundColor Magenta
        $skippedDays++
        $currentDate = $currentDate.AddDays(1)
        continue
    }
    
    # Random commits per day: 50% -> 1 commit, 35% -> 2 commits, 15% -> 3 commits
    $commitChance = Get-Random -Minimum 1 -Maximum 100
    if ($commitChance -le 50) {
        $commitsToday = 1
    } elseif ($commitChance -le 85) {
        $commitsToday = 2
    } else {
        $commitsToday = 3
    }
    
    for ($i = 1; $i -le $commitsToday; $i++) {
        # Pick random file and message
        $fileIndex = Get-Random -Minimum 0 -Maximum $filesToModify.Count
        $msgIndex = Get-Random -Minimum 0 -Maximum $commitMessages.Count
        $file = $filesToModify[$fileIndex]
        $message = $commitMessages[$msgIndex]
        
        # Random hour between 9-18
        $hour = Get-Random -Minimum 9 -Maximum 19
        $minute = Get-Random -Minimum 0 -Maximum 60
        
        $commitDateTime = $currentDate.AddHours($hour).AddMinutes($minute)
        $dateStr = $commitDateTime.ToString("yyyy-MM-dd HH:mm:ss")
        $displayDate = $currentDate.ToString("yyyy-MM-dd")
        
        # Add content based on file type
        switch -Wildcard ($file) {
            "CHANGELOG.md" {
                $content = "- [$displayDate] Project maintenance and updates"
                Add-Content -Path $file -Value $content
            }
            "docs/notes.md" {
                $content = "- $displayDate`: Development notes and observations"
                Add-Content -Path $file -Value $content
            }
            "docs/updates.md" {
                $content = "- $displayDate`: Minor updates and improvements"
                Add-Content -Path $file -Value $content
            }
            "README.md" {
                $content = "<!-- Updated: $displayDate -->"
                Add-Content -Path $file -Value $content
            }
        }
        
        # Stage and commit with backdated timestamp
        git add .
        
        $env:GIT_AUTHOR_DATE = $dateStr
        $env:GIT_COMMITTER_DATE = $dateStr
        
        git commit -m "$message ($displayDate)" --date="$dateStr"
        
        $totalCommits++
        Write-Host "[$totalCommits] Committed: $displayDate $hour`:$minute - $message" -ForegroundColor Green
    }
    
    $currentDate = $currentDate.AddDays(1)
}

# Clean up environment variables
Remove-Item Env:GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Total commits created: $totalCommits" -ForegroundColor Cyan
Write-Host "Days skipped (random): $skippedDays" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nReady to push! Run: git push --force" -ForegroundColor Yellow
