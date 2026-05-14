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
        Write-Host ""
        Write-Host "  ######   ##    ####  ##  ## ##     ###### #####   ####  ##  ##" -ForegroundColor Cyan
        Write-Host "    ##    ####  ##  ## ## ##  ##     ##     ##  ## ##  ##  ####" -ForegroundColor Cyan
        Write-Host "    ##   ##  ## ##     ####   ##     ####   #####  ##  ##   ##" -ForegroundColor Cyan
        Write-Host "    ##   ###### ##  ## ## ##  ##     ##     ##  ## ##  ##  ####" -ForegroundColor Cyan
        Write-Host "    ##   ##  ##  ####  ##  ## ###### ###### #####   ####  ##  ##" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "    AiTM phishing kit emulation for M365 / Entra ID" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "                          |" -ForegroundColor White
        Write-Host "                         \|/" -ForegroundColor White
        Write-Host "                          |" -ForegroundColor White
        Write-Host "                          J" -ForegroundColor Gray
        Write-Host "                         /" -ForegroundColor Gray
        Write-Host "          ______________/" -ForegroundColor Gray
        Write-Host "         /  /\  O        \" -ForegroundColor Gray
        Write-Host "    /\  / /'--'  ~~~~~    \" -ForegroundColor Gray
        Write-Host "   /  \--<                 >-->" -ForegroundColor Gray
        Write-Host "   \  /   \       ~~~~~   /" -ForegroundColor Gray
        Write-Host "    \/     \_____________/" -ForegroundColor Gray
        Write-Host "        ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~" -ForegroundColor DarkCyan
        Write-Host ""
        return
    }

    # Full banner — designed for 80-column terminals
    Write-Host ""
    Write-Host "   ######   ##    ####  ##  ##  ##     ######  #####   ####   ##  ##" -ForegroundColor Cyan
    Write-Host "     ##    ####  ##  ## ## ##   ##     ##      ##  ## ##  ##   ####" -ForegroundColor Cyan
    Write-Host "     ##   ##  ## ##     ####    ##     ####    #####  ##  ##    ##" -ForegroundColor Cyan
    Write-Host "     ##   ###### ##  ## ## ##   ##     ##      ##  ## ##  ##   ####" -ForegroundColor Cyan
    Write-Host "     ##   ##  ##  ####  ##  ##  ###### ######  #####   ####   ##  ##" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "          AiTM phishing kit emulation for M365 / Entra ID" -ForegroundColor Yellow
    Write-Host ""

    # Hooked fish — side-view with forked tail, dorsal fin, single eye
    Write-Host "                                        |" -ForegroundColor White
    Write-Host "                                        |" -ForegroundColor White
    Write-Host "                                       \|/" -ForegroundColor White
    Write-Host "                                        |" -ForegroundColor White
    Write-Host "                                        J" -ForegroundColor Gray
    Write-Host "                                       /" -ForegroundColor Gray
    Write-Host "                    ___________________/" -ForegroundColor Gray
    Write-Host "                   /     __                '-." -ForegroundColor Gray
    Write-Host "                  /    /    \    O              '-." -ForegroundColor Gray
    Write-Host "       /\        /    '------'                      |" -ForegroundColor Gray
    Write-Host "      /  \      /                ~~~~~              |" -ForegroundColor Gray
    Write-Host "     /    \----<                                     >-->" -ForegroundColor Gray
    Write-Host "     \    /     \                ~~~~~              |" -ForegroundColor Gray
    Write-Host "      \  /       \                              .-'" -ForegroundColor Gray
    Write-Host "       \/         \                         .-'" -ForegroundColor Gray
    Write-Host "                   \_______________________/" -ForegroundColor Gray
    Write-Host "                        /            \" -ForegroundColor Gray
    Write-Host "              ~ ~ ~ ~ /~~~~~~~~~~~~~~~~\ ~ ~ ~ ~ ~" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Host "  github.com/iimp0ster/tacklebox  |  lab-only, safety-gated" -ForegroundColor DarkGray
    Write-Host ""
}
