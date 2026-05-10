function Read-TackleboxConfig {
    <#
    .SYNOPSIS
        Loads ~/.tacklebox/config.json (or $env:TACKLEBOX_HOME/config.json).

    .DESCRIPTION
        Returns a hashtable with the parsed config, or $null if the file does
        not exist. Missing config is not an error — the lab guard treats
        "no config" as "no lab confirmation", and downstream cmdlets refuse
        to run accordingly.

        The config schema:

            {
              "tenant_id":         "<guid>",
              "tenant_name":       "<vanity-domain>",
              "lab_allow_list":    ["<guid>", ...],
              "lab_pattern_regex": "<regex>",
              "egress_proxy":      { "url": "...", "username": "...", "password_env": "..." },
              "ci_lab_counterparty": { "upn": "...", "thread_subject": "..." }
            }
    #>
    [CmdletBinding()]
    param(
        [string]$Path
    )

    if (-not $Path) {
        $Path = Join-Path -Path $script:TackleboxConfigRoot -ChildPath 'config.json'
    }

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    try {
        $raw = Get-Content -LiteralPath $Path -Raw -ErrorAction Stop
        return $raw | ConvertFrom-Json -AsHashtable -ErrorAction Stop
    } catch {
        throw "Tacklebox config at '$Path' is not valid JSON: $($_.Exception.Message)"
    }
}
