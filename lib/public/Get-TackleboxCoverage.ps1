function Get-TackleboxCoverage {
    <#
    .SYNOPSIS
        Detection Chokepoints coverage report across all authored atomics.

    .DESCRIPTION
        Enumerates all atomics via Get-Tackle, inspects exercises_chokepoint
        and expected_telemetry to build a per-chokepoint coverage model, then
        optionally filters to only chokepoints validated by a recent -Validate
        run (run log has telemetry-hit for that chokepoint).

        Also reports rig-level coverage: which rigs exercise which chokepoints
        in sequence.

    .PARAMETER Format
        Output format: Table (default), Json, or Markdown.

    .PARAMETER Validated
        When set, only include chokepoints with at least one telemetry-hit in
        the run logs (i.e., chokepoints confirmed in a real lab run).

    .PARAMETER RunsDir
        Override the run logs directory. Defaults to ~/.tacklebox/runs/.
    #>
    [CmdletBinding()]
    param(
        [ValidateSet('Table', 'Json', 'Markdown')]
        [string]$Format = 'Table',

        [switch]$Validated,

        [string]$RunsDir
    )

    if (-not $RunsDir) {
        $RunsDir = Join-Path -Path $script:TackleboxConfigRoot -ChildPath 'runs'
    }

    # ── 1. Build chokepoint → atomic coverage model ───────────────────────────

    $atomics = @(Get-Tackle)
    $coverage = [ordered]@{}   # chokepoint_id → coverage entry

    foreach ($row in $atomics) {
        if (-not $row.Chokepoint) { continue }

        $cpId = $row.Chokepoint

        if (-not $coverage.ContainsKey($cpId)) {
            # Resolve chokepoint URL from the YAML if available
            $cpUrl = $null
            try {
                $yamlData = Read-AtomicYaml -Path $row.YamlPath
                $test = @($yamlData.atomic_tests) | Where-Object { $_.name -eq $row.TestName } | Select-Object -First 1
                if ($test -and $test.ContainsKey('exercises_chokepoint') -and $test.exercises_chokepoint.ContainsKey('url')) {
                    $cpUrl = $test.exercises_chokepoint.url
                }
            } catch {
                Write-Verbose "Could not re-read YAML for '$($row.Id)': $($_.Exception.Message)"
            }

            $coverage[$cpId] = [pscustomobject]@{
                ChokepointId     = $cpId
                Url              = $cpUrl
                Atomics          = [System.Collections.Generic.List[string]]::new()
                Rigs             = [System.Collections.Generic.List[string]]::new()
                TelemetrySources = [System.Collections.Generic.List[string]]::new()
                Authored         = $true
                Validated        = $false
                LastValidatedRun = $null
            }
        }

        $entry = $coverage[$cpId]
        $atomicLabel = "$($row.Id) / $($row.TestName)"
        if ($entry.Atomics -notcontains $atomicLabel) {
            $entry.Atomics.Add($atomicLabel)
        }

        # Collect telemetry sources declared for this chokepoint's tests
        try {
            $yamlData = Read-AtomicYaml -Path $row.YamlPath
            $test = @($yamlData.atomic_tests) | Where-Object { $_.name -eq $row.TestName } | Select-Object -First 1
            if ($test -and $test.ContainsKey('expected_telemetry') -and $test.expected_telemetry) {
                foreach ($exp in $test.expected_telemetry) {
                    if ($exp.source -and $entry.TelemetrySources -notcontains $exp.source) {
                        $entry.TelemetrySources.Add($exp.source)
                    }
                }
            }
        } catch {}
    }

    # ── 2. Add rig-level context ──────────────────────────────────────────────

    $rigs = @(Get-TackleboxRig)
    $rigsRoot = Join-Path -Path $script:TackleboxModuleRoot -ChildPath 'rigs'

    foreach ($rig in $rigs) {
        try {
            $rigData = Read-AtomicYaml -Path $rig.YamlPath
            foreach ($step in @($rigData.steps)) {
                $stepAtomicId = $step.atomic
                $matchingRows = $atomics | Where-Object { $_.Id -eq $stepAtomicId }
                foreach ($row in $matchingRows) {
                    if ($row.Chokepoint -and $coverage.ContainsKey($row.Chokepoint)) {
                        $entry = $coverage[$row.Chokepoint]
                        if ($entry.Rigs -notcontains $rig.Name) {
                            $entry.Rigs.Add($rig.Name)
                        }
                    }
                }
            }
        } catch {
            Write-Verbose "Could not process rig '$($rig.Name)': $($_.Exception.Message)"
        }
    }

    # ── 3. Incorporate run-log validation state ───────────────────────────────

    if (Test-Path -LiteralPath $RunsDir) {
        $runFiles = @(Get-ChildItem -LiteralPath $RunsDir -Filter '*.jsonl' -File -ErrorAction SilentlyContinue)
        foreach ($file in $runFiles) {
            $runId = $file.BaseName
            try {
                $events = Get-RunLog -RunId $runId
                $hits   = @($events | Where-Object { $_.kind -eq 'telemetry-hit' })
                if ($hits.Count -eq 0) { continue }

                $castStart = $events | Where-Object { $_.kind -eq 'cast-start' } | Select-Object -Last 1
                $atomicId  = $castStart?.atomic

                $matchingRows = $atomics | Where-Object { $_.Id -eq $atomicId }
                foreach ($row in $matchingRows) {
                    if ($row.Chokepoint -and $coverage.ContainsKey($row.Chokepoint)) {
                        $entry = $coverage[$row.Chokepoint]
                        $entry.Validated = $true
                        $hitTs = ($hits | Sort-Object { $_.ts } | Select-Object -Last 1).ts
                        if (-not $entry.LastValidatedRun -or $hitTs -gt $entry.LastValidatedRun) {
                            $entry.LastValidatedRun = $hitTs
                        }
                    }
                }
            } catch {
                Write-Verbose "Could not parse run log '$runId': $($_.Exception.Message)"
            }
        }
    }

    # ── 4. Filter + sort ──────────────────────────────────────────────────────

    $rows = @($coverage.Values)
    if ($Validated) {
        $rows = @($rows | Where-Object { $_.Validated })
    }
    $rows = @($rows | Sort-Object ChokepointId)

    if ($rows.Count -eq 0) {
        $msg = if ($Validated) {
            'No validated chokepoints found. Run atomics or rigs with -Validate to generate telemetry-hit events.'
        } else {
            'No chokepoints found. Author atomics with exercises_chokepoint set to populate coverage.'
        }
        Write-Host $msg -ForegroundColor Yellow
        return @()
    }

    # ── 5. Format output ──────────────────────────────────────────────────────

    switch ($Format) {
        'Json' {
            return $rows | ConvertTo-Json -Depth 8
        }

        'Markdown' {
            $sb = [System.Text.StringBuilder]::new()
            $null = $sb.AppendLine('# Tacklebox – Detection Chokepoints Coverage')
            $null = $sb.AppendLine()
            $null = $sb.AppendLine("| Chokepoint | Atomics | Rigs | Telemetry Sources | Validated |")
            $null = $sb.AppendLine("|------------|---------|------|-------------------|-----------|")
            foreach ($row in $rows) {
                $cpCell   = if ($row.Url) { "[$($row.ChokepointId)]($($row.Url))" } else { $row.ChokepointId }
                $atomCell = ($row.Atomics | ForEach-Object { $_ }) -join '<br>'
                $rigCell  = ($row.Rigs   | ForEach-Object { $_ }) -join '<br>'
                $telCell  = $row.TelemetrySources -join ', '
                $valCell  = if ($row.Validated) { "✓ $($row.LastValidatedRun?.Substring(0,10))" } else { '' }
                $null = $sb.AppendLine("| $cpCell | $atomCell | $rigCell | $telCell | $valCell |")
            }
            return $sb.ToString()
        }

        default {
            # Table
            $tableRows = $rows | ForEach-Object {
                [pscustomobject]@{
                    ChokepointId  = $_.ChokepointId
                    Atomics       = $_.Atomics.Count
                    Rigs          = $_.Rigs -join ', '
                    Sources       = $_.TelemetrySources -join ', '
                    Validated     = if ($_.Validated) { 'Yes' } else { 'No' }
                    LastValidated = if ($_.LastValidatedRun) { $_.LastValidatedRun.Substring(0, 10) } else { '' }
                }
            }
            $tableRows | Format-Table -AutoSize
            return $rows
        }
    }
}
