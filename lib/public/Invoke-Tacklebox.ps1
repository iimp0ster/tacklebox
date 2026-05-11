function Invoke-Tacklebox {
    <#
    .SYNOPSIS
        Run a single Tacklebox atomic against the lab tenant.

    .DESCRIPTION
        Canonical single-atomic runner with three execution modes:

          -DryRun   Show the planned command and telemetry expectations.
                    No network calls; no token-cache side effects.
          -Cast     Execute the atomic against the lab tenant; write run log.
          -Validate Cast, then confirm declared expected_telemetry events
                    appear in Entra/UAL within the per-source latency budget.

        Lab-tenant enforcement (Test-TackleboxLab) is mandatory for Cast and
        Validate. DryRun skips it entirely.

    .PARAMETER Atomic
        Atomic id (folder name under atomics/, e.g. "T1078.004-device-code").
        Accepts a partial match when unambiguous.

    .PARAMETER TestName
        Name of a specific test within the atomic. Required when the atomic
        defines more than one test.

    .PARAMETER InputArgs
        Hashtable of input argument values. Merged with YAML defaults; caller
        values take precedence. Use #{var} keys as defined in input_arguments.

    .PARAMETER DryRun
        (Default) Show planned invocation without executing anything.

    .PARAMETER Cast
        Execute the atomic. Requires lab-tenant confirmation.

    .PARAMETER Validate
        Execute the atomic, then poll for expected telemetry. Requires
        lab-tenant confirmation.

    .PARAMETER TokenCacheKey
        Override the auto-resolved token cache key. Useful when reusing a
        token from a previous run or rig step.

    .PARAMETER RunId
        Optional GUID to use as the run identifier. Auto-generated if omitted.
        Rig invocations supply this so all steps share a log.

    .PARAMETER ConfirmOverride
        Required when TACKLEBOX_LAB_OVERRIDE=1 is set and the configured
        tenant is not a labeled lab. Acknowledges the safety warning.
    #>
    [CmdletBinding(DefaultParameterSetName = 'DryRun')]
    param(
        [Parameter(Mandatory)]
        [string]$Atomic,

        [string]$TestName,

        [hashtable]$InputArgs = @{},

        [Parameter(ParameterSetName = 'DryRun')]
        [switch]$DryRun,

        [Parameter(ParameterSetName = 'Cast')]
        [switch]$Cast,

        [Parameter(ParameterSetName = 'Validate')]
        [switch]$Validate,

        [string]$TokenCacheKey,

        [string]$RunId,

        [switch]$ConfirmOverride
    )

    $mode = $PSCmdlet.ParameterSetName

    # ── 1. Resolve atomic YAML path ──────────────────────────────────────────

    $atomicsRoot = Join-Path -Path $script:TackleboxModuleRoot -ChildPath 'atomics'
    if (-not (Test-Path -LiteralPath $atomicsRoot)) {
        throw "Atomics directory not found at '$atomicsRoot'. No atomics have been authored yet."
    }

    $directPath = Join-Path -Path $atomicsRoot -ChildPath "$Atomic/$Atomic.yaml"
    $yamlPath   = $null

    if (Test-Path -LiteralPath $directPath) {
        $yamlPath = $directPath
    } else {
        $candidates = @(
            Get-ChildItem -LiteralPath $atomicsRoot -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "*$Atomic*" } |
            ForEach-Object {
                $p = Join-Path -Path $_.FullName -ChildPath "$($_.Name).yaml"
                if (Test-Path -LiteralPath $p) { $p }
            }
        )

        if ($candidates.Count -eq 0) {
            throw "Atomic '$Atomic' not found under '$atomicsRoot'. Run Get-Tackle to list available atomics."
        }
        if ($candidates.Count -gt 1) {
            $names = ($candidates | ForEach-Object { Split-Path -Leaf (Split-Path -Parent $_) }) -join ', '
            throw "Ambiguous atomic id '$Atomic' matches: $names. Provide a more specific id."
        }
        $yamlPath = $candidates[0]
    }

    $atomicId = Split-Path -Leaf (Split-Path -Parent $yamlPath)

    # ── 2. Parse + validate ───────────────────────────────────────────────────

    $parsed = Read-AtomicYaml -Path $yamlPath

    $schemaResult = Test-AtomicSchema -Atomic $parsed
    if (-not $schemaResult.IsValid) {
        $errs = $schemaResult.Errors -join '; '
        throw "Atomic '$atomicId' fails schema validation: $errs"
    }

    # ── 3. Select test ────────────────────────────────────────────────────────

    $tests = @($parsed.atomic_tests)

    $selectedTest = if ($TestName) {
        $t = $tests | Where-Object { $_.name -eq $TestName }
        if (-not $t) {
            $available = ($tests | ForEach-Object { $_.name }) -join ', '
            throw "Test '$TestName' not found in atomic '$atomicId'. Available: $available"
        }
        $t
    } elseif ($tests.Count -eq 1) {
        $tests[0]
    } else {
        $names = ($tests | ForEach-Object { $_.name }) -join ', '
        throw "Atomic '$atomicId' has $($tests.Count) tests; specify -TestName. Available: $names"
    }

    # ── 4. Resolve input arguments (defaults ← YAML, overridden by caller) ───

    $resolvedArgs = @{}
    if ($selectedTest.ContainsKey('input_arguments') -and $selectedTest.input_arguments) {
        foreach ($key in $selectedTest.input_arguments.Keys) {
            $argDef = $selectedTest.input_arguments[$key]
            if ($argDef.ContainsKey('default') -and $null -ne $argDef['default']) {
                $resolvedArgs[$key] = [string]$argDef['default']
            }
        }
    }
    foreach ($key in ($InputArgs ?? @{}).Keys) {
        $resolvedArgs[$key] = [string]$InputArgs[$key]
    }

    if ($selectedTest.ContainsKey('input_arguments') -and $selectedTest.input_arguments) {
        $missing = @(
            $selectedTest.input_arguments.Keys |
            Where-Object {
                $def = $selectedTest.input_arguments[$_]
                -not $def.ContainsKey('default') -and -not $resolvedArgs.ContainsKey($_)
            }
        )
        if ($missing.Count -gt 0) {
            throw "Atomic '$atomicId' test '$($selectedTest.name)' requires: $($missing -join ', '). Pass via -InputArgs @{ ... }."
        }
    }

    # ── 5. Lab-tenant guard (Cast/Validate only) ──────────────────────────────

    if ($mode -in 'Cast', 'Validate') {
        $labResult = Test-TackleboxLab -PassThru

        if (-not $labResult.IsLab) {
            if ($labResult.OverrideActive) {
                if (-not $ConfirmOverride) {
                    throw "TACKLEBOX_LAB_OVERRIDE is active but -ConfirmOverride was not passed.`n$($labResult.WarningMessage)"
                }
                Write-Warning "TACKLEBOX_LAB_OVERRIDE active: running $mode against non-lab tenant '$($labResult.Tenant)'."
            } else {
                throw $labResult.WarningMessage
            }
        }
    }

    # ── 6. Generate RunId ─────────────────────────────────────────────────────

    if (-not $RunId) { $RunId = [guid]::NewGuid().ToString() }

    # ── 7. Token state resolution ─────────────────────────────────────────────

    $requiresToken  = $selectedTest.ContainsKey('requires_token') ? $selectedTest.requires_token : $false
    $resolvedKey    = $null
    $tokenCachePath = $null

    if ($requiresToken -and $mode -ne 'DryRun') {
        $config   = Read-TackleboxConfig
        $tenantId = $config?['tenant_id'] ?? 'unknown'

        $resolvedKey = if ($TokenCacheKey) {
            $TokenCacheKey
        } elseif ($requiresToken -is [hashtable] -and $requiresToken.ContainsKey('from')) {
            "${tenantId}_$($requiresToken['from'])"
        } else {
            $authProfile = $selectedTest.ContainsKey('auth_profile') ? $selectedTest.auth_profile : 'default'
            "${tenantId}_${authProfile}"
        }

        $cached = Read-TokenCache -Key $resolvedKey -RequireFresh
        if (-not $cached) {
            Write-Warning "No fresh token in cache for key '$resolvedKey'. The atomic executor may fail. Pre-authenticate with Get-TackleboxToken."
        }

        $sanitized      = $resolvedKey -replace '[^A-Za-z0-9._@-]', '_'
        $tokenCachePath = Join-Path -Path $script:TackleboxConfigRoot -ChildPath "tokens/$sanitized.json"
    }

    # ── 8. Substitute #{vars} into command template ───────────────────────────

    $commandTemplate = $selectedTest.executor.command
    $resolvedCommand = $commandTemplate

    foreach ($key in $resolvedArgs.Keys) {
        $resolvedCommand = $resolvedCommand -replace [regex]::Escape("#{$key}"), $resolvedArgs[$key]
    }

    if ($tokenCachePath) {
        $resolvedCommand = $resolvedCommand -replace [regex]::Escape('#{token_cache_path}'), $tokenCachePath
    }

    # Build the result skeleton returned by all modes.
    $result = [pscustomobject]@{
        Mode             = $mode
        RunId            = $RunId
        AtomicId         = $atomicId
        TestName         = $selectedTest.name
        Technique        = $parsed.attack_technique
        AuthProfile      = $selectedTest.ContainsKey('auth_profile')    ? $selectedTest.auth_profile    : $null
        DefenseEvasion   = $selectedTest.ContainsKey('defense_evasion') ? $selectedTest.defense_evasion : $null
        TokenCacheKey    = $resolvedKey
        InputArgs        = $resolvedArgs
        Command          = $resolvedCommand
        Status           = 'pending'
        Duration         = $null
        Error            = $null
        TelemetryResults = $null
    }

    # ── 9. DryRun: emit plan, no side effects ────────────────────────────────

    if ($mode -eq 'DryRun') {
        Write-RunLog -RunId $RunId -Kind 'info' -Atomic $atomicId -Data @{
            mode    = 'DryRun'
            test    = $selectedTest.name
            auth    = $result.AuthProfile
            command = $resolvedCommand
            args    = $resolvedArgs
        }

        $result.Status = 'dry-run'

        Write-Host "`nDRY RUN: $atomicId" -ForegroundColor Cyan
        Write-Host "  Test     : $($selectedTest.name)"
        Write-Host "  Technique: $($parsed.attack_technique)"
        Write-Host "  Auth     : $($result.AuthProfile ?? '(none)')"
        Write-Host "  Evasion  : $($result.DefenseEvasion ?? '(none)')"
        Write-Host "  Executor : $($selectedTest.executor.name)"
        Write-Host "  Command  :"
        ($resolvedCommand.Trim() -split "`n") | ForEach-Object { Write-Host "    $_" }
        if ($selectedTest.ContainsKey('expected_telemetry') -and $selectedTest.expected_telemetry) {
            Write-Host "  Expected telemetry:"
            foreach ($exp in $selectedTest.expected_telemetry) {
                $budget = $exp.ContainsKey('within_minutes') ? $exp.within_minutes : '?'
                Write-Host "    [$($exp.source)] within ${budget} min  match: $($exp.match | ConvertTo-Json -Compress)"
            }
        }
        if ($selectedTest.ContainsKey('exercises_chokepoint') -and $selectedTest.exercises_chokepoint) {
            Write-Host "  Chokepoint: $($selectedTest.exercises_chokepoint.id)"
        }
        Write-Host "  RunId    : $RunId`n"

        return $result
    }

    # ── 10. Cast/Validate: execute ────────────────────────────────────────────

    $castData = @{
        mode               = $mode
        test               = $selectedTest.name
        auth_profile       = $result.AuthProfile
        defense_evasion    = $result.DefenseEvasion
        input_args         = $resolvedArgs
        executor           = $selectedTest.executor.name
        expected_telemetry = $selectedTest.ContainsKey('expected_telemetry') ? $selectedTest.expected_telemetry : @()
        exercises_chokepoint = $selectedTest.ContainsKey('exercises_chokepoint') ? $selectedTest.exercises_chokepoint : $null
    }

    Write-RunLog -RunId $RunId -Kind 'cast-start' -Atomic $atomicId -Data $castData

    $startTime = Get-Date
    $execError = $null
    $execOutput = $null

    try {
        $executorName = $selectedTest.executor.name

        if ($executorName -eq 'powershell') {
            Write-Verbose "Invoking PowerShell executor for '$atomicId'..."
            $execOutput = & pwsh -NonInteractive -NoProfile -Command $resolvedCommand 2>&1
            if ($LASTEXITCODE -ne 0) {
                $execError = "Executor exited with code $LASTEXITCODE. Output: $(($execOutput | Out-String).Trim())"
            }
        } elseif ($executorName -in 'sh', 'bash') {
            if ($IsWindows) {
                throw "Executor '$executorName' is not supported on Windows. Use WSL or a Linux/macOS host."
            }
            $shell = $executorName
            $execOutput = & $shell -c $resolvedCommand 2>&1
            if ($LASTEXITCODE -ne 0) {
                $execError = "Executor exited with code $LASTEXITCODE. Output: $(($execOutput | Out-String).Trim())"
            }
        } else {
            throw "Unknown executor type: '$executorName'. Supported: powershell, sh, bash."
        }

        $result.Status = if ($execError) { 'failed' } else { 'cast-complete' }
    } catch {
        $execError     = $_.Exception.Message
        $result.Status = 'error'
    }

    $result.Duration = (Get-Date) - $startTime
    $result.Error    = $execError

    Write-RunLog -RunId $RunId -Kind 'cast-end' -Atomic $atomicId -Data @{
        status     = $result.Status
        duration_s = [math]::Round($result.Duration.TotalSeconds, 2)
        error      = $execError
        output     = if ($execOutput) { ($execOutput | Out-String).Trim() | Select-Object -First 10 } else { $null }
    }

    if ($execError) {
        Write-Warning "Atomic '$atomicId' execution failed: $execError"
    }

    # ── 11. Validate: poll for telemetry ─────────────────────────────────────

    if ($mode -eq 'Validate') {
        $maxWait = 15
        $expectations = @()
        if ($selectedTest.ContainsKey('expected_telemetry') -and $selectedTest.expected_telemetry) {
            $expectations = @($selectedTest.expected_telemetry)
            $budgets = @($expectations | Where-Object { $_.ContainsKey('within_minutes') } |
                         ForEach-Object { $_.within_minutes })
            if ($budgets.Count -gt 0) {
                $maxWait = ($budgets | Measure-Object -Maximum).Maximum
            }
        }

        if ($expectations.Count -gt 0) {
            $result.TelemetryResults = Search-TackleboxTelemetry -RunId $RunId -WaitMinutes $maxWait

            $misses = @($result.TelemetryResults | Where-Object { -not $_.Matched })
            $result.Status = if ($misses.Count -eq 0) { 'validated' } else { 'partial-validation' }
        } else {
            Write-Verbose "No expected_telemetry defined for '$atomicId'; skipping telemetry validation."
            $result.Status = 'cast-complete'
        }
    }

    return $result
}
