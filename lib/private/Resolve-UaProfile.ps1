$script:TackleboxUaProfiles = @{
    # AiTM kit-matched UA strings used by real phishing infrastructure.
    'tycoon-chrome-win'     = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    'tycoon-edge-win'       = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    'mamba-firefox-win'     = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    'evilproxy-safari-mac'  = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    'evilproxy-chrome-mac'  = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

    # Anomalous / suspicious strings used in detection validation.
    'python-requests'       = 'python-requests/2.31.0'
    'curl'                  = 'curl/8.4.0'
    'axios'                 = 'axios/1.6.2'
    'go-http'               = 'Go-http-client/2.0'

    # Legitimate client UA strings for baseline comparison.
    'outlook-win'           = 'Microsoft Outlook 16.0.17231.20236'
    'teams-win'             = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.6.00.30174 Chrome/116.0.5845.228 Electron/26.6.1 Safari/537.36'
    'office365-connector'   = 'Office365Connector/1.0'
}

function Resolve-UaProfile {
    <#
    .SYNOPSIS
        Resolve a UA profile name to a concrete User-Agent string.

    .DESCRIPTION
        Returns the UA string for a named profile, or $null if the profile
        is not found. Profile names are defined in $script:TackleboxUaProfiles.
        Pass the result as --user-agent to roadtx or inject via HTTP client
        configuration in other upstream tools.

    .PARAMETER Name
        Profile name (e.g., 'tycoon-chrome-win', 'python-requests').

    .OUTPUTS
        [string] UA string, or $null when not found.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    if ($script:TackleboxUaProfiles.ContainsKey($Name)) {
        return $script:TackleboxUaProfiles[$Name]
    }

    Write-Warning "UA profile '$Name' not found. Available profiles: $($script:TackleboxUaProfiles.Keys -join ', ')"
    return $null
}

function Get-TackleboxUaProfiles {
    <#
    .SYNOPSIS
        List all available UA profile names and their strings.
    #>
    [CmdletBinding()]
    param()
    $script:TackleboxUaProfiles.GetEnumerator() | Sort-Object Name | ForEach-Object {
        [pscustomobject]@{
            Name      = $_.Key
            UserAgent = $_.Value
        }
    }
}
