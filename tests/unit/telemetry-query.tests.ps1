#requires -Module Pester

BeforeAll {
    $script:RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:TempHome = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath ("tacklebox-tests-telemetry-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $script:TempHome -Force | Out-Null
    $env:TACKLEBOX_HOME         = $script:TempHome
    $env:TACKLEBOX_LAB_OVERRIDE = '1'
    Import-Module (Join-Path $script:RepoRoot 'Tacklebox.psd1') -Force -ErrorAction Stop
}

AfterAll {
    Remove-Module Tacklebox -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $script:TempHome) {
        Remove-Item -LiteralPath $script:TempHome -Recurse -Force
    }
    $env:TACKLEBOX_HOME         = $null
    $env:TACKLEBOX_LAB_OVERRIDE = $null
}

Describe 'Invoke-TackleboxEntraSigninQuery – field mapping' -Tag 'TelemetryQuery', 'EntraSignin' {

    It 'does not include authenticationProtocol in the OData filter' {
        InModuleScope Tacklebox {
            $script:captured = $null
            function Get-Module      { [PSCustomObject]@{ Name = 'Microsoft.Graph.Reports' } }
            function Import-Module   {}
            function Get-MgAuditLogSignIn { param($Filter, $Top) $script:captured = $Filter; @() }

            Invoke-TackleboxEntraSigninQuery -Match @{ authenticationProtocol = 'deviceCode'; clientAppUsed = 'Browser' } -Since (Get-Date).AddMinutes(-5)
            $script:captured | Should -Not -BeNullOrEmpty
            $script:captured | Should -Not -Match 'authenticationProtocol'
        }
    }

    It 'includes supported fields like clientAppUsed in the OData filter' {
        InModuleScope Tacklebox {
            $script:captured = $null
            function Get-Module      { [PSCustomObject]@{ Name = 'Microsoft.Graph.Reports' } }
            function Import-Module   {}
            function Get-MgAuditLogSignIn { param($Filter, $Top) $script:captured = $Filter; @() }

            Invoke-TackleboxEntraSigninQuery -Match @{ clientAppUsed = 'Browser' } -Since (Get-Date).AddMinutes(-5)
            $script:captured | Should -Match 'clientAppUsed'
        }
    }

    It 'silently skips unknown match keys without throwing' {
        InModuleScope Tacklebox {
            function Get-Module      { [PSCustomObject]@{ Name = 'Microsoft.Graph.Reports' } }
            function Import-Module   {}
            function Get-MgAuditLogSignIn { param($Filter, $Top) @() }

            { Invoke-TackleboxEntraSigninQuery -Match @{ unknownField = 'value'; clientAppUsed = 'Browser' } -Since (Get-Date).AddMinutes(-5) } |
                Should -Not -Throw
        }
    }
}

Describe 'Search-TackleboxTelemetry – auth pre-check' -Tag 'TelemetryQuery', 'AuthPrecheck' {

    BeforeAll {
        $script:TestRunId = [guid]::NewGuid().ToString()
        $castEvent = @{
            ts     = (Get-Date).ToUniversalTime().ToString('o')
            run_id = $script:TestRunId
            kind   = 'cast-start'
            atomic = 'T9999-telemetry-test'
            data   = @{
                expected_telemetry = @(
                    @{ source = 'entra_signin'; match = @{ clientAppUsed = 'Browser' }; within_minutes = 1 }
                )
            }
        } | ConvertTo-Json -Depth 6 -Compress

        $runsDir = Join-Path $script:TempHome 'runs'
        New-Item -ItemType Directory -Path $runsDir -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $runsDir "$($script:TestRunId).jsonl") -Value $castEvent

    }

    It 'returns Matched=false with Error="Graph not connected" when Get-MgContext returns null' {
        # Define the stub inside InModuleScope so it works even when the Graph
        # module is not installed (Mock requires the command to already exist).
        InModuleScope Tacklebox {
            function Get-MgContext { $null }
        }

        $results = Search-TackleboxTelemetry -RunId $script:TestRunId -WaitMinutes 0
        $results | Should -Not -BeNullOrEmpty
        $results[0].Matched | Should -BeFalse
        $results[0].Error   | Should -Be 'Graph not connected'
    }
}
