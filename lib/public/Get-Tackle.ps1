function Get-Tackle {
    <#
    .SYNOPSIS
        Discover atomics in the local atomics/ library.

    .DESCRIPTION
        Walks atomics/<id>/<id>.yaml, parses each, and returns a summary
        object per atomic. Filters apply to the in-memory result. Read-only;
        does not require a lab tenant.

        In Phase 0, the atomics/ directory is empty by design. This cmdlet
        returns an empty array cleanly, which is one of the Phase 0 exit
        criteria.

    .PARAMETER Id
        Wildcard match against the atomic id (folder name).

    .PARAMETER Tactic
        Filter by attack_technique prefix.

    .PARAMETER AuthProfile
        Filter by the auth_profile extension field.

    .PARAMETER DefenseEvasion
        Filter by the defense_evasion extension field.

    .PARAMETER Chokepoint
        Filter by exercises_chokepoint.id.
    #>
    [CmdletBinding()]
    param(
        [string]$Id,
        [string]$Tactic,
        [string]$AuthProfile,
        [string]$DefenseEvasion,
        [string]$Chokepoint
    )

    $atomicsRoot = Join-Path -Path $script:TackleboxModuleRoot -ChildPath 'atomics'
    if (-not (Test-Path -LiteralPath $atomicsRoot)) {
        return @()
    }

    $results = @()

    Get-ChildItem -LiteralPath $atomicsRoot -Directory | ForEach-Object {
        $folder = $_.Name
        $yamlPath = Join-Path -Path $_.FullName -ChildPath "$folder.yaml"
        if (-not (Test-Path -LiteralPath $yamlPath)) { return }

        try {
            $atomic = Read-AtomicYaml -Path $yamlPath
        } catch {
            Write-Warning "Skipping $folder : $($_.Exception.Message)"
            return
        }

        foreach ($test in @($atomic.atomic_tests)) {
            $row = [pscustomobject]@{
                Id              = $folder
                Technique       = $atomic.attack_technique
                DisplayName     = $atomic.display_name
                TestName        = $test.name
                Guid            = $test.auto_generated_guid
                AuthProfile     = $test.auth_profile
                DefenseEvasion  = $test.defense_evasion
                Chokepoint      = if ($test.exercises_chokepoint) { $test.exercises_chokepoint.id } else { $null }
                YamlPath        = $yamlPath
            }
            $results += $row
        }
    }

    if ($Id)             { $results = $results | Where-Object Id -like $Id }
    if ($Tactic)         { $results = $results | Where-Object Technique -like $Tactic }
    if ($AuthProfile)    { $results = $results | Where-Object AuthProfile -like $AuthProfile }
    if ($DefenseEvasion) { $results = $results | Where-Object DefenseEvasion -like $DefenseEvasion }
    if ($Chokepoint)     { $results = $results | Where-Object Chokepoint -like $Chokepoint }

    return $results
}
