#requires -Module Pester

BeforeAll {
    $script:RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:TempHome = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath ("tacklebox-tests-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $script:TempHome -Force | Out-Null
    $env:TACKLEBOX_HOME = $script:TempHome
    $env:TACKLEBOX_LAB_OVERRIDE = '1'   # Suppress module-load warning
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

Describe 'Token cache I/O' -Tag 'TokenCache' {

    BeforeEach {
        $tokenDir = Join-Path $script:TempHome 'tokens'
        if (Test-Path -LiteralPath $tokenDir) {
            Get-ChildItem -LiteralPath $tokenDir -File | Remove-Item -Force
        }
    }

    It 'Read-TokenCache returns $null for missing key' {
        $cache = & (Get-Module Tacklebox) { Read-TokenCache -Key 'missing.tenant_user_client' }
        $cache | Should -BeNullOrEmpty
    }

    It 'Write-TokenCache then Read-TokenCache round-trips' {
        $key = 'tenantA_alice@lab.com_d3590ed6'
        $data = @{
            accessToken  = 'eyJfaketoken'
            tokenType    = 'Bearer'
            expiresOn    = (Get-Date).ToUniversalTime().AddHours(1).ToString('o')
            refreshToken = 'rt_fake'
            tenantId     = 'tenantA'
            _clientId    = 'd3590ed6'
        }
        & (Get-Module Tacklebox) { param($k,$d) Write-TokenCache -Key $k -TokenData $d } $key $data
        $back = & (Get-Module Tacklebox) { param($k) Read-TokenCache -Key $k } $key
        $back.accessToken | Should -Be 'eyJfaketoken'
        $back.tokenType   | Should -Be 'Bearer'
    }

    It 'Write-TokenCache rejects payloads missing required fields' {
        {
            & (Get-Module Tacklebox) {
                Write-TokenCache -Key 'k' -TokenData @{ accessToken = 'x' }
            }
        } | Should -Throw '*missing required field*'
    }

    It 'Read-TokenCache -RequireFresh returns $null for expired tokens' {
        $key = 'tenantA_bob@lab.com_d3590ed6'
        $data = @{
            accessToken = 'expired'
            tokenType   = 'Bearer'
            expiresOn   = (Get-Date).ToUniversalTime().AddMinutes(-10).ToString('o')
        }
        & (Get-Module Tacklebox) { param($k,$d) Write-TokenCache -Key $k -TokenData $d } $key $data
        $stale = & (Get-Module Tacklebox) { param($k) Read-TokenCache -Key $k -RequireFresh } $key
        $stale | Should -BeNullOrEmpty
    }

    It 'Remove-TackleboxTokenCache deletes the file' {
        $key = 'tenantA_carol@lab.com_d3590ed6'
        $data = @{
            accessToken = 'x'; tokenType = 'Bearer'
            expiresOn   = (Get-Date).ToUniversalTime().AddHours(1).ToString('o')
        }
        & (Get-Module Tacklebox) { param($k,$d) Write-TokenCache -Key $k -TokenData $d } $key $data
        & (Get-Module Tacklebox) { param($k) Remove-TackleboxTokenCache -Key $k } $key
        $back = & (Get-Module Tacklebox) { param($k) Read-TokenCache -Key $k } $key
        $back | Should -BeNullOrEmpty
    }
}
