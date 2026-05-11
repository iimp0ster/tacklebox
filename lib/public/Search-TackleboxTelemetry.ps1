function Search-TackleboxTelemetry {
    <#
    .SYNOPSIS
        Confirm declared expected_telemetry events appeared in Entra/UAL.

    .DESCRIPTION
        Reads the run log for the given RunId, recovers the expected_telemetry
        entries from the cast-start event, then queries the appropriate log
        source for each expectation. Polls until each expectation's
        within_minutes budget (or -WaitMinutes) is exhausted.

        Returns one result object per expectation with Matched, MatchedEvent,
        Source, Expectation, and Budget fields. Also appends telemetry-hit /
        telemetry-miss events to the run log.

    .PARAMETER RunId
        GUID of the run to validate. Must have a cast-start event in its log.

    .PARAMETER WaitMinutes
        Maximum time to poll for ALL expectations. Overridden per-expectation
        by expected_telemetry[].within_minutes when that is lower.

    .PARAMETER Source
        Limit validation to one telemetry source. Defaults to 'all'.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$RunId,

        [int]$WaitMinutes = 15,

        [ValidateSet('entra_signin', 'ual', 'graph_audit', 'exo_audit', 'all')]
        [string]$Source = 'all'
    )

    $events = Get-RunLog -RunId $RunId
    if (-not $events -or $events.Count -eq 0) {
        throw "No run log found for RunId '$RunId'. Ensure the atomic was started with Invoke-Tacklebox -Cast or -Validate."
    }

    $castStart = $events | Where-Object { $_.kind -eq 'cast-start' } | Select-Object -Last 1
    if (-not $castStart) {
        throw "No cast-start event found in run log for RunId '$RunId'."
    }

    $atomicId    = $castStart.atomic
    $castTime    = [datetime]$castStart.ts
    $expectations = @()

    if ($castStart.data -and $castStart.data.ContainsKey('expected_telemetry')) {
        $expectations = @($castStart.data.expected_telemetry)
    }

    if ($Source -ne 'all') {
        $expectations = @($expectations | Where-Object { $_.source -eq $Source })
    }

    if ($expectations.Count -eq 0) {
        Write-Verbose "No telemetry expectations to validate for RunId '$RunId'${Source -ne 'all' ? " (source: $Source)" : ''}."
        return @()
    }

    Write-Host "Validating $($expectations.Count) telemetry expectation(s) for RunId '$RunId'..." -ForegroundColor Cyan

    $results      = [System.Collections.Generic.List[object]]::new()
    $pollInterval = 30   # seconds between retries

    foreach ($exp in $expectations) {
        $expSource = $exp.source
        $expMatch  = if ($exp.ContainsKey('match') -and $exp.match -is [hashtable]) {
            $exp.match
        } else {
            @{}
        }
        $expBudget   = if ($exp.ContainsKey('within_minutes')) { $exp.within_minutes } else { $WaitMinutes }
        $expDeadline = $castTime.AddMinutes($expBudget)

        $matched      = $false
        $matchedEvent = $null

        Write-Verbose "[$expSource] polling until $($expDeadline.ToString('HH:mm:ss')) UTC..."

        while ((Get-Date).ToUniversalTime() -lt $expDeadline -and -not $matched) {
            try {
                $hit = switch ($expSource) {
                    'entra_signin' { Invoke-TackleboxEntraSigninQuery -Match $expMatch -Since $castTime }
                    'ual'          { Invoke-TackleboxUalQuery          -Match $expMatch -Since $castTime }
                    'graph_audit'  { Invoke-TackleboxGraphAuditQuery   -Match $expMatch -Since $castTime }
                    'exo_audit'    { Invoke-TackleboxExoAuditQuery     -Match $expMatch -Since $castTime }
                    default        { $null }
                }

                if ($null -ne $hit) {
                    $matched      = $true
                    $matchedEvent = $hit
                }
            } catch {
                Write-Warning "[$expSource] query error: $($_.Exception.Message)"
            }

            if (-not $matched) {
                $remainingSec = [math]::Max(0, [math]::Round(($expDeadline - (Get-Date).ToUniversalTime()).TotalSeconds))
                if ($remainingSec -gt 0) {
                    Write-Verbose "[$expSource] no match yet; ${remainingSec}s remaining."
                    $sleepSec = [math]::Min($pollInterval, $remainingSec)
                    Start-Sleep -Seconds $sleepSec
                }
            }
        }

        $logKind = if ($matched) { 'telemetry-hit' } else { 'telemetry-miss' }
        Write-RunLog -RunId $RunId -Kind $logKind -Atomic $atomicId -Data @{
            source        = $expSource
            matched       = $matched
            expectation   = $expMatch
            matched_event = if ($matchedEvent) { ($matchedEvent | ConvertTo-Json -Depth 4 -Compress) } else { $null }
        }

        $icon  = if ($matched) { '[HIT] ' } else { '[MISS]' }
        $color = if ($matched) { 'Green' } else { 'Red' }
        Write-Host "  $icon [$expSource]  match: $($expMatch | ConvertTo-Json -Compress)" -ForegroundColor $color

        $expResult = [pscustomobject]@{
            Source       = $expSource
            Matched      = $matched
            MatchedEvent = $matchedEvent
            Expectation  = $expMatch
            Budget       = $expBudget
        }
        $results.Add($expResult)
    }

    return $results.ToArray()
}
