function Write-RunLog {
    <#
    .SYNOPSIS
        Append a structured event to a run log.

    .DESCRIPTION
        Run logs are JSON Lines (one JSON object per line) at
        ~/.tacklebox/runs/<RunId>.jsonl. Each event is timestamped and
        tagged. The Search-TackleboxTelemetry cmdlet reads these to
        correlate cast-time activity with telemetry hits.

        The structure of each event:
          { "ts":"...", "run_id":"...", "kind":"...", "atomic":"...",
            "data":{...} }

    .PARAMETER RunId
        GUID identifying the run; reused across all steps of a rig.

    .PARAMETER Kind
        Event category: cast-start, cast-end, validate-start, validate-end,
        telemetry-hit, telemetry-miss, cleanup, error, info.

    .PARAMETER Atomic
        Atomic id, when the event is scoped to a specific atomic.

    .PARAMETER Data
        Hashtable of arbitrary structured data attached to the event.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]$RunId,

        [Parameter(Mandatory)]
        [ValidateSet(
            'cast-start', 'cast-end',
            'validate-start', 'validate-end',
            'telemetry-hit', 'telemetry-miss',
            'cleanup', 'error', 'info'
        )]
        [string]$Kind,

        [string]$Atomic,

        [hashtable]$Data
    )

    $event = [ordered]@{
        ts     = (Get-Date).ToUniversalTime().ToString('o')
        run_id = $RunId
        kind   = $Kind
    }
    if ($Atomic) { $event.atomic = $Atomic }
    if ($Data)   { $event.data   = $Data }

    $dir = Join-Path -Path $script:TackleboxConfigRoot -ChildPath 'runs'
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $path = Join-Path -Path $dir -ChildPath "$RunId.jsonl"
    $line = ($event | ConvertTo-Json -Depth 16 -Compress)
    Add-Content -LiteralPath $path -Value $line -ErrorAction Stop
}

function Get-RunLog {
    <#
    .SYNOPSIS
        Read all events for a given RunId. Returns an array of hashtables.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$RunId
    )

    $path = Join-Path -Path $script:TackleboxConfigRoot -ChildPath "runs/$RunId.jsonl"
    if (-not (Test-Path -LiteralPath $path)) { return @() }

    Get-Content -LiteralPath $path | Where-Object { $_ -and $_.Trim() } | ForEach-Object {
        $_ | ConvertFrom-Json -AsHashtable
    }
}
