function Invoke-TackleboxRig {
    <#
    .SYNOPSIS
        Run a chained kit-profile rig. Implemented in Phase 4.

    .DESCRIPTION
        Phase 0 status: STUB.
    #>
    [CmdletBinding(DefaultParameterSetName = 'DryRun')]
    param(
        [Parameter(Mandatory)] [string]$Rig,
        [Parameter(ParameterSetName = 'DryRun')]   [switch]$DryRun,
        [Parameter(ParameterSetName = 'Cast')]     [switch]$Cast,
        [Parameter(ParameterSetName = 'Validate')] [switch]$Validate,
        [switch]$StopOnError,
        [string]$RunId
    )

    throw 'Invoke-TackleboxRig is not implemented in Phase 0. Arrives in Phase 4 (kit-profile system); see plan section 16.'
}
