function Invoke-TackleboxRig {
    <#
    .SYNOPSIS
        Run a chained kit-profile rig against the lab tenant.

    .DESCRIPTION
        Loads a rig YAML from rigs/<Rig>.yaml, creates a shared RunId, and
        invokes each step's atomic in sequence via Invoke-Tacklebox, threading
        token-cache state between steps that declare requires_token_from.

        All steps share the same RunId so their events appear as a single run
        in the log. Step results are collected and returned as a structured
        summary.

    .PARAMETER Rig
        Rig id (filename under rigs/ without .yaml extension, e.g. "tycoon").

    .PARAMETER DryRun
        Show planned invocations for all steps without executing.

    .PARAMETER Cast
        Execute all steps. Requires lab-tenant confirmation.

    .PARAMETER Validate
        Execute all steps and validate telemetry for each. Requires
        lab-tenant confirmation.

    .PARAMETER StopOnError
        Stop executing subsequent steps if any step fails. Overrides the rig
        YAML's stop_on_error field when supplied explicitly.

    .PARAMETER RunId
        Optional GUID to use as the shared run identifier. Auto-generated if
        omitted.

    .PARAMETER ConfirmOverride
        Required when TACKLEBOX_LAB_OVERRIDE=1 and the tenant is not a lab.
    #>
    [CmdletBinding(DefaultParameterSetName = 'DryRun')]
    param(
        [Parameter(Mandatory)]
        [string]$Rig,

        [Parameter(ParameterSetName = 'DryRun')]
        [switch]$DryRun,

        [Parameter(ParameterSetName = 'Cast')]
        [switch]$Cast,

        [Parameter(ParameterSetName = 'Validate')]
        [switch]$Validate,

        [switch]$StopOnError,

        [string]$RunId,

        [switch]$ConfirmOverride
    )

    $mode = $PSCmdlet.ParameterSetName

    # ── 1. Resolve rig YAML ───────────────────────────────────────────────────

    $rigsRoot = Join-Path -Path $script:TackleboxModuleRoot -ChildPath 'rigs'
    $rigPath  = Join-Path -Path $rigsRoot -ChildPath "$Rig.yaml"

    if (-not (Test-Path -LiteralPath $rigPath)) {
        # Try case-insensitive partial match
        $candidates = @(Get-ChildItem -LiteralPath $rigsRoot -Filter '*.yaml' -File -ErrorAction SilentlyContinue |
            Where-Object { $_.BaseName -like "*$Rig*" })

        if ($candidates.Count -eq 0) {
            throw "Rig '$Rig' not found at '$rigPath'. Run Get-TackleboxRig to list available rigs."
        }
        if ($candidates.Count -gt 1) {
            $names = ($candidates | ForEach-Object { $_.BaseName }) -join ', '
            throw "Ambiguous rig id '$Rig' matches: $names. Provide a more specific id."
        }
        $rigPath = $candidates[0].FullName
    }

    # ── 2. Parse + validate rig YAML ─────────────────────────────────────────

    $rigData = Read-AtomicYaml -Path $rigPath

    $schemaPath = Join-Path -Path $script:TackleboxModuleRoot -ChildPath 'schema/tacklebox-rig.schema.json'
    $rigJson    = $rigData | ConvertTo-Json -Depth 16 -Compress
    $schemaErrors = @()
    $rigValid  = $true
    try {
        $null = Test-Json -Json $rigJson -SchemaFile $schemaPath -ErrorAction Stop
    } catch {
        $rigValid = $false
        $schemaErrors += $_.Exception.Message
    }
    if (-not $rigValid) {
        throw "Rig '$Rig' fails schema validation: $($schemaErrors -join '; ')"
    }

    $rigId   = $rigData.rig
    $steps   = @($rigData.steps)
    $stopOnErrorEffective = if ($StopOnError.IsPresent) {
        $StopOnError.ToBool()
    } elseif ($rigData.ContainsKey('stop_on_error')) {
        [bool]$rigData.stop_on_error
    } else {
        $true
    }

    # ── 3. Generate shared RunId ──────────────────────────────────────────────

    if (-not $RunId) { $RunId = [guid]::NewGuid().ToString() }

    Write-Host "`nRig: $rigId  ($mode)  RunId: $RunId" -ForegroundColor Cyan
    if ($rigData.ContainsKey('ua_profile'))     { Write-Host "  UA profile  : $($rigData.ua_profile)" }
    if ($rigData.ContainsKey('egress_profile')) { Write-Host "  Egress      : $($rigData.egress_profile)" }
    Write-Host "  Steps       : $($steps.Count)"

    # ── 4. Plumb UA profile into environment if applicable ───────────────────

    $uaString = $null
    if ($rigData.ContainsKey('ua_profile') -and $rigData.ua_profile) {
        $uaString = Resolve-UaProfile -Name $rigData.ua_profile
    }

    # ── 5. Step execution loop ───────────────────────────────────────────────

    $stepResults      = [System.Collections.Generic.List[object]]::new()
    $tokenKeysByAtomic = @{}   # maps "atomic-id" → resolved TokenCacheKey from that step's result

    Write-RunLog -RunId $RunId -Kind 'info' -Data @{
        rig        = $rigId
        mode       = $mode
        ua_profile = $rigData.ua_profile
        egress     = $rigData.egress_profile
        step_count = $steps.Count
    }

    for ($i = 0; $i -lt $steps.Count; $i++) {
        $step      = $steps[$i]
        $stepNum   = $i + 1
        $atomicRef = $step.atomic
        $stepArgs  = if ($step.ContainsKey('args') -and $step.args) {
            # Convert from ordered dict to hashtable
            $ht = @{}
            foreach ($k in $step.args.Keys) { $ht[$k] = [string]$step.args[$k] }
            $ht
        } else { @{} }

        # Inject UA into args if the atomic uses #{user_agent}
        if ($uaString -and -not $stepArgs.ContainsKey('user_agent')) {
            $stepArgs['user_agent'] = $uaString
        }

        # Resolve token from a previous step if declared
        $stepTokenKey = $null
        if ($step.ContainsKey('requires_token_from') -and $step.requires_token_from) {
            $srcAtomic = $step.requires_token_from
            if ($tokenKeysByAtomic.ContainsKey($srcAtomic)) {
                $stepTokenKey = $tokenKeysByAtomic[$srcAtomic]
            } else {
                Write-Warning "Step $stepNum ($atomicRef): requires_token_from '$srcAtomic' but no token key was recorded from that step. Proceeding without pre-resolved token."
            }
        }

        Write-Host "`n  [Step $stepNum/$($steps.Count)] $atomicRef" -ForegroundColor Yellow
        if ($step.ContainsKey('test_name')) { Write-Host "    Test: $($step.test_name)" }

        $invokeParams = @{
            Atomic  = $atomicRef
            RunId   = $RunId
            InputArgs = $stepArgs
        }
        if ($step.ContainsKey('test_name') -and $step.test_name) {
            $invokeParams['TestName'] = $step.test_name
        }
        if ($stepTokenKey)   { $invokeParams['TokenCacheKey']  = $stepTokenKey }
        if ($ConfirmOverride) { $invokeParams['ConfirmOverride'] = $true }

        switch ($mode) {
            'DryRun'   { $invokeParams['DryRun']   = $true }
            'Cast'     { $invokeParams['Cast']     = $true }
            'Validate' { $invokeParams['Validate'] = $true }
        }

        $stepResult = $null
        $stepError  = $null

        try {
            $stepResult = Invoke-Tacklebox @invokeParams
        } catch {
            $stepError  = $_.Exception.Message
            Write-Warning "Step $stepNum ($atomicRef) threw: $stepError"
        }

        # Record the token key this step produced so later steps can reference it
        if ($stepResult -and $stepResult.TokenCacheKey) {
            $tokenKeysByAtomic[$atomicRef] = $stepResult.TokenCacheKey
        }

        $stepSummary = [pscustomobject]@{
            StepNumber   = $stepNum
            AtomicId     = $atomicRef
            TestName     = $stepResult?.TestName
            Status       = if ($stepError) { 'error' } else { $stepResult?.Status }
            Error        = $stepError
            TokenCacheKey = $stepResult?.TokenCacheKey
            TelemetryResults = $stepResult?.TelemetryResults
        }
        $stepResults.Add($stepSummary)

        if ($stepError -and $stopOnErrorEffective) {
            Write-Warning "Rig '$rigId' stopped at step $stepNum due to error (stop_on_error=true)."
            break
        }
    }

    # ── 6. Aggregate and return ───────────────────────────────────────────────

    $succeeded = @($stepResults | Where-Object { $_.Status -in 'cast-complete', 'validated', 'dry-run' }).Count
    $failed    = @($stepResults | Where-Object { $_.Status -in 'failed', 'error' }).Count
    $overallStatus = if ($failed -gt 0) { 'partial' } else { 'complete' }

    Write-Host "`nRig '$rigId' ${overallStatus}: $succeeded/$($stepResults.Count) steps succeeded." -ForegroundColor (
        if ($failed -eq 0) { 'Green' } else { 'Yellow' }
    )

    return [pscustomobject]@{
        RigId       = $rigId
        Mode        = $mode
        RunId       = $RunId
        Status      = $overallStatus
        StepResults = $stepResults.ToArray()
    }
}
