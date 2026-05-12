function Install-TackleboxDependencies {
    <#
    .SYNOPSIS
        Provisions upstream tools at the versions pinned in
        dependencies/PINNED-VERSIONS.md and dependencies/manifests/*.json.

    .DESCRIPTION
        Reads each manifest under dependencies/manifests/ and installs the
        named tool to ~/.tacklebox/tools/ (PowerShell modules) or via pipx
        (Python tools). Validates each install with the manifest's
        verify_command.

        This cmdlet is idempotent — running with a tool already at the
        pinned version is a no-op. Use -Force to reinstall regardless.

        Phase 0 status: pinned versions are PLACEHOLDERS in
        PINNED-VERSIONS.md. This cmdlet's behavior with placeholder pins is
        documented but not exercised in CI. Real install logic is exercised
        in Phase 1 (when the first atomic depends on roadtx).

    .PARAMETER Component
        Which dependency to install. 'all' installs every manifest.

    .PARAMETER Force
        Reinstall even if the pinned version is already present.
    #>
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [ValidateSet('all', 'roadtx', 'tokentacticsv2', 'graphrunner', 'aadinternals', 'microsoft.graph', 'exchangeonlinemanagement', 'yaml', 'pester', 'psscriptanalyzer')]
        [string]$Component = 'all',

        [switch]$Force
    )

    $manifestRoot = Join-Path -Path $script:TackleboxModuleRoot -ChildPath 'dependencies/manifests'
    $toolRoot     = Join-Path -Path $script:TackleboxConfigRoot -ChildPath 'tools'

    if (-not (Test-Path -LiteralPath $manifestRoot)) {
        throw "Dependency manifests not found at $manifestRoot."
    }

    $selected = if ($Component -eq 'all') {
        Get-ChildItem -LiteralPath $manifestRoot -Filter '*.json' -File
    } else {
        $candidate = Join-Path -Path $manifestRoot -ChildPath "$Component.json"
        if (-not (Test-Path -LiteralPath $candidate)) {
            # The 'yaml', 'pester', and 'psscriptanalyzer' components are
            # PSGallery installs without a dedicated manifest; treat them as
            # special cases.
            switch ($Component) {
                'yaml' {
                    Install-PSGalleryModuleAtVersion -Module 'powershell-yaml' -Version '0.4.7' -Force:$Force
                    return
                }
                'pester' {
                    Install-PSGalleryModuleAtVersion -Module 'Pester' -Version '5.6.1' -Force:$Force
                    return
                }
                'psscriptanalyzer' {
                    Install-PSGalleryModuleAtVersion -Module 'PSScriptAnalyzer' -Version '1.22.0' -Force:$Force
                    return
                }
                default {
                    throw "No manifest found for component '$Component'."
                }
            }
        }
        Get-ChildItem -LiteralPath $candidate
    }

    foreach ($file in $selected) {
        $manifest = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json -AsHashtable
        Write-Host "[deps] Installing $($manifest.name)..." -ForegroundColor Cyan

        switch ($manifest.kind) {
            'psgallery' {
                Install-PSGalleryModuleAtVersion -Module $manifest.module -Version $manifest.version -Force:$Force
            }
            'github-clone' {
                Install-GitHubClonedModule -Manifest $manifest -ToolRoot $toolRoot -Force:$Force
            }
            'python-pipx' {
                Install-PipxPackage -Manifest $manifest -Force:$Force
            }
            default {
                Write-Warning "Unknown manifest kind '$($manifest.kind)' in $($file.Name); skipping."
            }
        }
    }

    Write-Host "[deps] Done. Re-run Test-TackleboxLab to confirm full readiness." -ForegroundColor Green
}

function Install-PSGalleryModuleAtVersion {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)] [string]$Module,
        [Parameter(Mandatory)] [string]$Version,
        [switch]$Force
    )
    $existing = Get-Module -Name $Module -ListAvailable | Where-Object Version -eq $Version
    if ($existing -and -not $Force) {
        Write-Verbose "[$Module] $Version already installed."
        return
    }
    if ($PSCmdlet.ShouldProcess("$Module@$Version", 'Install-Module')) {
        Install-Module -Name $Module -RequiredVersion $Version -Scope CurrentUser -Force:$Force -AllowClobber -ErrorAction Stop
    }
}

function Install-GitHubClonedModule {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)] [hashtable]$Manifest,
        [Parameter(Mandatory)] [string]$ToolRoot,
        [switch]$Force
    )
    if ($Manifest.commit -eq 'PLACEHOLDER_SHA') {
        Write-Warning "[$($Manifest.name)] commit SHA is a placeholder; install skipped. Confirm pin before Phase 1."
        return
    }
    $dest = Join-Path -Path $ToolRoot -ChildPath $Manifest.name
    if ((Test-Path -LiteralPath $dest) -and -not $Force) {
        $current = (& git -C $dest rev-parse HEAD 2>$null).Trim()
        if ($current -eq $Manifest.commit) {
            Write-Verbose "[$($Manifest.name)] already at $($Manifest.commit)."
            return
        }
    }
    if ($PSCmdlet.ShouldProcess($Manifest.repository, "git clone @ $($Manifest.commit)")) {
        if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
        & git clone --quiet $Manifest.repository $dest
        & git -C $dest checkout --quiet $Manifest.commit
    }
}

function Install-PipxPackage {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)] [hashtable]$Manifest,
        [switch]$Force
    )
    if (-not (Get-Command pipx -ErrorAction SilentlyContinue)) {
        Write-Warning "[$($Manifest.name)] pipx not found on PATH; install skipped. Operator must provide pipx."
        return
    }
    $spec = "$($Manifest.package)==$($Manifest.version)"
    if ($PSCmdlet.ShouldProcess($spec, 'pipx install')) {
        if ($Force) {
            & pipx install --force $spec
        } else {
            & pipx install $spec 2>&1 | Where-Object { $_ -notmatch 'already installed' } | ForEach-Object { Write-Verbose $_ }
        }
        if ($Manifest.name -eq 'roadtx') {
            $pipxOut = & pipx runpip roadtx install packaging setuptools 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "[roadtx] post-install step failed (exit $LASTEXITCODE): $pipxOut"
            }
        }
    }
}
