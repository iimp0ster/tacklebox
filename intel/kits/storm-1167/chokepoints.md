# storm-1167 -> chokepoint mapping

| Step | T-ID      | Behavior                                | Candidate chokepoint ID | URL                                                                       | Confidence (L/M/H) |
|------|-----------|------------------------------------------|-------------------------|---------------------------------------------------------------------------|--------------------|
| 1    | T1539     | AiTM session cookie capture              | CP-TODO-AITM-CAPTURE    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO-AITM-CAPTURE    | L                  |
| 2    | T1550.001 | Refresh-token replay (Exchange resource) | CP-TODO-REFRESH-REPLAY  | https://iimp0ster.github.io/detection-chokepoints/CP-TODO-REFRESH-REPLAY  | L                  |
| 3    | T1114.003 | Inbox forwarding rule                    | CP-TODO-INBOX-RULE      | https://iimp0ster.github.io/detection-chokepoints/CP-TODO-INBOX-RULE      | L                  |

All confidences are `L` (low) because the candidate chokepoint IDs are
placeholders. Sekoia's June 2025 report contributes additional Storm-1167
specific detection candidates that should be folded into chokepoint
definitions:

- **Tencent CDN tell**: any browser fetch to `*.cos.ap-*.myqcloud.com`
  immediately preceding a Microsoft 365 signin event is anomalous for most
  enterprises; the Sekoia kit sheet identifies this as the Storm-1167
  JavaScript hosting pattern.
- **`/google.php` exfiltration tell**: outbound POST to
  `[0-9]{9,10}\.(cfd|sbs|xyz|my\.id)/google.php` is a high-fidelity
  Storm-1167 indicator.
- **AS132203 / AS19871 source-ASN tell**: signins against App ID
  `4765445b-...` originating from these ASs are highly suspect.

These are network and signin telemetry signals -- not Tacklebox atomic
behaviors, but candidates for chokepoint rules that any Storm-1167
emulation rig should expect to exercise.
