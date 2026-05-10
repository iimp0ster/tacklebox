@{
    RootModule           = 'Tacklebox.psm1'
    ModuleVersion        = '0.1.0'
    GUID                 = 'b1f7c0a4-9d56-4a3e-8c7e-1d2f3a4b5c6d'
    Author               = 'iimp0ster'
    CompanyName          = 'Tacklebox'
    Copyright            = '(c) iimp0ster. License TBD before v1 release.'
    Description          = 'AiTM phishing kit emulation framework for M365 / Entra detection engineering.'

    PowerShellVersion    = '7.2'
    CompatiblePSEditions = @('Core')

    RequiredModules      = @()

    FunctionsToExport    = @(
        'Invoke-Tacklebox',
        'Invoke-TackleboxRig',
        'Get-Tackle',
        'Get-TackleboxRig',
        'Search-TackleboxTelemetry',
        'Test-TackleboxLab',
        'Get-TackleboxCoverage',
        'Install-TackleboxDependencies'
    )
    CmdletsToExport      = @()
    VariablesToExport    = @()
    AliasesToExport      = @()

    PrivateData = @{
        PSData = @{
            Tags         = @(
                'Security', 'DetectionEngineering', 'AiTM', 'Phishing',
                'M365', 'Entra', 'AzureAD', 'AtomicRedTeam', 'PurpleTeam'
            )
            ProjectUri   = 'https://github.com/iimp0ster/tacklebox'
            LicenseUri   = ''
            ReleaseNotes = 'Pre-v1 (Phase 0). Module skeleton, lab-tenant guard, schema parser, token cache I/O. No atomics implemented yet.'
        }
    }
}
