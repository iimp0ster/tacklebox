function Write-TokenCache {
    <#
    .SYNOPSIS
        Writes a token cache entry in roadtools .roadtools_auth format.

    .DESCRIPTION
        The cache key is sanitized to filesystem-safe characters and stored
        at ~/.tacklebox/tokens/{key}.json. The on-disk format matches
        roadtools so existing consumers (TeamFiltration, AzureHound,
        GraphRunner) can read our output without modification.

        Required fields in $TokenData:
          accessToken, tokenType, expiresOn

        Recommended fields:
          refreshToken, idToken, tenantId, _clientId, resource

        Any extra fields are preserved verbatim.

    .PARAMETER Key
        Cache key, typically "{tenant}_{upn}_{client}".

    .PARAMETER TokenData
        Hashtable with the token payload.

    .PARAMETER PassThru
        Return the absolute path of the written cache file.
    #>
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]$Key,

        [Parameter(Mandatory)]
        [ValidateNotNull()]
        [hashtable]$TokenData,

        [switch]$PassThru
    )

    foreach ($required in 'accessToken', 'tokenType', 'expiresOn') {
        if (-not $TokenData.ContainsKey($required)) {
            throw "Token cache write rejected: missing required field '$required'."
        }
    }

    $sanitized = $Key -replace '[^A-Za-z0-9._@-]', '_'
    $dir = Join-Path -Path $script:TackleboxConfigRoot -ChildPath 'tokens'
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $path = Join-Path -Path $dir -ChildPath "$sanitized.json"

    if ($PSCmdlet.ShouldProcess($path, 'Write token cache')) {
        $json = $TokenData | ConvertTo-Json -Depth 8
        # Permissions: best-effort 0600 on POSIX; PowerShell's file ACL
        # handling on Windows is left to the OS default. Tokens in
        # ~/.tacklebox are already user-scoped via $HOME.
        Set-Content -LiteralPath $path -Value $json -NoNewline -ErrorAction Stop
        if ($IsLinux -or $IsMacOS) {
            try { & chmod 600 $path } catch { Write-Verbose "chmod 600 failed on $path : $_" }
        }
    }

    if ($PassThru) { return $path }
}

function Remove-TackleboxTokenCache {
    <#
    .SYNOPSIS
        Deletes a cached token entry. Used by atomic cleanup_command blocks.
    #>
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [string]$Key
    )

    $sanitized = $Key -replace '[^A-Za-z0-9._@-]', '_'
    $path = Join-Path -Path $script:TackleboxConfigRoot -ChildPath "tokens/$sanitized.json"

    if (Test-Path -LiteralPath $path) {
        if ($PSCmdlet.ShouldProcess($path, 'Delete token cache')) {
            Remove-Item -LiteralPath $path -Force
        }
    }
}
