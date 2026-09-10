export type FeaturedAtomic = {
  slug: string;
  technique: string;
  title: string;
  kicker: string;
  evidence: 'source-backed' | 'locally observed';
  confidence: 'high' | 'medium';
  fidelity: 'partial' | 'strong';
  reviewed: string;
  summary: string;
  why: string;
  command: string;
  telemetry: { source: string; signals: string[]; window: string }[];
  detection: string;
  limitations: string[];
  sources: { label: string; url: string }[];
  chokepoint: { label: string; url: string };
};

export const featuredAtomics: FeaturedAtomic[] = [
  {
    slug: 'T1078.004-suspicious-ua-signin',
    technique: 'T1078.004',
    title: 'Node.js relay user-agent sign-in',
    kicker: 'AITM WEBSOCKET RELAY // STAGE 1',
    evidence: 'source-backed', confidence: 'high', fidelity: 'partial', reviewed: '2026-08-30',
    summary: 'Exercises the identity-side artifact produced when a server-side relay authenticates to Microsoft with a Node.js HTTP client user-agent.',
    why: 'A synchronous relay must make its own upstream request. When the kit leaks axios, undici, or node-fetch into Entra telemetry, defenders gain a server-side signal that survives lure and domain rotation.',
    command: "Invoke-Tacklebox -Atomic T1078.004-suspicious-ua-signin -Validate -InputArgs @{\n  tenant_id  = $env:TACKLEBOX_TENANT_ID\n  user_agent = 'axios/1.15.2'\n}",
    telemetry: [{ source: 'Entra sign-in logs', signals: ['Successful sign-in', 'userAgent contains axios/1.15.2', 'High-value Microsoft application context'], window: '10 minutes' }],
    detection: 'Correlate the Node.js user-agent with a cloud/VPS ASN and a later sign-in for the same UPN from residential egress. The user-agent alone is a hunt signal, not a kit verdict.',
    limitations: ['Does not operate a WebSocket or reverse-proxy relay.', 'Default YAML user-agent is python-requests; the axios override is required.', 'A single atomic cannot reproduce the two-tier ASN sequence.'],
    sources: [{ label: 'Elastic Security Labs — Tycoon 2FA detection engineering', url: 'https://www.elastic.co/security-labs/tycoon-2fa-aitm-detection-engineering' }],
    chokepoint: { label: 'AiTM WebSocket relay', url: 'https://iimp0ster.github.io/detection-chokepoints/chokepoints/aitm-websocket-relay/' },
  },
  {
    slug: 'T1078.004-device-code',
    technique: 'T1078.004',
    title: 'Device code with MAB client ID',
    kicker: 'OAUTH DEVICE CODE PHISHING',
    evidence: 'source-backed', confidence: 'high', fidelity: 'partial', reviewed: '2026-08-30',
    summary: 'Runs the device-code flow against a labeled Entra lab tenant while pinning the Microsoft Authentication Broker client used by documented AiTM variants.',
    why: 'The victim completes legitimate authentication and MFA on Microsoft infrastructure while the polling client receives the token. The protocol and client application become the durable identity-side evidence.',
    command: "Invoke-Tacklebox -Atomic T1078.004-device-code -Validate -InputArgs @{\n  tenant_id = $env:TACKLEBOX_TENANT_ID\n  client_id = '29d9ed98-a469-4536-ade2-f981bc1d605e'\n}",
    telemetry: [{ source: 'Entra sign-in logs', signals: ['authenticationProtocol = deviceCode', 'appId = 29d9ed98-a469-4536-ade2-f981bc1d605e', 'Interactive success'], window: '15 minutes' }],
    detection: 'Treat deviceCode plus the MAB application ID as the analyst-tier pin. Azure CLI and legitimate device onboarding can also use device code, so tenant context and user intent still matter.',
    limitations: ['The promoted atomic defaults to the Azure CLI client ID; the MAB override is required.', 'This is not a reverse-proxy AiTM flow.', 'A lab user must complete the interactive redemption step.'],
    sources: [{ label: 'Dirk-jan Mollema — phishing for Entra PRTs', url: 'https://dirkjanm.io/phishing-for-microsoft-entra-primary-refresh-tokens/' }, { label: 'AADInternals — AiTM and device identity', url: 'https://aadinternals.com/post/aitm/' }],
    chokepoint: { label: 'OAuth device-code phishing', url: 'https://iimp0ster.github.io/detection-chokepoints/chokepoints/oauth-device-code-phishing/' },
  },
  {
    slug: 'T1087.004-graph-enumeration',
    technique: 'T1087.004',
    title: 'Graph reconnaissance burst',
    kicker: 'POST-CAPTURE DISCOVERY',
    evidence: 'source-backed', confidence: 'high', fidelity: 'partial', reviewed: '2026-08-30',
    summary: 'Uses a lab Graph token to enumerate identity objects and generate a compact discovery sequence defenders can correlate after token capture.',
    why: 'Operators need role, tenant, mailbox, contact, and licensing context before choosing targets. The convergence is temporal: many Graph categories queried by one identity in a short window.',
    command: 'Invoke-Tacklebox -Atomic T1087.004-graph-enumeration -Validate',
    telemetry: [{ source: 'Microsoft Graph directory audit', signals: ['List users', 'List groups', 'Directory role enumeration'], window: '20 minutes' }],
    detection: 'The live chokepoint expects at least four endpoint categories within 60 seconds. Use source IP, app ID, and user context for correlation; c_sid is not the Entra user object ID.',
    limitations: ['The promoted atomic covers roughly three categories.', 'The five-category Tycoon draft is stronger but not yet promoted.', 'Directory audit alone may not represent every Graph read endpoint.'],
    sources: [{ label: 'CISA AA23-093A — BEC reconnaissance behavior', url: 'https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-093a' }, { label: 'Elastic Security Labs — five-category burst', url: 'https://www.elastic.co/security-labs/tycoon-2fa-aitm-detection-engineering' }],
    chokepoint: { label: 'Graph API recon burst', url: 'https://iimp0ster.github.io/detection-chokepoints/chokepoints/graph-api-recon-burst/' },
  },
  {
    slug: 'T1098.005-device-registration-prt',
    technique: 'T1098.005',
    title: 'Device registration and PRT persistence',
    kicker: 'DEVICE IDENTITY PERSISTENCE',
    evidence: 'source-backed', confidence: 'high', fidelity: 'partial', reviewed: '2026-08-30',
    summary: 'Registers a synthetic device in a controlled tenant, requests a PRT, and makes the incident-response dependency on device deletion visible.',
    why: 'A device-bound identity can outlive a password reset or session revocation. The device registration is the prerequisite defenders can observe and responders must remove.',
    command: 'Invoke-Tacklebox -Atomic T1098.005-device-registration-prt -Validate',
    telemetry: [{ source: 'Microsoft Graph directory audit', signals: ['activityDisplayName = Register device', 'Synthetic lab device name'], window: '10 minutes' }, { source: 'Entra sign-in logs', signals: ['Device-code authentication in the acquisition chain', 'Subsequent PRT-backed activity'], window: '15 minutes' }],
    detection: 'Prioritize DRS registration from a non-native HTTP user-agent, then correlate PRT-backed activity after the registration. Response ordering matters: disable, delete devices, revoke sessions, reset credentials.',
    limitations: ['The axios user-agent override is not wired into the promoted atomic.', 'The revoke-survive negative test remains manual.', 'Cleanup requires successful device deletion.'],
    sources: [{ label: 'AADInternals — Primary Refresh Token internals', url: 'https://aadinternals.com/post/prt/' }, { label: 'Dirk-jan Mollema — Azure AD SSO and token flows', url: 'https://dirkjanm.io/abusing-azure-ad-sso-with-the-on-behalf-of-flow/' }],
    chokepoint: { label: 'AiTM device PRT enrollment', url: 'https://iimp0ster.github.io/detection-chokepoints/chokepoints/aitm-device-prt-enrollment/' },
  },
];

export const featuredBySlug = Object.fromEntries(featuredAtomics.map((item) => [item.slug, item]));

export const tycoonDossier = {
  slug: 'tycoon-2fa',
  title: 'Tycoon 2FA',
  aliases: ['Tycoon2FA', 'Storm-1747 (hypothesis; attribution remains source-dependent)'],
  model: 'Synchronous reverse-proxy phishing-as-a-service',
  reviewed: '2026-08-30',
  evidence: 'source-backed',
  confidence: 'high',
  summary: 'A relay-centered AiTM service whose durable value to defenders comes from shared-code artifacts, Microsoft application choices, server-side user-agents, and the timing gap between relay and operator activity.',
  chain: [
    { id: 'T1539', label: 'Relay and capture', detail: 'Victim authentication is proxied; session material returns through the relay.' },
    { id: 'T1550.001', label: 'Resource pivot', detail: 'Refresh material is exchanged for additional Microsoft cloud resources.' },
    { id: 'T1098.005', label: 'Device identity', detail: 'Variants register a synthetic device and pursue PRT-backed persistence.' },
    { id: 'T1087.004', label: 'Graph recon', detail: 'The operator compresses identity and tenant discovery into a short burst.' },
    { id: 'T1114', label: 'Mailbox action', detail: 'Mailbox access and rule creation support BEC follow-on activity.' },
  ],
  fingerprints: [
    { value: 'recieveid', type: 'JavaScript artifact', confidence: 'high', stability: 'durable', note: 'Misspelled Socket.IO event retained across observed variants.' },
    { value: 'axios/1.15.2 · node-fetch/1.0 · undici', type: 'Relay user-agent', confidence: 'high', stability: 'volatile', note: 'Server-side HTTP client strings visible in identity telemetry.' },
    { value: '4765445b-32c6-49b0-83e6-1d93765276ca', type: 'OfficeHome app ID', confidence: 'high', stability: 'durable', note: 'Shared with other relay kits; useful only in combination.' },
    { value: 'AS9009 · AS29802', type: 'Tier-1 relay context', confidence: 'low', stability: 'volatile', note: 'Enrichment only. Never identify a kit from ASN alone.' },
  ],
  coverage: [
    { label: 'Relay Node.js UA', atomic: 'T1078.004-suspicious-ua-signin', fidelity: 'partial' },
    { label: 'MAB device-code variant', atomic: 'T1078.004-device-code', fidelity: 'partial' },
    { label: 'Graph recon burst', atomic: 'T1087.004-graph-enumeration', fidelity: 'partial → strong in draft' },
    { label: 'Device registration + PRT', atomic: 'T1098.005-device-registration-prt', fidelity: 'partial' },
    { label: 'Mailbox item access', atomic: 'T1114.002-mail-items-accessed', fidelity: 'strong' },
    { label: 'Inbox rule persistence', atomic: 'T1114.003-email-rules-exfil', fidelity: 'strong' },
  ],
  sources: [
    { label: 'Sekoia — global analysis of AiTM phishing threats', url: 'https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/' },
    { label: 'Sekoia — Tycoon 2FA in-depth analysis', url: 'https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/' },
    { label: 'Elastic Security Labs — Tycoon 2FA detection engineering', url: 'https://www.elastic.co/security-labs/tycoon-2fa-aitm-detection-engineering' },
  ],
};
