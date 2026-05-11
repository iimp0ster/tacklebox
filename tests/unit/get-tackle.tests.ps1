#requires -Module Pester

BeforeAll {
    $script:RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:TempHome = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath ("tacklebox-tests-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $script:TempHome -Force | Out-Null
    $env:TACKLEBOX_HOME = $script:TempHome
    $env:TACKLEBOX_LAB_OVERRIDE = '1'
    Import-Module (Join-Path $script:RepoRoot 'Tacklebox.psd1') -Force -ErrorAction Stop
}

AfterAll {
    Remove-Module Tacklebox -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $script:TempHome) {
        Remove-Item -LiteralPath $script:TempHome -Recurse -Force
    }
    $env:TACKLEBOX_HOME = $null
    $env:TACKLEBOX_LAB_OVERRIDE = $null
}

Describe 'Get-Tackle' {

    It 'returns atomics for every authored YAML' {
        $result = Get-Tackle
        # v1 ships 20 atomics; at minimum the harness gate atomic must be present.
        @($result).Count | Should -BeGreaterThan 0
        $result | Where-Object Id -eq 'T1078.004-device-code' | Should -Not -BeNullOrEmpty
    }

    It 'returns an empty array when filtering with no matches' {
        $result = Get-Tackle -Id 'T9999-nope'
        @($result).Count | Should -Be 0
    }

    It 'filters by AuthProfile' {
        $result = Get-Tackle -AuthProfile 'device-code'
        @($result).Count | Should -BeGreaterThan 0
        $result | ForEach-Object { $_.AuthProfile | Should -Be 'device-code' }
    }

    It 'filters by Chokepoint id' {
        $result = Get-Tackle -Chokepoint 'DC-AUTH-001'
        @($result).Count | Should -BeGreaterThan 0
    }
}

Describe 'Implemented cmdlets – smoke tests' {

    It 'Invoke-Tacklebox -DryRun returns a result object' {
        $r = Invoke-Tacklebox -Atomic 'T1078.004-device-code' -DryRun
        $r.Mode   | Should -Be 'DryRun'
        $r.Status | Should -Be 'dry-run'
    }

    It 'Invoke-Tacklebox throws on unknown atomic' {
        { Invoke-Tacklebox -Atomic 'T9999-nope' -DryRun } | Should -Throw '*not found*'
    }

    It 'Invoke-TackleboxRig throws on unknown rig' {
        { Invoke-TackleboxRig -Rig 'nonexistent' -DryRun } | Should -Throw '*not found*'
    }

    It 'Search-TackleboxTelemetry throws on unknown RunId' {
        { Search-TackleboxTelemetry -RunId 'no-such-run' } | Should -Throw '*No run log*'
    }

    It 'Get-TackleboxCoverage returns coverage rows' {
        $result = Get-TackleboxCoverage -Format Json | ConvertFrom-Json
        @($result).Count | Should -BeGreaterThan 0
    }

    It 'Get-TackleboxRig returns rig entries' {
        $result = Get-TackleboxRig
        @($result).Count | Should -BeGreaterThan 0
        $result | Where-Object Name -eq 'tycoon' | Should -Not -BeNullOrEmpty
    }
}
