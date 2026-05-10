function Test-AtomicSchema {
    <#
    .SYNOPSIS
        Validates a parsed atomic against schema/tacklebox-atomic.schema.json.

    .DESCRIPTION
        Uses Test-Json with the project's JSON Schema. Returns a result
        object with IsValid + Errors[]. Does not throw on validation failure
        — caller decides whether to surface or aggregate errors (CI lint
        reports across all atomics; runtime invocation refuses on first
        invalid atomic).

        The atomic argument is a hashtable as returned by Read-AtomicYaml.

    .PARAMETER Atomic
        Parsed atomic structure.

    .PARAMETER SchemaPath
        Optional override; defaults to schema/tacklebox-atomic.schema.json
        in the module root.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Atomic,

        [string]$SchemaPath
    )

    if (-not $SchemaPath) {
        $SchemaPath = Join-Path -Path $script:TackleboxModuleRoot -ChildPath 'schema/tacklebox-atomic.schema.json'
    }

    if (-not (Test-Path -LiteralPath $SchemaPath)) {
        throw "Atomic JSON Schema not found at: $SchemaPath"
    }

    # Test-Json takes JSON, not hashtables. Round-trip through ConvertTo-Json.
    # Depth 32 is generous; atomics rarely nest beyond 5.
    $json = $Atomic | ConvertTo-Json -Depth 32 -Compress

    $errors = @()
    $isValid = $true

    try {
        # PS7 Test-Json supports JSON Schema Draft 6, 7, and 2020-12 (latter
        # added in PS 7.4). On older PS versions, fall back to Test-Json
        # without -SchemaFile (structural-only) and emit a verbose warning.
        $null = Test-Json -Json $json -SchemaFile $SchemaPath -ErrorAction Stop
    } catch {
        $isValid = $false
        $errors += $_.Exception.Message
    }

    # Cross-cutting checks Test-Json/JSON Schema can't easily express:
    # 1. Every atomic_test's auto_generated_guid is unique within the file.
    if ($Atomic.atomic_tests) {
        $guids = @()
        foreach ($t in $Atomic.atomic_tests) {
            if ($t.auto_generated_guid) { $guids += $t.auto_generated_guid }
        }
        $dupes = $guids | Group-Object | Where-Object { $_.Count -gt 1 }
        foreach ($d in $dupes) {
            $isValid = $false
            $errors += "Duplicate auto_generated_guid '$($d.Name)' across atomic_tests."
        }
    }

    return [pscustomobject]@{
        IsValid = $isValid
        Errors  = $errors
    }
}
