function Invoke-TackleboxEntraSigninQuery {
    <#
    .SYNOPSIS
        Query Entra ID sign-in logs via Microsoft.Graph for telemetry validation.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [hashtable]$Match,
        [Parameter(Mandatory)] [datetime]$Since
    )

    $graphAvailable = (Get-Module Microsoft.Graph.Reports -ListAvailable -ErrorAction SilentlyContinue) -or
                      (Get-Module Microsoft.Graph -ListAvailable -ErrorAction SilentlyContinue)
    if (-not $graphAvailable) {
        Write-Warning "Microsoft.Graph module not available for entra_signin query. Run: Install-TackleboxDependencies -Component microsoft.graph"
        return $null
    }

    try {
        Import-Module Microsoft.Graph.Reports -ErrorAction SilentlyContinue

        $sinceStr = $Since.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        $filterParts = @("createdDateTime ge $sinceStr")

        $fieldMap = @{
            conditionalAccessStatus = 'conditionalAccessStatus'
            riskLevelDuringSignIn   = 'riskLevelDuringSignIn'
            userPrincipalName       = 'userPrincipalName'
            appId                   = 'appId'
            ipAddress               = 'ipAddress'
            clientAppUsed           = 'clientAppUsed'
        }

        foreach ($key in $Match.Keys) {
            if ($fieldMap.ContainsKey($key)) {
                $filterParts += "$($fieldMap[$key]) eq '$($Match[$key])'"
            } else {
                Write-Verbose "entra_signin: skipping unknown match key '$key' (not a supported signIn filter field)"
            }
        }

        $filter = $filterParts -join ' and '
        $hits = Get-MgAuditLogSignIn -Filter $filter -Top 5 -ErrorAction Stop
        return if ($hits) { $hits[0] } else { $null }
    } catch {
        Write-Warning "Entra sign-in query failed: $($_.Exception.Message)"
        return $null
    }
}

function Invoke-TackleboxUalQuery {
    <#
    .SYNOPSIS
        Query Unified Audit Log via ExchangeOnlineManagement for telemetry validation.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [hashtable]$Match,
        [Parameter(Mandatory)] [datetime]$Since
    )

    if (-not (Get-Module ExchangeOnlineManagement -ListAvailable -ErrorAction SilentlyContinue)) {
        Write-Warning "ExchangeOnlineManagement module not available for ual query. Run: Install-TackleboxDependencies -Component exchangeonlinemanagement"
        return $null
    }

    try {
        $params = @{
            StartDate  = $Since.ToUniversalTime().AddMinutes(-5)
            EndDate    = (Get-Date).ToUniversalTime()
            ResultSize = 20
        }

        if ($Match.ContainsKey('Operations'))  { $params.Operations = $Match['Operations'] }
        if ($Match.ContainsKey('RecordType'))  { $params.RecordType = $Match['RecordType'] }
        if ($Match.ContainsKey('UserIds'))     { $params.UserIds    = $Match['UserIds'] }
        if ($Match.ContainsKey('ObjectIds'))   { $params.ObjectIds  = $Match['ObjectIds'] }

        $hits = Search-UnifiedAuditLog @params -ErrorAction Stop

        if (-not $hits) { return $null }

        foreach ($hit in $hits) {
            try {
                $auditData = $hit.AuditData | ConvertFrom-Json -AsHashtable -ErrorAction SilentlyContinue
            } catch {
                $auditData = @{}
            }

            $isMatch = $true
            foreach ($key in $Match.Keys) {
                if ($key -in 'Operations', 'RecordType', 'UserIds', 'ObjectIds') { continue }
                if (-not $auditData.ContainsKey($key) -or "$($auditData[$key])" -ne "$($Match[$key])") {
                    $isMatch = $false
                    break
                }
            }
            if ($isMatch) { return $hit }
        }
        return $null
    } catch {
        Write-Warning "UAL query failed: $($_.Exception.Message)"
        return $null
    }
}

function Invoke-TackleboxGraphAuditQuery {
    <#
    .SYNOPSIS
        Query Microsoft Graph directory audit log for telemetry validation.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [hashtable]$Match,
        [Parameter(Mandatory)] [datetime]$Since
    )

    $graphAvailable = (Get-Module Microsoft.Graph.Reports -ListAvailable -ErrorAction SilentlyContinue) -or
                      (Get-Module Microsoft.Graph -ListAvailable -ErrorAction SilentlyContinue)
    if (-not $graphAvailable) {
        Write-Warning "Microsoft.Graph module not available for graph_audit query."
        return $null
    }

    try {
        Import-Module Microsoft.Graph.Reports -ErrorAction SilentlyContinue

        $sinceStr = $Since.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        $filterParts = @("activityDateTime ge $sinceStr")

        foreach ($key in $Match.Keys) {
            $filterParts += "$key eq '$($Match[$key])'"
        }

        $filter = $filterParts -join ' and '
        $hits = Get-MgAuditLogDirectoryAudit -Filter $filter -Top 5 -ErrorAction Stop
        return if ($hits) { $hits[0] } else { $null }
    } catch {
        Write-Warning "Graph audit query failed: $($_.Exception.Message)"
        return $null
    }
}

function Invoke-TackleboxExoAuditQuery {
    <#
    .SYNOPSIS
        Query Exchange Online audit events (surfaced through UAL with EXO record types).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [hashtable]$Match,
        [Parameter(Mandatory)] [datetime]$Since
    )
    return Invoke-TackleboxUalQuery -Match $Match -Since $Since
}
