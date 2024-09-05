# Define the ignored files
$ignored = @('.git', 'cover.png', 'LICENSE', 'README.md', 'PackageFiles.ps1')

# Get all items in the current folder
$items = Get-ChildItem -Force -Name -Exclude *.zip

# Convert the array to an ArrayList, which is mutable
$items = [System.Collections.ArrayList]$items

# Remove ignored files/folders
$items = $items | Where-Object { $ignored -notcontains $_ }

# Zip up the rest of the files/folders
if ($items.count -gt 0) {
    Compress-Archive -LiteralPath $items -DestinationPath 'GitHubStats.zip' -Force
}
