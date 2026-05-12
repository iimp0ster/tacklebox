#requires -Module Pester

BeforeAll {
    $script:RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:TempHome = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath ("tacklebox-tests-deps-" + [guid]::NewGuid())
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

Describe 'Install-TackleboxDependencies – roadtx manifest' -Tag 'InstallDeps', 'Roadtx' {

    It 'roadtx manifest uses package name roadtx (not roadtools)' {
        $manifestPath = Join-Path $script:RepoRoot 'dependencies/manifests/roadtx.json'
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        $manifest.package | Should -Be 'roadtx'
    }

    It 'roadtx manifest version is not the old placeholder 1.7.0' {
        $manifestPath = Join-Path $script:RepoRoot 'dependencies/manifests/roadtx.json'
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        $manifest.version | Should -Not -Be '1.7.0'
    }

    It 'Install-PipxPackage builds correct pipx spec for roadtx' {
        $pipxCalls = [System.Collections.Generic.List[string]]::new()

        # Mock pipx so no real install happens; capture the spec argument.
        Mock -ModuleName Tacklebox pipx {
            $pipxCalls.Add(($args -join ' '))
        }

        $manifestPath = Join-Path $script:RepoRoot 'dependencies/manifests/roadtx.json'
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json -AsHashtable

        # Call Install-PipxPackage directly via module scope.
        & (Get-Module Tacklebox) {
            param($m)
            Install-PipxPackage -Manifest $m -WhatIf:$false
        } $manifest

        $installCall = $pipxCalls | Where-Object { $_ -match 'install' } | Select-Object -First 1
        $installCall | Should -Match 'roadtx=='
        $installCall | Should -Not -Match 'roadtools'
    }
}
