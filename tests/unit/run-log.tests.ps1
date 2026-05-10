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

Describe 'Run log' -Tag 'RunLog' {

    It 'Write-RunLog appends JSONL events readable by Get-RunLog' {
        $runId = [guid]::NewGuid().ToString()
        & (Get-Module Tacklebox) { param($r) Write-RunLog -RunId $r -Kind 'cast-start' -Atomic 'T1528-foo' -Data @{ note = 'one' } } $runId
        & (Get-Module Tacklebox) { param($r) Write-RunLog -RunId $r -Kind 'cast-end'   -Atomic 'T1528-foo' -Data @{ status = 'ok' } } $runId

        $events = & (Get-Module Tacklebox) { param($r) Get-RunLog -RunId $r } $runId
        $events.Count | Should -Be 2
        $events[0].kind | Should -Be 'cast-start'
        $events[1].kind | Should -Be 'cast-end'
        $events[0].atomic | Should -Be 'T1528-foo'
    }

    It 'Get-RunLog returns empty array for unknown RunId' {
        $events = & (Get-Module Tacklebox) { param($r) Get-RunLog -RunId $r } 'no-such-run'
        $events.Count | Should -Be 0
    }

    It 'rejects unknown event Kind values' {
        $runId = [guid]::NewGuid().ToString()
        {
            & (Get-Module Tacklebox) { param($r) Write-RunLog -RunId $r -Kind 'bogus' } $runId
        } | Should -Throw
    }
}
