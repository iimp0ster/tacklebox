# lapsed-domain-aitm observation -- 2026-05-17

## Kit identification

Source: Sublime Security, "AITM phishing with Russian infrastructure and
detection evasion from a lapsed domain", June 12, 2025 (tier_2)
https://sublime.security/blog/aitm-phishing-with-russian-infrastructure-and-detection-evasion-from-a-lapsed-domain/

This is a specific campaign observation, not a named PhaaS kit. Slug
`lapsed-domain-aitm` describes the defining delivery evasion technique.
No existing production rig or atomic fragment matches; slug coined per
`^[a-z0-9][a-z0-9-]*$` convention.

SOURCE TIER NOTE: Sublime Security is `tier_2` in trusted_sources.yaml.
Sublime alone is sufficient for `email_obfuscation` and `email_layer_detection`
claims. It is NOT sufficient alone for `kit_internals`, `api_endpoints`, or
`aitm_tradecraft` claims. The T1539 atomic draft carries an explicit
grounding-gap flag; `tools/check_grounding.py` will fail until a tier_1
or second tier_2 co-citation is added. No `kit_internals` atomics are drafted.

URLScan candidate query (unvalidated):
  page.url:*team.ru.com* AND (page.url:*auth* OR filename:"*.js")


## Attack chain summary (from Sublime)

  Email: dilloncriminallaw[.]com (lapsed law firm domain)
    -> Gate: meeting.sa[.]com/<150-char-encoded-email>
         blockDomains: belfius, baringa
         isBot: UA patterns + navigator.webdriver + plugins.length + languages
         checkIpBlock: api.ipify[.]org (empty blocklist in this sample)
         handleRedirect: decodes email, builds Stage 2 URL
    -> Stage 2: [org].team.ru[.]com/auth/?uid=<b64email>&hid=<hexuid>&...
         450KB obfuscated JS + WebSocket + WebAssembly + fingerprintjs
         POSTs browser fingerprint to server; 302 redirect on pass
    -> Stage 3: <rand>.team.za[.]com/<hardcoded-folder>/
         WSS endpoint: wss://52e42e6675254286a4273c62f3b19bfb.team.za[.]com/6802a801d7f11fb0bef7f792/
    -> AiTM O365 login page branded to victim org
         Credentials captured AND forwarded to Microsoft


## Lapsed domain evasion (email_obfuscation -- Sublime alone sufficient)

dilloncriminallaw[.]com registered 2019 by a Colorado law firm; lapsed;
repurchased via GNAME (Chinese expired-domain registrar); dormant until Jan
2025 when restored to apparent legitimacy. Email infrastructure: valid SPF,
DKIM signatures, MX pointing to 193.169.228.13 (SmartApe OU, Russian hosting).
Result: email passes SPF/DKIM with an aged domain reputation.


## Gate fingerprinting (email_layer_detection -- Sublime alone sufficient)

URL structure: hxxps://meeting.sa[.]com/<150-char-custom-encoded-email>

Custom substitution cipher (verbatim from Sublime):
  "@": "MN3", ".": "OP4", "a": "QR5", "e": "ST6", "i": "UV7",
  "o": "WX8", "u": "YZ9", "s": "AB0", "n": "CD1", "r": "EF2",
  "d": "GH3", "l": "JK4"
Example: user@victim.com encoded as YZ9AB0ST6EF2MN3vUV7ctUV7mOP4cWX8m
Fallback decoding: hex, then Base32, then Base64 -- tried in order.

Domain blocklist in gate JS (verbatim from Sublime):
  const blockedDomains = ['belfius', 'baringa'];
  Variants seen blocking chase[.]com and credit-suisse[.]com.

Bot detection (from Sublime):
  UA patterns blocked: bot, spider, crawl, slurp, baidu, yandex, wget, curl,
    lighthouse, pagespeed, prerender, screaming frog, semrush, ahrefs, duckduckgo
  Headless browser check:
    navigator.webdriver || navigator.plugins.length === 0 ||
    navigator.languages === "" || navigator.languages === undefined

Stage 2 URL construction (Sublime):
  https://<org-prefix>.team.ru[.]com/auth/?uid=<base64email>&hid=<hexuid>
    &document=<r1>-<r2>-<r3>-<r4>&token=<r5>-<r6>-<r7>-<r8>&t=<timestamp>
  where org-prefix = victim email domain prefix (per-org subdomain).


## AiTM final stage (tier_2 only -- insufficient alone for aitm_tradecraft)

Sublime: "This final page is a simple Office 365 login page that is branded
to the victim with their graphical logo and a background image specific to
their company. This is finally the actual AITM phishing page that collects
entered credentials, which are legitimately forwarded to Microsoft to login
while also being captured."

No relay mechanism internals described. No session cookie handling detailed.
appId unknown. Tier_1 co-citation required before T1539 atomic can be promoted.


## Post-auth behaviors observed

None described. Article ends at credential capture. No post-auth operator
actions (inbox rules, device registration, token abuse, BEC) documented.


## Lab-safe primitive vs. observed TTP

T1539 -- AiTM session-cookie capture:
Article confirms an AiTM credential harvesting final stage but does not
describe relay implementation details. Tacklebox does not stand up a relay.
T1539 draft is a stub only; lab-safe primitive (interactive signin) is the
same substitute used for all cookie-capture atomics, but this Sublime tier_2
source alone does NOT ground aitm_tradecraft. Tier_1 source covering Stage 3
relay internals required before check_grounding.py will pass.


## Email-layer detection signals (email_layer_detection -- Sublime alone sufficient)

These do not map to Tacklebox atomics (Tacklebox is post-auth Entra behavior)
but are preserved for detection engineering reference.

1. Sender domain mismatch (Teams claim vs dilloncriminallaw[.]com)
2. Teams meeting link to non-Microsoft domain (meeting.sa[.]com)
3. Unsolicited first-time sender
4. Excessive invisible characters (content displacement)
5. Sublime Core Feed MQL rule: "Brand Impersonation: Microsoft Teams Invitation"
   https://sublime.security/feeds/core/detection-rules/brand-impersonation-microsoft-teams-invitation-46410ad8/


## IOCs (ioc_volume -- Sublime alone sufficient)

hostname   dilloncriminallaw[.]com  email delivery (lapsed domain)
ip         185.239.48.252           A record of dilloncriminallaw[.]com
ip         193.169.228.13           mail host (SmartApe OU, Russia)
hostname   meeting.sa[.]com         gate page host
ip         75.2.60.5                A record of meeting.sa[.]com
hostname   team.ru[.]com            Stage 2 host (per-org subdomain)
ip         196.251.70.198           A record of [org].team.ru[.]com
hostname   team.za[.]com            Stage 3 host
ip         38.146.28.241            A record of *.team.za[.]com subdomains


## Sources consulted

Tier 2:
  Sublime Security, "AITM phishing with Russian infrastructure and detection
  evasion from a lapsed domain", June 12, 2025
  https://sublime.security/blog/aitm-phishing-with-russian-infrastructure-and-detection-evasion-from-a-lapsed-domain/

Tier 1 needed:
  Stage 3 relay internals not described by Sublime. Search for Sekoia or
  Microsoft TI coverage of team.ru[.]com or team.za[.]com infrastructure
  to identify the Stage 3 kit family and ground aitm_tradecraft claims.


## Open questions

1. What kit powers Stage 3? Search URLScan for team.ru.com / team.za.com.
2. What appId targeted? Not stated. Likely OfficeHome
   (4765445b-32c6-49b0-83e6-1d93765276ca) but unconfirmed.
3. Post-auth actions? Not described; need IR write-up or tier_1 source.
4. Is meeting.sa[.]com a shared gate provider? Sublime: "seen in many
   previous phishing campaigns."
5. Stage 1 WebAssembly/Rust component: function unknown from this source.
6. Per-org team.ru[.]com subdomain pattern in URLScan/Shodan?
7. Stage 3 relay grounding gap (2026-05-19): Four ORKL searches for
   team.ru/team.za relay family and WebAssembly-obfuscated AiTM found no
   tier_1 or second tier_2 source. Grounding gap persists. Consider
   URLScan search for team.ru/team.za infrastructure or check Sekoia kit
   evolution coverage.
