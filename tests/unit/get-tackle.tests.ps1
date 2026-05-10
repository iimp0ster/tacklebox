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

Describe 'Get-Tackle (Phase 0 exit gate)' {

    It 'returns an empty array when no atomics are authored' {
        $result = Get-Tackle
        # The Phase 0 exit criterion: clean empty return, no errors.
        @($result).Count | Should -Be 0
    }

    It 'returns an empty array when filtering with no matches' {
        $result = Get-Tackle -Id 'T9999-nope'
        @($result).Count | Should -Be 0
    }
}

Describe 'Stub cmdlets refuse with Phase pointer' {

    It 'Invoke-Tacklebox throws Phase 1 message' {
        { Invoke-Tacklebox -Atomic 'whatever' -DryRun } | Should -Throw '*Phase 1*'
    }

    It 'Invoke-TackleboxRig throws Phase 4 message' {
        { Invoke-TackleboxRig -Rig 'whatever' -DryRun } | Should -Throw '*Phase 4*'
    }

    It 'Search-TackleboxTelemetry throws Phase 1 message' {
        { Search-TackleboxTelemetry -RunId 'x' } | Should -Throw '*Phase 1*'
    }

    It 'Get-TackleboxCoverage throws Phase 5 message' {
        { Get-TackleboxCoverage } | Should -Throw '*Phase 5*'
    }
}
