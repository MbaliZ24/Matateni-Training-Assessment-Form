param(
    [string]$Server = "localhost,1433",
    [string]$Database = "TrainingDB",
    [string]$User = "sa",
    [Parameter(Mandatory = $true)]
    [string]$Password
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $PSScriptRoot "init-admin.sql"

Push-Location $projectRoot
try {
    dotnet ef database update
}
finally {
    Pop-Location
}

sqlcmd `
    -S $Server `
    -d $Database `
    -U $User `
    -P $Password `
    -C `
    -i $scriptPath
