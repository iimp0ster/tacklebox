function Read-TokenCache {
    <#
    .SYNOPSIS
        Reads a token cache entry in roadtools .roadtools_auth format.

    .DESCRIPTION
        Returns a hashtable for the cached token, or $null if no cache exists
        for the given key. Does NOT validate freshness — callers that care
        about expiry should test ExpiresOn themselves or use the
        -RequireFresh switch.

        Cache key is "{tenant}_{upn}_{client}" sanitized to filesystem-safe
        characters, with .json suffix. Roadtools-compatible.

    .PARAMETER Key
        The cache key (one of: tenant_upn_client triple, or a free-form
        string for ad-hoc atomics).

    .PARAMETER RequireFresh
        Return $null if the access token is expired or within the
        -StaleSeconds threshold of expiry.

    .PARAMETER StaleSeconds
        Treat tokens within this many seconds of expiry as stale. Default 60.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]$Key,

        [switch]$RequireFresh,

        [int]$StaleSeconds = 60
    )

    $sanitized = $Key -replace '[^A-Za-z0-9._@-]', '_'
    $path = Join-Path -Path $script:TackleboxConfigRoot -ChildPath "tokens/$sanitized.json"

    if (-not (Test-Path -LiteralPath $path)) {
        return $null
    }

    try {
        $raw = Get-Content -LiteralPath $path -Raw -ErrorAction Stop
        $cache = $raw | ConvertFrom-Json -AsHashtable -ErrorAction Stop
    } catch {
        throw "Token cache at '$path' is corrupt: $($_.Exception.Message)"
    }

    if ($RequireFresh -and $cache.ContainsKey('expiresOn')) {
        $expires = [datetime]$cache['expiresOn']
        $threshold = (Get-Date).ToUniversalTime().AddSeconds($StaleSeconds)
        if ($expires.ToUniversalTime() -lt $threshold) {
            Write-Verbose "Token cache '$Key' is stale (expires $expires)."
            return $null
        }
    }

    return $cache
}
