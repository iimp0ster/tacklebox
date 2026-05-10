#requires -Module Pester

BeforeAll {
    $script:RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:TempHome = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath ("tacklebox-tests-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $script:TempHome -Force | Out-Null
    $env:TACKLEBOX_HOME           = $script:TempHome
    $env:TACKLEBOX_LAB_OVERRIDE   = $null
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

Describe 'Test-TackleboxLab' {

    BeforeEach {
        # Reset config between tests.
        $configPath = Join-Path $script:TempHome 'config.json'
        if (Test-Path -LiteralPath $configPath) { Remove-Item -LiteralPath $configPath -Force }
        $env:TACKLEBOX_LAB_OVERRIDE = $null
    }

    It 'throws when no config and no override' {
        { Test-TackleboxLab } | Should -Throw
    }

    It 'returns IsLab=$true when tenant_name matches default lab pattern' {
        @{ tenant_name = 'tacklebox-lab.onmicrosoft.com' } | ConvertTo-Json |
            Set-Content -LiteralPath (Join-Path $script:TempHome 'config.json')
        $r = Test-TackleboxLab -PassThru
        $r.IsLab | Should -BeTrue
        $r.MatchReason | Should -Be 'name-pattern'
    }

    It 'returns IsLab=$true when tenant_id is in lab_allow_list' {
        $tid = '11111111-1111-1111-1111-111111111111'
        @{ tenant_id = $tid; lab_allow_list = @($tid) } | ConvertTo-Json |
            Set-Content -LiteralPath (Join-Path $script:TempHome 'config.json')
        $r = Test-TackleboxLab -PassThru
        $r.IsLab | Should -BeTrue
        $r.MatchReason | Should -Be 'allow-list'
    }

    It 'returns IsLab=$false when tenant does not match pattern or allow-list' {
        @{ tenant_name = 'contoso.onmicrosoft.com' } | ConvertTo-Json |
            Set-Content -LiteralPath (Join-Path $script:TempHome 'config.json')
        $r = Test-TackleboxLab -PassThru
        $r.IsLab | Should -BeFalse
        $r.MatchReason | Should -Be 'no-match'
    }

    It 'reports OverrideActive when TACKLEBOX_LAB_OVERRIDE=1' {
        @{ tenant_name = 'contoso.onmicrosoft.com' } | ConvertTo-Json |
            Set-Content -LiteralPath (Join-Path $script:TempHome 'config.json')
        $env:TACKLEBOX_LAB_OVERRIDE = '1'
        $r = Test-TackleboxLab -PassThru
        $r.IsLab | Should -BeFalse
        $r.OverrideActive | Should -BeTrue
    }

    It 'respects custom lab_pattern_regex' {
        @{ tenant_name = 'mycompany-sandbox.onmicrosoft.com'; lab_pattern_regex = '(?i)sandbox' } |
            ConvertTo-Json | Set-Content -LiteralPath (Join-Path $script:TempHome 'config.json')
        $r = Test-TackleboxLab -PassThru
        $r.IsLab | Should -BeTrue
    }
}
