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

Describe 'Atomic schema validation' -Tag 'Schema' {

    BeforeAll {
        $script:fixturesRoot = Join-Path $script:TempHome 'fixtures'
        New-Item -ItemType Directory -Path $script:fixturesRoot -Force | Out-Null
    }

    It 'accepts a minimal valid atomic' {
        $yaml = @'
attack_technique: T1528
display_name: "Test"
atomic_tests:
  - name: "first"
    auto_generated_guid: 7f3e9d04-3c1b-4e2a-9a1d-9b1f1e6d72a1
    description: "minimal"
    supported_platforms: [linux]
    executor:
      name: powershell
      command: "Write-Output ok"
'@
        $path = Join-Path $script:fixturesRoot 'minimal.yaml'
        Set-Content -LiteralPath $path -Value $yaml
        $atomic = & (Get-Module Tacklebox) { param($p) Read-AtomicYaml -Path $p } $path
        $result = & (Get-Module Tacklebox) { param($a) Test-AtomicSchema -Atomic $a } $atomic
        $result.IsValid | Should -BeTrue
        $result.Errors  | Should -BeNullOrEmpty
    }

    It 'rejects an atomic missing attack_technique' {
        $yaml = @'
display_name: "Bad"
atomic_tests:
  - name: "first"
    auto_generated_guid: 7f3e9d04-3c1b-4e2a-9a1d-9b1f1e6d72a1
    executor:
      name: powershell
      command: "x"
'@
        $path = Join-Path $script:fixturesRoot 'no-tt.yaml'
        Set-Content -LiteralPath $path -Value $yaml
        $atomic = & (Get-Module Tacklebox) { param($p) Read-AtomicYaml -Path $p } $path
        $result = & (Get-Module Tacklebox) { param($a) Test-AtomicSchema -Atomic $a } $atomic
        $result.IsValid | Should -BeFalse
    }

    It 'rejects duplicate auto_generated_guid across atomic_tests' {
        $yaml = @'
attack_technique: T1528
atomic_tests:
  - name: "one"
    auto_generated_guid: 7f3e9d04-3c1b-4e2a-9a1d-9b1f1e6d72a1
    executor: { name: powershell, command: "x" }
  - name: "two"
    auto_generated_guid: 7f3e9d04-3c1b-4e2a-9a1d-9b1f1e6d72a1
    executor: { name: powershell, command: "y" }
'@
        $path = Join-Path $script:fixturesRoot 'dup-guid.yaml'
        Set-Content -LiteralPath $path -Value $yaml
        $atomic = & (Get-Module Tacklebox) { param($p) Read-AtomicYaml -Path $p } $path
        $result = & (Get-Module Tacklebox) { param($a) Test-AtomicSchema -Atomic $a } $atomic
        $result.IsValid | Should -BeFalse
        ($result.Errors -join ' ') | Should -Match 'Duplicate auto_generated_guid'
    }

    It 'Read-AtomicYaml throws on missing file' {
        {
            & (Get-Module Tacklebox) { Read-AtomicYaml -Path '/nonexistent/file.yaml' }
        } | Should -Throw
    }
}
