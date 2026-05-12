#requires -Module Pester

BeforeAll {
    $script:RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $script:TempHome = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath ("tacklebox-tests-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $script:TempHome -Force | Out-Null
    $env:TACKLEBOX_HOME         = $script:TempHome
    $env:TACKLEBOX_LAB_OVERRIDE = '1'
    Import-Module (Join-Path $script:RepoRoot 'Tacklebox.psd1') -Force -ErrorAction Stop

    # Minimal valid atomic YAML used across multiple tests.
    $script:MinimalYaml = @'
attack_technique: T1078.004
display_name: "Test Atomic"
atomic_tests:
  - name: "single-test"
    auto_generated_guid: aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb
    description: "Minimal test for unit testing"
    supported_platforms: [windows, linux, macos]
    input_arguments:
      target:
        description: "Target value"
        type: String
        default: "default-target"
      required_arg:
        description: "A required arg (no default)"
        type: String
    executor:
      name: powershell
      command: "Write-Output '#{target}'"
    auth_profile: "device-code"
    defense_evasion: "MFA bypass"
    requires_token: false
    expected_telemetry:
      - source: entra_signin
        match:
          authenticationProtocol: "deviceCode"
        within_minutes: 5
    exercises_chokepoint:
      id: "DC-AUTH-001"
'@

    $script:MultiTestYaml = @'
attack_technique: T1078.004
display_name: "Multi-test Atomic"
atomic_tests:
  - name: "test-one"
    auto_generated_guid: 11112222-3333-4444-5555-666677778888
    executor: { name: powershell, command: "Write-Output one" }
  - name: "test-two"
    auto_generated_guid: 22223333-4444-5555-6666-777788889999
    executor: { name: powershell, command: "Write-Output two" }
'@

    # Helper: create a synthetic atomic directory under TACKLEBOX_HOME/atomics
    function New-TestAtomic {
        param([string]$Id, [string]$Yaml)
        $dir = Join-Path $script:TempHome "atomics/$Id"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $dir "$Id.yaml") -Value $Yaml
        # Point module at our temp atomics root via module variable override
    }

    # Wire the module's atomics root to the temp dir so Get-Tackle / Invoke-Tacklebox
    # find our synthetic atomics.
    & (Get-Module Tacklebox) {
        $script:TackleboxModuleRoot = $env:TACKLEBOX_HOME
    }
    Copy-Item -Path (Join-Path $script:RepoRoot 'schema') -Destination $script:TempHome -Recurse -Force
}

AfterAll {
    Remove-Module Tacklebox -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $script:TempHome) {
        Remove-Item -LiteralPath $script:TempHome -Recurse -Force
    }
    $env:TACKLEBOX_HOME         = $null
    $env:TACKLEBOX_LAB_OVERRIDE = $null
}

Describe 'Invoke-Tacklebox – DryRun mode' -Tag 'InvokeTacklebox', 'DryRun' {

    BeforeAll {
        New-TestAtomic -Id 'T1078.004-unit-dryr' -Yaml $script:MinimalYaml
    }

    It 'returns a result object with Mode=DryRun and Status=dry-run' {
        $r = Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun -InputArgs @{ required_arg = 'foo' }
        $r.Mode   | Should -Be 'DryRun'
        $r.Status | Should -Be 'dry-run'
    }

    It 'populates RunId as a GUID' {
        $r = Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun -InputArgs @{ required_arg = 'x' }
        $r.RunId | Should -Match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    }

    It 'respects caller-supplied RunId' {
        $id = [guid]::NewGuid().ToString()
        $r = Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun -RunId $id -InputArgs @{ required_arg = 'x' }
        $r.RunId | Should -Be $id
    }

    It 'applies YAML default for input_arguments' {
        $r = Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun -InputArgs @{ required_arg = 'x' }
        $r.InputArgs['target'] | Should -Be 'default-target'
    }

    It 'caller InputArgs override YAML defaults' {
        $r = Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun -InputArgs @{ target = 'custom'; required_arg = 'x' }
        $r.InputArgs['target'] | Should -Be 'custom'
    }

    It 'substitutes #{var} in Command' {
        $r = Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun -InputArgs @{ target = 'hello'; required_arg = 'x' }
        $r.Command | Should -Match 'hello'
        $r.Command | Should -Not -Match '#\{target\}'
    }

    It 'throws when required input argument is missing' {
        { Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun } | Should -Throw -ExpectedMessage '*required_arg*'
    }

    It 'writes an info event to the run log' {
        $r = Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun -InputArgs @{ required_arg = 'x' }
        $logEvents = & (Get-Module Tacklebox) { param($id) Get-RunLog -RunId $id } $r.RunId
        ($logEvents | Where-Object { $_.kind -eq 'info' }).Count | Should -BeGreaterThan 0
    }

    It 'does NOT call Test-TackleboxLab' {
        # DryRun should never touch lab enforcement. We verify indirectly:
        # clear the override, if DryRun calls the guard it would throw.
        $savedOverride = $env:TACKLEBOX_LAB_OVERRIDE
        $env:TACKLEBOX_LAB_OVERRIDE = $null
        try {
            # No config → guard would refuse if called. DryRun should not call it.
            { Invoke-Tacklebox -Atomic 'T1078.004-unit-dryr' -DryRun -InputArgs @{ required_arg = 'x' } } |
                Should -Not -Throw
        } finally {
            $env:TACKLEBOX_LAB_OVERRIDE = $savedOverride
        }
    }
}

Describe 'Invoke-Tacklebox – atomic resolution' -Tag 'InvokeTacklebox', 'Resolution' {

    BeforeAll {
        New-TestAtomic -Id 'T9001-resolution-test' -Yaml $script:MinimalYaml
    }

    It 'throws when atomic id is not found' {
        { Invoke-Tacklebox -Atomic 'does-not-exist' -DryRun -InputArgs @{ required_arg = 'x' } } |
            Should -Throw -ExpectedMessage '*not found*'
    }

    It 'resolves by exact id' {
        $r = Invoke-Tacklebox -Atomic 'T9001-resolution-test' -DryRun -InputArgs @{ required_arg = 'x' }
        $r.AtomicId | Should -Be 'T9001-resolution-test'
    }

    It 'throws when TestName is not found in the atomic' {
        { Invoke-Tacklebox -Atomic 'T9001-resolution-test' -DryRun `
              -TestName 'nonexistent' -InputArgs @{ required_arg = 'x' } } |
            Should -Throw -ExpectedMessage '*nonexistent*'
    }
}

Describe 'Invoke-Tacklebox – multi-test atomic' -Tag 'InvokeTacklebox', 'MultiTest' {

    BeforeAll {
        New-TestAtomic -Id 'T9002-multi-test' -Yaml $script:MultiTestYaml
    }

    It 'throws when TestName is omitted and multiple tests exist' {
        { Invoke-Tacklebox -Atomic 'T9002-multi-test' -DryRun } |
            Should -Throw -ExpectedMessage '*TestName*'
    }

    It 'selects correct test by -TestName' {
        $r = Invoke-Tacklebox -Atomic 'T9002-multi-test' -DryRun -TestName 'test-two'
        $r.TestName | Should -Be 'test-two'
    }
}

Describe 'Invoke-Tacklebox – tenant_id auto-wire' -Tag 'InvokeTacklebox', 'TenantAutowire' {

    BeforeAll {
        $script:TenantWireYaml = @'
attack_technique: T1078.004
display_name: "Tenant Wire Test"
atomic_tests:
  - name: "tenant-wire-test"
    auto_generated_guid: ccccdddd-eeee-ffff-0000-111122223333
    description: "Test tenant_id auto-wiring"
    supported_platforms: [windows, linux, macos]
    input_arguments:
      tenant_id:
        description: "Lab tenant GUID"
        type: String
        default: "00000000-0000-0000-0000-000000000000"
    executor:
      name: powershell
      command: "Write-Output '#{tenant_id}'"
    requires_token: false
'@
        New-TestAtomic -Id 'T9010-tenant-wire' -Yaml $script:TenantWireYaml

        $script:TenantWireConfigPath = Join-Path $script:TempHome 'config.json'
        @{ tenant_id = 'aabbccdd-1234-5678-abcd-ef0123456789'; tenant_name = 'tacklebox-lab.onmicrosoft.com'; lab_allow_list = @('aabbccdd-1234-5678-abcd-ef0123456789') } |
            ConvertTo-Json | Set-Content -LiteralPath $script:TenantWireConfigPath
    }

    AfterAll {
        Remove-Item -LiteralPath $script:TenantWireConfigPath -Force -ErrorAction SilentlyContinue
    }

    It 'replaces empty-GUID sentinel with config tenant_id in DryRun output' {
        $r = Invoke-Tacklebox -Atomic 'T9010-tenant-wire' -DryRun
        $r.InputArgs['tenant_id'] | Should -Be 'aabbccdd-1234-5678-abcd-ef0123456789'
    }

    It 'does not replace tenant_id when caller supplies an explicit value' {
        $r = Invoke-Tacklebox -Atomic 'T9010-tenant-wire' -DryRun -InputArgs @{ tenant_id = 'custom-guid-value' }
        $r.InputArgs['tenant_id'] | Should -Be 'custom-guid-value'
    }
}

Describe 'Invoke-Tacklebox – lab-guard enforcement' -Tag 'InvokeTacklebox', 'LabGuard' {

    BeforeAll {
        New-TestAtomic -Id 'T9003-labguard-test' -Yaml $script:MinimalYaml
        # Write a non-lab config so the guard fails naturally.
        @{ tenant_name = 'contoso.onmicrosoft.com' } | ConvertTo-Json |
            Set-Content -LiteralPath (Join-Path $script:TempHome 'config.json')
    }

    AfterAll {
        Remove-Item -LiteralPath (Join-Path $script:TempHome 'config.json') -Force -ErrorAction SilentlyContinue
    }

    It 'refuses Cast when tenant is not a lab and no override is set' {
        $savedOverride = $env:TACKLEBOX_LAB_OVERRIDE
        $env:TACKLEBOX_LAB_OVERRIDE = $null
        try {
            { Invoke-Tacklebox -Atomic 'T9003-labguard-test' -Cast -InputArgs @{ required_arg = 'x' } } |
                Should -Throw
        } finally {
            $env:TACKLEBOX_LAB_OVERRIDE = $savedOverride
        }
    }

    It 'refuses Cast when override is set but -ConfirmOverride not passed' {
        $env:TACKLEBOX_LAB_OVERRIDE = '1'
        try {
            { Invoke-Tacklebox -Atomic 'T9003-labguard-test' -Cast -InputArgs @{ required_arg = 'x' } } |
                Should -Throw -ExpectedMessage '*ConfirmOverride*'
        } finally {
            $env:TACKLEBOX_LAB_OVERRIDE = '1'   # restore for subsequent tests
        }
    }
}
