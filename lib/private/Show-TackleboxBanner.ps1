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

    # Full banner — boxed design for 80-column UTF-8 terminals
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                                              ║" -ForegroundColor Cyan
    Write-Host "║  ████████╗ █████╗  ██████╗██╗  ██╗██╗     ███████╗██████╗  ██████╗ ██╗  ██╗  ║" -ForegroundColor Cyan
    Write-Host "║  ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██║     ██╔════╝██╔══██╗██╔═══██╗╚██╗██╔╝  ║" -ForegroundColor Cyan
    Write-Host "║     ██║   ███████║██║     █████╔╝ ██║     █████╗  ██████╔╝██║   ██║ ╚███╔╝   ║" -ForegroundColor Cyan
    Write-Host "║     ██║   ██╔══██║██║     ██╔═██╗ ██║     ██╔══╝  ██╔══██╗██║   ██║ ██╔██╗   ║" -ForegroundColor Cyan
    Write-Host "║     ██║   ██║  ██║╚██████╗██║  ██╗███████╗███████╗██████╔╝╚██████╔╝██╔╝ ██╗  ║" -ForegroundColor Cyan
    Write-Host "║     ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝  ║" -ForegroundColor Cyan
    Write-Host "║                                                                              ║" -ForegroundColor Cyan
    Write-Host "╠══════════════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋║" -ForegroundColor DarkCyan
    Write-Host "║     °                                  │                              °    · ║" -ForegroundColor DarkCyan
    Write-Host "║           ><(°>                     ╔══╧══╗                   °          ·   ║" -ForegroundColor DarkCyan
    Write-Host "║                    ·                ║~=°=~║             ><((°>               ║" -ForegroundColor DarkCyan
    Write-Host "║    °                                ╚══╤══╝                              ·   ║" -ForegroundColor DarkCyan
    Write-Host "║              ·             °           J                    ·          °     ║" -ForegroundColor DarkCyan
    Write-Host "║      ><(°>                          ><(°>                    ><(((°>         ║" -ForegroundColor DarkCyan
    Write-Host "║            °                               ·      <°))><              ><(°>  ║" -ForegroundColor DarkCyan
    Write-Host "║  · ><(((°>            ><((((°>                         ·            °        ║" -ForegroundColor DarkCyan
    Write-Host "║             · ──────────────────────────────────────────── ><(°>             ║" -ForegroundColor DarkCyan
    Write-Host "║              / ><(((((°>     ○                            \                  ║" -ForegroundColor DarkCyan
    Write-Host "║              \──────────────────────────────────────────── /              ·  ║" -ForegroundColor DarkCyan
    Write-Host "╠══════════════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  AiTM phishing kit emulation  ·  M365 / Entra ID  ·  [ LAB ONLY ]            ║" -ForegroundColor Yellow
    Write-Host "║  every lure · every hook · every kit · one tacklebox                         ║" -ForegroundColor Yellow
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}
