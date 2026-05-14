# Pester configuration shared between unit and integration test runs.
# Invoke with: Invoke-Pester -Configuration (& ./tests/pester.config.ps1)

# Suppress the ASCII banner during test runs so output stays clean.
$env:TACKLEBOX_NO_BANNER = '1'

$config = New-PesterConfiguration

$config.Run.Path        = @('./tests/unit')
$config.Run.PassThru    = $true
$config.Run.Exit        = $true

$config.Output.Verbosity = 'Detailed'

$config.TestResult.Enabled      = $true
$config.TestResult.OutputFormat = 'NUnitXml'
$config.TestResult.OutputPath   = 'TestResults.xml'

$config.CodeCoverage.Enabled              = $false   # Enable per-PR if desired
$config.CodeCoverage.OutputFormat         = 'JaCoCo'
$config.CodeCoverage.OutputPath           = 'coverage.xml'

return $config
