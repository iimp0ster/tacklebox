function Get-TackleboxToken {
    <#
    .SYNOPSIS
        Pre-authenticate for a given auth profile and store the result in
        the Tacklebox token cache.

    .DESCRIPTION
        Provides a user-facing way to bootstrap tokens before running atomics
        that declare requires_token. Uses the same auth-profile-to-upstream-
        tool mapping as Invoke-Tacklebox so token state is fully interoperable.

        Requires the lab-tenant guard to pass or TACKLEBOX_LAB_OVERRIDE=1
        with -ConfirmOverride to prevent accidental production tenant auth.

        Supported auth profiles:
          device-code     roadtx gettokens --device-code
          ropc            roadtx auth (username + password)
          interactive     roadtx interactiveauth (browser pop-up)
          refresh-token   roadtx refreshtokens (from existing cache entry)
          auth-broker     roadtx browserbroker (WAM, Windows only)

    .PARAMETER AuthProfile
        The authentication flow to use. Maps to an upstream tool invocation.

    .PARAMETER TenantId
        Entra tenant ID. Defaults to tenant_id in ~/.tacklebox/config.json.

    .PARAMETER ClientId
        OAuth client ID. Defaults to the Azure CLI app for device-code/ROPC.

    .PARAMETER Resource
        OAuth resource URI. Defaults to Microsoft Graph.

    .PARAMETER Username
        UPN for ROPC flow.

    .PARAMETER Password
        Password for ROPC flow. Accepts SecureString or plain string (lab use).

    .PARAMETER FromCacheKey
        Source cache key for refresh-token flow.

    .PARAMETER CacheKey
        Override the auto-generated cache key. Defaults to
        "{tenantId}_{AuthProfile}".

    .PARAMETER ConfirmOverride
        Required when TACKLEBOX_LAB_OVERRIDE=1 and tenant is not a lab.

    .OUTPUTS
        The path to the written token cache file.
    #>
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [ValidateSet('device-code', 'ropc', 'interactive', 'refresh-token', 'auth-broker')]
        [string]$AuthProfile,

        [string]$TenantId,
        [string]$ClientId    = '04b07795-8ddb-461a-bbee-02f9e1bf7b46',
        [string]$Resource    = 'https://graph.microsoft.com',
        [string]$Username,
        $Password,
        [string]$FromCacheKey,
        [string]$CacheKey,
        [switch]$ConfirmOverride
    )

    # Lab guard — same pattern as Invoke-Tacklebox Cast/Validate
    $labResult = Test-TackleboxLab -PassThru
    if (-not $labResult.IsLab) {
        if ($labResult.OverrideActive) {
            if (-not $ConfirmOverride) {
                throw "TACKLEBOX_LAB_OVERRIDE is active but -ConfirmOverride was not passed.`n$($labResult.WarningMessage)"
            }
            Write-Warning "TACKLEBOX_LAB_OVERRIDE active: authenticating against non-lab tenant '$($labResult.Tenant)'."
        } else {
            throw $labResult.WarningMessage
        }
    }

    $config   = Read-TackleboxConfig
    $tenantId = if ($TenantId) { $TenantId } elseif ($config?['tenant_id']) { $config['tenant_id'] } else {
        throw "TenantId not supplied and not found in config. Pass -TenantId or set tenant_id in ~/.tacklebox/config.json."
    }

    $resolvedKey = if ($CacheKey) {
        $CacheKey
    } else {
        "${tenantId}_${AuthProfile}"
    }

    $sanitized      = $resolvedKey -replace '[^A-Za-z0-9._@-]', '_'
    $tokenOutputPath = Join-Path -Path $script:TackleboxConfigRoot -ChildPath "tokens/$sanitized.json"

    $plainPassword = $null
    if ($Password) {
        $plainPassword = if ($Password -is [securestring]) {
            [System.Net.NetworkCredential]::new('', $Password).Password
        } else {
            [string]$Password
        }
    }

    $cmd = switch ($AuthProfile) {
        'device-code' {
            "roadtx gettokens --device-code --client '$ClientId' --resource '$Resource' --tenant '$tenantId' --tokenfile '$tokenOutputPath'"
        }
        'ropc' {
            if (-not $Username -or -not $plainPassword) {
                throw "AuthProfile 'ropc' requires -Username and -Password."
            }
            "roadtx auth --username '$Username' --password '$plainPassword' --client '$ClientId' --resource '$Resource' --tenant '$tenantId' --tokenfile '$tokenOutputPath'"
        }
        'interactive' {
            "roadtx interactiveauth --client '$ClientId' --resource '$Resource' --tenant '$tenantId' --tokenfile '$tokenOutputPath'"
        }
        'refresh-token' {
            if (-not $FromCacheKey) {
                throw "AuthProfile 'refresh-token' requires -FromCacheKey (source cache key to refresh from)."
            }
            $fromSanitized = $FromCacheKey -replace '[^A-Za-z0-9._@-]', '_'
            $fromPath      = Join-Path -Path $script:TackleboxConfigRoot -ChildPath "tokens/$fromSanitized.json"
            if (-not (Test-Path -LiteralPath $fromPath)) {
                throw "Source token cache '$FromCacheKey' not found at '$fromPath'."
            }
            "roadtx refreshtokens --tokenfile '$fromPath' --tenant '$tenantId' --resource '$Resource' --outfile '$tokenOutputPath'"
        }
        'auth-broker' {
            if (-not $IsWindows) {
                throw "AuthProfile 'auth-broker' is Windows-only (requires WAM/Web Account Manager)."
            }
            "roadtx browserbroker --client '$ClientId' --resource '$Resource' --tenant '$tenantId' --tokenfile '$tokenOutputPath'"
        }
    }

    Write-Host "Authenticating with profile '$AuthProfile' for tenant '$tenantId'..." -ForegroundColor Cyan

    if ($PSCmdlet.ShouldProcess($resolvedKey, "Get-TackleboxToken ($AuthProfile)")) {
        & pwsh -NonInteractive -NoProfile -Command $cmd
        $exitCode = $LASTEXITCODE

        if ($exitCode -ne 0) {
            throw "Authentication failed (exit $exitCode). Re-run with -Verbose or invoke the following command directly for more detail:`n$cmd"
        }

        if (-not (Test-Path -LiteralPath $tokenOutputPath)) {
            throw "roadtx did not write a token file to '$tokenOutputPath'."
        }

        Write-Host "Token cached at key '$resolvedKey'." -ForegroundColor Green
        return $tokenOutputPath
    }
}
