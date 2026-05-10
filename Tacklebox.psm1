#requires -Version 7.2

# Tacklebox module entrypoint.
#
# Load order matters:
#   1. Resolve module + config root paths.
#   2. Dot-source classes (so private/public scripts can reference them).
#   3. Dot-source private helpers.
#   4. Dot-source public cmdlets.
#   5. Run lab-tenant guard. Refusal here aborts module load — by design.

$script:TackleboxModuleRoot = $PSScriptRoot
$script:TackleboxConfigRoot = if ($env:TACKLEBOX_HOME) {
    $env:TACKLEBOX_HOME
} else {
    Join-Path -Path $HOME -ChildPath '.tacklebox'
}

# Ensure runtime state directories exist. Tests can override TACKLEBOX_HOME
# to point at a temp dir.
foreach ($sub in @('tokens', 'runs', 'tools', 'logs')) {
    $path = Join-Path -Path $script:TackleboxConfigRoot -ChildPath $sub
    if (-not (Test-Path -LiteralPath $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

$loadOrder = @(
    'lib/classes',
    'lib/private',
    'lib/public'
)

foreach ($dir in $loadOrder) {
    $full = Join-Path -Path $PSScriptRoot -ChildPath $dir
    if (-not (Test-Path -LiteralPath $full)) { continue }
    Get-ChildItem -LiteralPath $full -Filter '*.ps1' -File | Sort-Object Name | ForEach-Object {
        . $_.FullName
    }
}

# Lab-tenant guard. If the configured tenant is not labeled as a lab tenant
# AND the operator has not explicitly opted out (TACKLEBOX_LAB_OVERRIDE=1),
# emit a prominent warning. Module still loads — refusal happens at cmdlet
# invocation in Test-TackleboxLab and at the top of every Cast/Validate run.
#
# We do not refuse to load the module entirely because read-only cmdlets
# like Get-Tackle should work without a tenant configured (e.g., for
# documentation-only browsing).

try {
    $labCheck = Test-TackleboxLab -PassThru -ErrorAction Stop
    if (-not $labCheck.IsLab -and -not $labCheck.OverrideActive) {
        Write-Warning -Message ($labCheck.WarningMessage)
    }
} catch {
    Write-Verbose -Message "Tacklebox: lab-tenant guard skipped at module load ($($_.Exception.Message))"
}

Export-ModuleMember -Function @(
    'Invoke-Tacklebox',
    'Invoke-TackleboxRig',
    'Get-Tackle',
    'Get-TackleboxRig',
    'Search-TackleboxTelemetry',
    'Test-TackleboxLab',
    'Get-TackleboxCoverage',
    'Install-TackleboxDependencies'
)
