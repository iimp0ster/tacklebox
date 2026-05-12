function Show-TackleboxBanner {
    <#
    .SYNOPSIS
        Display the Tacklebox ASCII art banner in the terminal.

    .DESCRIPTION
        Prints either the full (default) or compact banner to the host.
        Called automatically on module import unless TACKLEBOX_NO_BANNER=1.

    .PARAMETER Compact
        Print the shorter banner for narrow terminals or CI environments.
    #>
    [CmdletBinding()]
    param(
        [switch]$Compact
    )

    if ($Compact) {
        # Compact: small wordmark + single hook
        Write-Host ""
        Write-Host "  _____ _   ___ _  ___    ___ ___   _____  __" -ForegroundColor Cyan
        Write-Host " |_   _/_\ / __| |/ / |  | __| _ ) / _ \ \/ /" -ForegroundColor Cyan
        Write-Host "   | |/ _ \ (__| ' <| |__| _|| _ \| (_) >  <" -ForegroundColor Cyan
        Write-Host "   |_/_/ \_\___|_|\_\____|___|___/ \___/_/\_\" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "     AiTM phishing kit emulation v1" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "            ," -ForegroundColor DarkGray
        Write-Host "           /|" -ForegroundColor DarkGray
        Write-Host "          / |" -ForegroundColor DarkGray
        Write-Host "         /  '" -ForegroundColor DarkGray
        Write-Host "        |" -ForegroundColor DarkGray
        Write-Host "        |" -ForegroundColor DarkGray
        Write-Host "         \" -ForegroundColor DarkGray
        Write-Host "          '-.__" -ForegroundColor DarkGray
        Write-Host "               '>" -ForegroundColor DarkGray
        Write-Host ""
        return
    }

    # Full banner — designed for 80-column terminals
    # Wordmark
    Write-Host ""
    Write-Host "  _________ ________  ________  ______ _      _______  ____   ______  _  __" -ForegroundColor Cyan
    Write-Host " |__   __(_)__   __|/ ____| |/ ____| |    | |__   __| |  _ \/ __ \ \/ /" -ForegroundColor Cyan
    Write-Host "    | |   _ | |  | |     | | |    | |    | |  | |    | |_) | |  | |>  <" -ForegroundColor Cyan
    Write-Host "    | |  / \| |  | |    _| | |    | |    | |  | |    |  _ <| |  | / . \" -ForegroundColor Cyan
    Write-Host "    | | / _ \ |  | |   / \| | |___| |___| |  | |    | |_) | |__| / /\ \" -ForegroundColor Cyan
    Write-Host "    |_|/_/ \_\_|  |_|  \___|_|\_____|_____|_|  |_|    |____/ \____/_/  \_\" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "          AiTM phishing kit emulation for M365 / Entra ID" -ForegroundColor Yellow
    Write-Host ""

    # Giant hook — clean and unambiguous
    Write-Host "                          ___" -ForegroundColor DarkGray
    Write-Host "                         /   |" -ForegroundColor DarkGray
    Write-Host "                        /    |" -ForegroundColor DarkGray
    Write-Host "                       /     '" -ForegroundColor DarkGray
    Write-Host "                      |" -ForegroundColor DarkGray
    Write-Host "                      |" -ForegroundColor DarkGray
    Write-Host "                      |" -ForegroundColor DarkGray
    Write-Host "                      |" -ForegroundColor DarkGray
    Write-Host "                       \" -ForegroundColor DarkGray
    Write-Host "                        \___" -ForegroundColor DarkGray
    Write-Host "                            '--." -ForegroundColor DarkGray
    Write-Host "                               >" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  github.com/iimp0ster/tacklebox  |  lab-only, safety-gated" -ForegroundColor DarkGray
    Write-Host ""
}
