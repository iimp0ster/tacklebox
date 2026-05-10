function Test-TackleboxLab {
    <#
    .SYNOPSIS
        Confirms the configured Entra tenant is a labeled lab tenant.

    .DESCRIPTION
        Lab-tenant enforcement is a load-bearing safety control. This cmdlet
        is the canonical check; it is invoked at module load (warning only)
        and at the top of every Cast/Validate run (hard refusal unless
        TACKLEBOX_LAB_OVERRIDE=1 is set AND -ConfirmOverride is passed).

        Three signals can mark a tenant as "lab":

          1. tenant_id is in config.lab_allow_list
          2. tenant_name matches config.lab_pattern_regex (or the default
             pattern: (?i)(lab|test|tacklebox-))
          3. tenant_id matches the -Tenant parameter override AND that GUID
             appears in lab_allow_list

        The override (TACKLEBOX_LAB_OVERRIDE=1) does NOT make a tenant a lab
        tenant. It tells the guard to warn rather than refuse. Any -Cast or
        -Validate run still requires the operator to pass -ConfirmOverride
        to actually proceed.

    .PARAMETER Tenant
        Explicit tenant id or vanity domain to test. Defaults to whatever is
        in the config.

    .PARAMETER PassThru
        Return a result object instead of throwing on failure. Used by the
        module-load guard to emit a warning without aborting load.

    .OUTPUTS
        [PSCustomObject] with IsLab, OverrideActive, MatchReason,
        Tenant, WarningMessage.
    #>
    [CmdletBinding()]
    param(
        [string]$Tenant,
        [switch]$PassThru
    )

    $defaultPattern = '(?i)(lab|test|tacklebox-)'
    $config = Read-TackleboxConfig
    $overrideActive = ($env:TACKLEBOX_LAB_OVERRIDE -eq '1')

    $tenantId   = $Tenant
    $tenantName = $null
    if (-not $tenantId -and $config) {
        $tenantId   = $config['tenant_id']
        $tenantName = $config['tenant_name']
    }

    $allowList = @()
    $pattern   = $defaultPattern
    if ($config) {
        if ($config.ContainsKey('lab_allow_list')) {
            $allowList = @($config['lab_allow_list'])
        }
        if ($config.ContainsKey('lab_pattern_regex') -and $config['lab_pattern_regex']) {
            $pattern = $config['lab_pattern_regex']
        }
    }

    $isLab = $false
    $reason = 'no-config'

    if ($tenantId -and ($allowList -contains $tenantId)) {
        $isLab = $true
        $reason = 'allow-list'
    } elseif ($tenantName -and ($tenantName -match $pattern)) {
        $isLab = $true
        $reason = 'name-pattern'
    } elseif ($tenantId -and ($tenantId -match $pattern)) {
        $isLab = $true
        $reason = 'id-pattern'
    } elseif (-not $tenantId -and -not $tenantName) {
        $reason = 'no-tenant-configured'
    } else {
        $reason = 'no-match'
    }

    $warningMessage = if ($isLab) {
        $null
    } else {
        @"
Tacklebox: tenant '$($tenantId ?? $tenantName ?? '<none>')' is NOT a labeled lab tenant.
Reason: $reason. Lab-tenant enforcement is a load-bearing safety control.

To proceed:
  - Add tenant_id to lab_allow_list in $script:TackleboxConfigRoot/config.json, OR
  - Rename the tenant vanity domain to match $pattern, OR
  - Set TACKLEBOX_LAB_OVERRIDE=1 AND pass -ConfirmOverride on Cast/Validate
    runs (logs a prominent warning each time).

Read-only cmdlets (Get-Tackle, Get-TackleboxRig) work without a lab tenant.
"@
    }

    $result = [pscustomobject]@{
        IsLab           = $isLab
        OverrideActive  = $overrideActive
        MatchReason     = $reason
        Tenant          = $tenantId ?? $tenantName
        Pattern         = $pattern
        AllowListSize   = $allowList.Count
        WarningMessage  = $warningMessage
    }

    if ($PassThru) {
        return $result
    }

    if ($isLab) {
        Write-Host "Tacklebox: tenant '$($result.Tenant)' confirmed as lab ($reason)." -ForegroundColor Green
        return $result
    }

    if ($overrideActive) {
        Write-Warning $warningMessage
        return $result
    }

    throw $warningMessage
}
