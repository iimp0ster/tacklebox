# Pinned dependency versions

`Install-TackleboxDependencies` reads this file (and `dependencies/manifests/*.json`)
to provision upstream tools at the exact versions Tacklebox is tested against.

When an upstream tool changes its CLI or breaks compatibility, the pin update
follows the procedure in `docs/dependency-issues.md`:

1. Bump the pin here and in the corresponding manifest.
2. Re-test every affected atomic.
3. Document the upstream change and our response in `docs/dependency-issues.md`.
4. Tag the change in the commit message: `deps(<tool>): bump <old> -> <new>`.

Quarterly upstream-tool-version review is a v1.1 maintenance task.

## v1 pins

| Dependency                  | Version / SHA                                  | Source                                              | Manifest                                |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| roadtools (`roadtx`)        | `1.7.0` *(placeholder, confirm at Phase 0 exit)* | PyPI `roadtools`                                  | `manifests/roadtx.json`                 |
| TokenTacticsV2              | `<commit-sha>` *(placeholder)*                 | https://github.com/f-bader/TokenTacticsV2           | `manifests/tokentacticsv2.json`         |
| GraphRunner                 | `<commit-sha>` *(placeholder)*                 | https://github.com/dafthack/GraphRunner             | `manifests/graphrunner.json`            |
| AADInternals                | `0.9.6` *(placeholder)*                        | PowerShell Gallery                                  | `manifests/aadinternals.json`           |
| Microsoft.Graph             | `2.25.0` *(placeholder)*                       | PowerShell Gallery                                  | `manifests/microsoft.graph.json`        |
| ExchangeOnlineManagement    | `3.6.0` *(placeholder)*                        | PowerShell Gallery                                  | `manifests/exchangeonlinemanagement.json` |
| powershell-yaml             | `0.4.7`                                        | PowerShell Gallery                                  | (consumed directly by module)           |
| Pester                      | `5.6.1`                                        | PowerShell Gallery                                  | (test-only)                             |
| PSScriptAnalyzer            | `1.22.0`                                       | PowerShell Gallery                                  | (lint-only)                             |

Versions marked **(placeholder)** must be replaced with confirmed pins before
Phase 1 begins. The framework is read-only without these; no atomic runs.

## Lookup conventions

- **PowerShell Gallery modules** are installed with `Install-Module
  -RequiredVersion <pin>` to `~/.tacklebox/tools/PowerShell/`.
- **GitHub-hosted PowerShell modules** are cloned at the pinned commit SHA to
  `~/.tacklebox/tools/<repo>/` and dot-sourced.
- **Python tools** are installed via `pipx install <pkg>==<pin>` in an
  isolated environment owned by the operator (Tacklebox does not manage
  `pipx` state).
