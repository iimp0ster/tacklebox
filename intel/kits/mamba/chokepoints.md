# mamba -> chokepoint mapping

Covers behaviors grounded by Sekoia TDR "Mamba 2FA: A new contender in the
AiTM phishing ecosystem" (2024-10-09). Post-auth chokepoints (OAuth consent,
token pivot, mailbox access) are tracked in the production rigs/mamba.yaml
and not duplicated here until their citation grounding is confirmed.

| Step | T-ID  | Behavior                          | Chokepoint | URL                                                                        | Confidence |
|------|-------|-----------------------------------|------------|----------------------------------------------------------------------------|------------|
| 1    | T1539 | AiTM session-cookie capture       | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO                  | H          |
| 2    | T1111 | MFA relay interception (OTP/push) | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO                  | H          |

## Detection context per step

### Step 1 -- T1539 (cookie capture)

Primary signal in the wild (not reproducible in lab substitute):
- `entra_signin.userAgent` contains library/hardcoded UA string (e.g. `python-requests/`,
  `Go-http-client/`) or is missing entirely. Mamba uses Firefox/Windows UA per
  rigs/mamba.yaml; relay may forward this consistently across all victims
  (Sekoia global report: "relays hardcode the UA value").
- Source IP is relay server (IPv6 block `2607:5500:3000::/48`) or IPRoyal residential
  proxy. ASN-based detection defeated by IPRoyal proxies from Oct 2024.
- `s2c_cookies` Socket.IO event triggers Telegram exfil; no direct Entra signal.

Lab substitute signal:
- Standard interactive signin telemetry; UA anomaly and relay-ASN absent.

### Step 2 -- T1111 (MFA relay)

Primary signal in the wild:
- Successful MFA completion (sign-in does NOT fail) from relay-origin IP.
- Short time delta between: user entering OTP on phishing page and Microsoft
  recording auth event -- within TOTP window (30s) or push-approval latency.
- `authenticationDetails` shows the intercepted MFA method type.
- Key detection insight: sign-in SUCCEEDS; the anomaly is the source IP /
  UA combination, not an MFA failure.

Lab stub: no signal until fixture implemented.

## Mamba-specific relay detection notes

IPRoyal residential proxy adoption (Oct 2024) means:
- `entra_signin.autonomousSystemNumber` will show residential ISP ASN, not datacenter.
- Country/region may match the victim's expected country.
- Correlation ID reuse and UA consistency across auth steps remain valid signals.
- Most reliable: incoherence across authentication steps (UA or country varies
  within a single correlated auth sequence; Sekoia global report pattern #5).
