export type Applicability =
  | 'observed'
  | 'supported'
  | 'unknown'
  | 'not-applicable';
export type EvidenceClass =
  | 'source-observed'
  | 'report-derived'
  | 'lab-observed'
  | 'analyst-inference';
export type KitProfile = {
  id: string;
  name: string;
  marker: string;
  color: string;
  delivery: string;
  mediation: string;
  sessionMaterial: string;
  operatorModel: string;
  evidenceMaturity: string;
};

export type KitProcedure = {
  kitId: string;
  applicability: Applicability;
  procedure: string;
  evidenceClass: EvidenceClass;
};

export type ConvergenceRecord = {
  id: string;
  phase: string;
  technique: string;
  mappingConfidence: 'high' | 'medium';
  reviewState: 'reviewed' | 'developing';
  invariant: string;
  difference: string;
  telemetry: string[];
  joinKeys: string;
  timeWindow: string;
  detectionOpportunity: string;
  falsePositiveBoundary: string;
  procedures: KitProcedure[];
};

export const kitProfiles: KitProfile[] = [
  {
    id: 'tycoon',
    name: 'Tycoon 2FA',
    marker: 'TYC',
    color: '#f85149',
    delivery: 'Link and redirect chain',
    mediation: 'Two-tier synchronous relay',
    sessionMaterial: 'Web session cookie',
    operatorModel: 'Affiliate service with separated egress',
    evidenceMaturity: 'Deep profile',
  },
  {
    id: 'bigbear',
    name: 'BigBear 2.0',
    marker: 'BIG',
    color: '#ff8d5c',
    delivery: 'Link and gated lure',
    mediation: 'Evilginx2-derived relay',
    sessionMaterial: 'Web session cookie',
    operatorModel: 'Managed affiliate infrastructure',
    evidenceMaturity: 'Evidence gathering',
  },
  {
    id: 'mamba',
    name: 'Mamba 2FA',
    marker: 'MAM',
    color: '#d29922',
    delivery: 'Link',
    mediation: 'Socket.IO command relay',
    sessionMaterial: 'Web session cookie',
    operatorModel: 'Interactive operator control',
    evidenceMaturity: 'Profiled',
  },
  {
    id: 'evilproxy',
    name: 'EvilProxy',
    marker: 'EVP',
    color: '#3fb950',
    delivery: 'Link and service subdomain',
    mediation: 'PhaaS reverse proxy',
    sessionMaterial: 'Web session cookie',
    operatorModel: 'Service dashboard and buyers',
    evidenceMaturity: 'Profiled',
  },
  {
    id: 'sneaky',
    name: 'Sneaky 2FA',
    marker: 'SNK',
    color: '#58a6ff',
    delivery: 'Attachment, link, and redirect chain',
    mediation: 'Synchronous relay',
    sessionMaterial: 'Web session cookie',
    operatorModel: 'Operator-controlled replay',
    evidenceMaturity: 'Source-observed field guide',
  },
  {
    id: 'device-code',
    name: 'Device Code',
    marker: 'DVC',
    color: '#bc8cff',
    delivery: 'Code and social-engineering prompt',
    mediation: 'Device authorization polling',
    sessionMaterial: 'OAuth access and refresh tokens',
    operatorModel: 'Polling client and token use',
    evidenceMaturity: 'Runnable behavior profile',
  },
];

const procedures = (
  values: Array<[string, Applicability, string, EvidenceClass?]>,
): KitProcedure[] =>
  values.map(
    ([kitId, applicability, procedure, evidenceClass = 'report-derived']) => ({
      kitId,
      applicability,
      procedure,
      evidenceClass,
    }),
  );

export const convergenceRecords: ConvergenceRecord[] = [
  {
    id: 'T1583.001',
    phase: 'Infrastructure setup',
    technique: 'Acquire Infrastructure: Domains',
    mappingConfidence: 'high',
    reviewState: 'reviewed',
    invariant:
      'A public route must bring the victim into the campaign-controlled delivery or mediation path.',
    difference:
      'Operators vary domain age, registrar, redirect depth, fronting, and whether the first visible host is attacker-controlled.',
    telemetry: [
      'Mail gateway URL',
      'Passive DNS',
      'Certificate transparency',
      'Proxy URL',
    ],
    joinKeys: 'FQDN · registrable domain · redirect destination',
    timeWindow: 'Campaign lifetime',
    detectionOpportunity:
      'Correlate newly observed delivery domains with identity-themed content and redirect relationships.',
    falsePositiveBoundary:
      'Domain age or hosting provider alone is contextual and must not be treated as malicious.',
    procedures: procedures([
      [
        'tycoon',
        'unknown',
        'Public reporting reviewed here does not establish a stable domain-acquisition procedure.',
      ],
      [
        'bigbear',
        'observed',
        'Campaign-controlled lure and relay domains support managed affiliate deployments.',
      ],
      [
        'mamba',
        'unknown',
        'No publication-eligible domain procedure is projected yet.',
      ],
      [
        'evilproxy',
        'observed',
        'Campaigns use service-generated authentication subdomains and tenant-specific routes.',
      ],
      [
        'sneaky',
        'observed',
        'Source-observed lure chains expose campaign-controlled redirect and landing hosts.',
        'source-observed',
      ],
      [
        'device-code',
        'not-applicable',
        'The authorization endpoint can remain the legitimate identity provider; attacker domains are not required.',
      ],
    ]),
  },
  {
    id: 'T1566.002',
    phase: 'Lure delivery',
    technique: 'Phishing: Spearphishing Link',
    mappingConfidence: 'high',
    reviewState: 'reviewed',
    invariant:
      'The victim must receive or reach an instruction that initiates the attacker-selected authentication path.',
    difference:
      'The first hop may be a direct URL, attachment-carried URL, redirector, QR code, or a device-code instruction.',
    telemetry: [
      'Mail gateway',
      'Teams audit',
      'Secure web gateway',
      'Browser history',
    ],
    joinKeys: 'Recipient · message ID · expanded URL · timestamp',
    timeWindow: '0–30 minutes',
    detectionOpportunity:
      'Join the delivered artifact to the expanded redirect chain and the first identity event.',
    falsePositiveBoundary:
      'Legitimate marketing redirects and identity notifications create similar individual signals.',
    procedures: procedures([
      [
        'tycoon',
        'observed',
        'Campaign delivery routes the victim toward a Microsoft-themed authentication flow.',
      ],
      [
        'bigbear',
        'observed',
        'Affiliate lure links direct victims through campaign-controlled qualification and relay infrastructure.',
      ],
      [
        'mamba',
        'observed',
        'A phishing link opens the real-time operator-controlled sign-in sequence.',
      ],
      [
        'evilproxy',
        'observed',
        'Service-generated links route victims into tenant-specific proxy sessions.',
      ],
      [
        'sneaky',
        'observed',
        'Observed samples use attachment and redirect chains to reach the lure.',
        'source-observed',
      ],
      [
        'device-code',
        'unknown',
        'Device-code campaigns require delivery, but a spearphishing link is variant-dependent.',
      ],
    ]),
  },
  {
    id: 'T1557',
    phase: 'Authentication mediation',
    technique: 'Adversary-in-the-Middle',
    mappingConfidence: 'high',
    reviewState: 'reviewed',
    invariant:
      'Reverse-proxy variants mediate the victim and identity provider in real time.',
    difference:
      'The relay may be synchronous HTTP, WebSocket/Socket.IO controlled, or split across capture and operator tiers.',
    telemetry: [
      'Proxy transaction',
      'TLS metadata',
      'Identity sign-in',
      'Sandbox HAR',
    ],
    joinKeys: 'UPN · session correlation ID · source IP · user agent',
    timeWindow: '0–10 minutes',
    detectionOpportunity:
      'Correlate browser-side relay characteristics with identity events that cross source, ASN, or user-agent boundaries.',
    falsePositiveBoundary:
      'Corporate proxies and security gateways legitimately mediate traffic; identity and sequence context are required.',
    procedures: procedures([
      [
        'tycoon',
        'observed',
        'A two-tier relay brokers the Microsoft authentication exchange.',
      ],
      [
        'bigbear',
        'observed',
        'An Evilginx2-derived reverse proxy relays the victim session.',
      ],
      [
        'mamba',
        'observed',
        'Socket.IO commands synchronize victim prompts with operator actions.',
      ],
      [
        'evilproxy',
        'observed',
        'The hosted service reverse-proxies supported identity providers.',
      ],
      [
        'sneaky',
        'observed',
        'The relay carries authentication state between the victim browser and Microsoft.',
        'source-observed',
      ],
      [
        'device-code',
        'not-applicable',
        'The victim authenticates directly to the legitimate identity provider; polling replaces reverse-proxy mediation.',
      ],
    ]),
  },
  {
    id: 'T1539',
    phase: 'Credential or session acquisition',
    technique: 'Steal Web Session Cookie',
    mappingConfidence: 'high',
    reviewState: 'reviewed',
    invariant:
      'Successful reverse-proxy kits obtain reusable authenticated session material after the victim satisfies authentication.',
    difference:
      'Extraction rules, cookie sets, transport to the panel, and operator handoff vary by kit and IdP.',
    telemetry: [
      'Identity sign-in',
      'Browser HAR',
      'Proxy HTTP',
      'Session protection signal',
    ],
    joinKeys: 'UPN · session ID · IP · user agent · resource',
    timeWindow: '0–20 minutes',
    detectionOpportunity:
      'Detect session continuity that survives a source, ASN, user-agent, or device-context transition.',
    falsePositiveBoundary:
      'Mobile networks, VPN changes, and shared egress can produce benign source transitions.',
    procedures: procedures([
      [
        'tycoon',
        'observed',
        'The relay returns authenticated session material for later use.',
      ],
      [
        'bigbear',
        'observed',
        'Captured cookies are forwarded through the affiliate workflow.',
      ],
      [
        'mamba',
        'observed',
        'The real-time relay captures the authenticated browser session.',
      ],
      [
        'evilproxy',
        'observed',
        'The service exposes captured session cookies to the buyer workflow.',
      ],
      [
        'sneaky',
        'observed',
        'Observed relay behavior returns session material after authentication.',
        'source-observed',
      ],
      [
        'device-code',
        'not-applicable',
        'Device authorization yields OAuth tokens rather than a proxied browser session cookie.',
      ],
    ]),
  },
  {
    id: 'T1528',
    phase: 'Credential or session acquisition',
    technique: 'Steal Application Access Token',
    mappingConfidence: 'medium',
    reviewState: 'reviewed',
    invariant:
      'Device-authorization variants obtain an application token after the victim completes the legitimate authorization flow.',
    difference:
      'Requested client, resource, scopes, polling behavior, and downstream token exchange vary by campaign.',
    telemetry: ['Entra sign-in', 'Service principal audit', 'Graph activity'],
    joinKeys: 'UPN · client ID · resource · correlation ID',
    timeWindow: 'Authorization lifetime',
    detectionOpportunity:
      'Correlate device authorization with an unfamiliar client, resource, source, or subsequent Graph access.',
    falsePositiveBoundary:
      'Device authorization is a legitimate flow used by constrained-input applications.',
    procedures: procedures([
      [
        'tycoon',
        'unknown',
        'No reviewed evidence maps this kit to application-token theft.',
      ],
      [
        'bigbear',
        'unknown',
        'No reviewed evidence maps this kit to application-token theft.',
      ],
      [
        'mamba',
        'unknown',
        'No reviewed evidence maps this kit to application-token theft.',
      ],
      [
        'evilproxy',
        'supported',
        'Service variants can target OAuth-backed identity flows; exact token procedure remains deployment-specific.',
      ],
      [
        'sneaky',
        'unknown',
        'No publication-eligible application-token procedure is projected yet.',
      ],
      [
        'device-code',
        'observed',
        'The polling client receives OAuth access and refresh tokens after victim authorization.',
        'lab-observed',
      ],
    ]),
  },
  {
    id: 'T1078.004',
    phase: 'Session or token use',
    technique: 'Valid Accounts: Cloud Accounts',
    mappingConfidence: 'high',
    reviewState: 'reviewed',
    invariant:
      'Stolen session or token material is used against the real cloud control plane as the victim identity.',
    difference:
      'Reverse-proxy variants reuse browser state while device-code variants use OAuth tokens at browser or API surfaces.',
    telemetry: ['Entra sign-in', 'UAL', 'Graph audit', 'Exchange audit'],
    joinKeys: 'UPN · session ID · token/client ID · resource · source IP',
    timeWindow: '0–60 minutes',
    detectionOpportunity:
      'Join the authentication event to the first cloud action and detect abrupt changes in source, client, resource, or device context.',
    falsePositiveBoundary:
      'Travel, VPNs, automation, and legitimate client changes require user and tenant baselining.',
    procedures: procedures([
      [
        'tycoon',
        'observed',
        'Captured session material is used against Microsoft cloud workloads.',
      ],
      [
        'bigbear',
        'supported',
        'Automated or operator-driven cookie use enters the victim cloud account.',
      ],
      [
        'mamba',
        'unknown',
        'The projected evidence establishes capture but not a stable post-capture procedure.',
      ],
      [
        'evilproxy',
        'observed',
        'Buyer workflows use captured sessions against the target cloud account.',
      ],
      [
        'sneaky',
        'observed',
        'Session use reaches Microsoft cloud resources after relay completion.',
        'source-observed',
      ],
      [
        'device-code',
        'observed',
        'OAuth tokens are used against the authorized cloud resource.',
        'lab-observed',
      ],
    ]),
  },
  {
    id: 'T1098.005',
    phase: 'Objectives and persistence',
    technique: 'Account Manipulation: Device Registration',
    mappingConfidence: 'medium',
    reviewState: 'developing',
    invariant:
      'Some operators convert initial access into a more durable identity foothold.',
    difference:
      'The objective may be device registration, OAuth consent, mailbox rules, or no persistence action at all.',
    telemetry: ['Entra audit', 'Entra sign-in', 'UAL'],
    joinKeys: 'UPN · device ID · actor IP · correlation ID',
    timeWindow: '0–60 minutes after initial access',
    detectionOpportunity:
      'Correlate first-seen device registration or trust changes with the preceding suspicious session.',
    falsePositiveBoundary:
      'Normal enrollment and help-desk recovery workflows create similar audit events.',
    procedures: procedures([
      [
        'tycoon',
        'supported',
        'Post-authentication reporting includes device-oriented persistence behavior.',
      ],
      [
        'bigbear',
        'unknown',
        'No publication-eligible device-registration procedure is projected yet.',
      ],
      [
        'mamba',
        'unknown',
        'No publication-eligible device-registration procedure is projected yet.',
      ],
      [
        'evilproxy',
        'unknown',
        'Post-access activity depends on the buyer and target.',
      ],
      [
        'sneaky',
        'unknown',
        'No publication-eligible device-registration procedure is projected yet.',
      ],
      [
        'device-code',
        'supported',
        'A token-bearing session can be followed by device registration when permissions and policy allow.',
      ],
    ]),
  },
];

export const lifecyclePhases = [
  'Infrastructure setup',
  'Lure delivery',
  'Authentication mediation',
  'Credential or session acquisition',
  'Session or token use',
  'Objectives and persistence',
];
