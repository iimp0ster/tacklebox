function Get-TackleboxRig {
    <#
    .SYNOPSIS
        Discover kit-profile rigs in rigs/*.yaml.

    .DESCRIPTION
        Returns a summary per rig file. Read-only; does not require a lab
        tenant. In Phase 0 the rigs/ directory is empty; this cmdlet
        returns an empty array.

    .PARAMETER Name
        Wildcard match against the rig name.
    #>
    [CmdletBinding()]
    param(
        [string]$Name
    )

    $rigsRoot = Join-Path -Path $script:TackleboxModuleRoot -ChildPath 'rigs'
    if (-not (Test-Path -LiteralPath $rigsRoot)) { return @() }

    $results = @()
    Get-ChildItem -LiteralPath $rigsRoot -Filter '*.yaml' -File | ForEach-Object {
        try {
            $rig = Read-AtomicYaml -Path $_.FullName
        } catch {
            Write-Warning "Skipping rig $($_.Name): $($_.Exception.Message)"
            return
        }
        $results += [pscustomobject]@{
            Name        = $rig.rig
            DisplayName = $rig.display_name
            UAProfile   = $rig.ua_profile
            Egress      = $rig.egress_profile
            StepCount   = @($rig.steps).Count
            YamlPath    = $_.FullName
        }
    }

    if ($Name) { $results = $results | Where-Object Name -like $Name }
    return $results
}
