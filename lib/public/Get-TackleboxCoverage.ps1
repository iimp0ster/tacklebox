function Get-TackleboxCoverage {
    <#
    .SYNOPSIS
        Detection Chokepoints coverage report. Implemented in Phase 5.

    .DESCRIPTION
        Phase 0 status: STUB.
    #>
    [CmdletBinding()]
    param(
        [ValidateSet('Table', 'Json', 'Markdown')]
        [string]$Format = 'Table',

        [switch]$Validated
    )

    throw 'Get-TackleboxCoverage is not implemented in Phase 0. Arrives in Phase 5 (Detection Chokepoints integration); see plan section 17.'
}
