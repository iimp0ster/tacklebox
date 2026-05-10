function Invoke-Tacklebox {
    <#
    .SYNOPSIS
        Run a single atomic. Implemented in Phase 1.

    .DESCRIPTION
        This is the canonical execution cmdlet for Tacklebox atomics. The
        full implementation arrives in Phase 1 and includes:

          -DryRun   Show planned subprocess invocation + telemetry queries.
          -Cast     Execute against the lab tenant; capture token state.
          -Validate Cast, then confirm declared expected_telemetry events
                    appear in Entra/UAL within the per-source latency budget.

        Phase 0 status: STUB. Throws with a clear pointer to the plan phase.
    #>
    [CmdletBinding(DefaultParameterSetName = 'DryRun')]
    param(
        [Parameter(Mandatory)] [string]$Atomic,
        [string]$TestName,
        [hashtable]$InputArgs,
        [Parameter(ParameterSetName = 'DryRun')]   [switch]$DryRun,
        [Parameter(ParameterSetName = 'Cast')]     [switch]$Cast,
        [Parameter(ParameterSetName = 'Validate')] [switch]$Validate,
        [string]$TokenCacheKey,
        [string]$RunId
    )

    throw 'Invoke-Tacklebox is not implemented in Phase 0. Phase 1 (one auth atomic, end-to-end) is the harness gate; see plan section 12.'
}
