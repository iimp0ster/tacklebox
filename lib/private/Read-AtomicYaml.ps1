function Read-AtomicYaml {
    <#
    .SYNOPSIS
        Loads and parses an atomic YAML file into a hashtable.

    .DESCRIPTION
        Returns the raw parsed structure. Schema validation is performed
        separately by Test-AtomicSchema. This split lets us emit better
        error messages: parse errors are obviously distinct from schema
        violations.

        Requires the powershell-yaml module to be installed and importable.

    .PARAMETER Path
        Absolute path to the .yaml file.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Atomic YAML not found: $Path"
    }

    if (-not (Get-Module -Name powershell-yaml -ListAvailable)) {
        throw "powershell-yaml module is required. Run: Install-TackleboxDependencies -Component yaml"
    }

    Import-Module -Name powershell-yaml -ErrorAction Stop

    $raw = Get-Content -LiteralPath $Path -Raw -ErrorAction Stop
    try {
        return ConvertFrom-Yaml -Yaml $raw -Ordered
    } catch {
        throw "Failed to parse atomic YAML at '$Path': $($_.Exception.Message)"
    }
}
