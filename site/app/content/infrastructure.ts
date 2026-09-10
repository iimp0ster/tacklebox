export type EvidenceClass =
  | 'source-observed'
  | 'report-derived'
  | 'analyst-inference'
  | 'platform-owned';

export type InfraEvidence = {
  class: EvidenceClass;
  confidence: 'high' | 'medium' | 'low';
  scope: string;
  validation: 'source-reviewed' | 'lab-validated' | 'model-only';
};

export type InfraNode = {
  id: string;
  step: string;
  plane: 'delivery' | 'relay' | 'identity' | 'workload' | 'operator';
  title: string;
  role: string;
  summary: string;
  evidence: InfraEvidence;
  vantage: string;
  telemetry: string[];
  markers: string[];
  caveat: string;
};

export const sneakyInfraNodes: InfraNode[] = [
  {
    id: 'delivery',
    step: '01',
    plane: 'delivery',
    title: 'Lure + redirector',
    role: 'Delivery',
    summary:
      'A link, attachment, or redirect chain moves the target toward attacker-controlled web infrastructure.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Sneaky 2FA public lure case',
      validation: 'source-reviewed',
    },
    vantage: 'Mail gateway · secure web gateway · passive URL archive',
    telemetry: [
      'Redirect chain and referring URL',
      'Domain age and hosting transition',
      'Attachment-to-URL relationship',
    ],
    markers: [
      'Short-lived hostnames',
      'Off-domain redirects',
      'Campaign-specific path structure',
    ],
    caveat: 'A redirect or young domain is context, not kit attribution.',
  },
  {
    id: 'gate',
    step: '02',
    plane: 'delivery',
    title: 'Anti-analysis gate',
    role: 'Qualification',
    summary:
      'CAPTCHA and browser checks attempt to admit intended victims while suppressing automated analysis.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Sneaky 2FA public lure and code analysis',
      validation: 'source-reviewed',
    },
    vantage: 'Browser telemetry · proxy capture · historical page scan',
    telemetry: [
      'DOM and script resources',
      'Challenge provider requests',
      'Browser capability checks',
    ],
    markers: [
      'CAPTCHA choreography',
      'Automation checks',
      'Conditional blank or decoy page',
    ],
    caveat:
      'Common challenge providers are shared services; require a second kit-specific artifact.',
  },
  {
    id: 'relay',
    step: '03',
    plane: 'relay',
    title: 'Tier-1 AiTM relay',
    role: 'Proxy + capture',
    summary:
      'The attacker-controlled relay maintains victim state and sends its own upstream requests to Microsoft.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Sneaky 2FA technical analysis',
      validation: 'source-reviewed',
    },
    vantage: 'Passive HTTP service data · web archive · Entra sign-in logs',
    telemetry: [
      'HTTP body or resource identity',
      'WebSocket or Socket.IO behavior',
      'Server-side HTTP client user-agent',
    ],
    markers: [
      'Non-generic script artifact tuple',
      'Relay route structure',
      'Node.js client behavior',
    ],
    caveat:
      'Hosting provider or ASN is enrichment only. Promote a cluster only after two compatible artifacts agree.',
  },
  {
    id: 'identity',
    step: '04',
    plane: 'identity',
    title: 'Microsoft identity',
    role: 'Authentication authority',
    summary:
      'The legitimate identity provider completes authentication, applies policy, and issues session material.',
    evidence: {
      class: 'platform-owned',
      confidence: 'high',
      scope: 'Microsoft Entra authentication control plane',
      validation: 'source-reviewed',
    },
    vantage: 'Entra sign-in logs · Conditional Access · token telemetry',
    telemetry: [
      'Application and protocol',
      'User-agent, IP, ASN, and device context',
      'MFA and Conditional Access result',
    ],
    markers: [
      'Successful interactive authentication',
      'Application choice',
      'Context mismatch across sign-ins',
    ],
    caveat:
      'This is a shared service, never attacker infrastructure. It is the highest-value defensive observation point.',
  },
  {
    id: 'session',
    step: '05',
    plane: 'relay',
    title: 'Session boundary',
    role: 'Token return',
    summary:
      'Authenticated cookies or refresh material cross back through the relay and become reusable by the operator.',
    evidence: {
      class: 'report-derived',
      confidence: 'high',
      scope: 'Sneaky 2FA capability described in technical analysis',
      validation: 'source-reviewed',
    },
    vantage: 'Identity telemetry · proxy capture · token protection controls',
    telemetry: [
      'Authentication protocol transitions',
      'Resource or client-family token exchange',
      'New context using the same identity',
    ],
    markers: [
      'Relay-to-operator time gap',
      'Resource pivot',
      'Browser/session context discontinuity',
    ],
    caveat:
      'Tacklebox does not deploy a credential-capturing relay; lab atomics substitute controlled session material.',
  },
  {
    id: 'operator',
    step: '06',
    plane: 'operator',
    title: 'Tier-2 operator egress',
    role: 'Hands-on use',
    summary:
      'A separate browser or residential exit often uses the captured identity minutes after the relay event.',
    evidence: {
      class: 'analyst-inference',
      confidence: 'medium',
      scope: 'Cross-kit replay model; not observed in the public lure case',
      validation: 'model-only',
    },
    vantage: 'Entra sign-in logs · IP enrichment · session correlation',
    telemetry: [
      'Same UPN across infrastructure classes',
      'User-agent and geography change',
      'Ten-to-twenty-minute transition',
    ],
    markers: [
      'Residential or ISP egress',
      'Interactive browser context',
      'Temporal link to Tier-1 relay',
    ],
    caveat:
      'Residential networks are highly shared. The correlation sequence—not the provider—is the durable signal.',
  },
  {
    id: 'postauth',
    step: '07',
    plane: 'operator',
    title: 'Post-auth cloud activity',
    role: 'Discovery + persistence',
    summary:
      'The operator enumerates the tenant and may access mail, create rules, or register a device identity.',
    evidence: {
      class: 'analyst-inference',
      confidence: 'medium',
      scope: 'Cross-kit post-compromise model; validate per incident',
      validation: 'model-only',
    },
    vantage: 'Graph directory audit · Unified Audit Log · Entra sign-in logs',
    telemetry: [
      'Graph category burst',
      'Mailbox item access and rule changes',
      'Device registration and PRT-backed activity',
    ],
    markers: [
      'Machine-speed discovery',
      'Cross-service token use',
      'Persistence after session revocation',
    ],
    caveat:
      'Individual administrative actions can be legitimate. Preserve the preceding authentication sequence.',
  },
  {
    id: 'workloads',
    step: '08',
    plane: 'workload',
    title: 'Microsoft 365 workloads',
    role: 'Cloud service targets',
    summary:
      'Graph, Exchange, and other Microsoft 365 services receive authorized operations after authentication.',
    evidence: {
      class: 'platform-owned',
      confidence: 'high',
      scope: 'Microsoft 365 workload control plane',
      validation: 'source-reviewed',
    },
    vantage: 'Unified Audit Log · Graph audit · Exchange audit',
    telemetry: [
      'Workload and operation name',
      'Account, application, and resource audience',
      'Result and workload timestamp',
    ],
    markers: [
      'Directory enumeration',
      'Mailbox access or rule changes',
      'Cross-service session use',
    ],
    caveat:
      'These are legitimate shared services. Suspicion comes from correlation to the preceding authentication transition, not the workload alone.',
  },
];

export type InfraRelation = {
  id: string;
  from: string;
  to: string;
  label: string;
  kind: 'delivery' | 'authentication' | 'capture' | 'operation';
  path: string;
  labelX: number;
  labelY: number;
  requirement: 'required' | 'optional' | 'alternative';
  temporalRelationship: 'before' | 'after' | 'concurrent' | 'unordered';
  evidence: InfraEvidence;
  data: {
    eventClass: string;
    values: string[];
    direction: string;
    source: string;
    visibility: string;
    joinKeys: string[];
    correlation: string;
    boundary: string;
  };
};

export type AttackTrace = {
  id: string;
  label: string;
  subjectScope: string;
  steps: { edgeId: string; order: number; condition?: string }[];
};

export const sneakyInfraRelations: InfraRelation[] = [
  {
    id: 'r1',
    from: 'delivery',
    to: 'gate',
    label: 'redirects to',
    kind: 'delivery',
    path: 'M 130 170 L 275 112',
    labelX: 198,
    labelY: 125,
    requirement: 'required',
    temporalRelationship: 'before',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Sneaky 2FA public lure case',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: '302 + redirect context',
      values: [
        'Tracking URL',
        'Location target',
        'Referrer',
        'Observation time',
      ],
      direction: 'Victim browser → compromised redirect page',
      source: 'Zeltoc public sandbox case',
      visibility:
        'Mail gateway · secure web gateway · browser history · sandbox HAR',
      joinKeys: ['message or attachment', 'expanded URL', 'timestamp'],
      correlation:
        'Join the message/attachment to the expanded redirect chain and timestamp.',
      boundary:
        'HubSpot is legitimate shared infrastructure; the tenant/path relationship is evidence, not the platform itself.',
    },
  },
  {
    id: 'r2',
    from: 'gate',
    to: 'relay',
    label: 'admits victim',
    kind: 'delivery',
    path: 'M 335 120 L 485 200',
    labelX: 408,
    labelY: 145,
    requirement: 'required',
    temporalRelationship: 'after',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Sneaky 2FA public lure and code analysis',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Challenge state + route',
      values: [
        'cf-turnstile-response=[redacted]',
        '/[150-character-id]/index',
        '/verify',
      ],
      direction: 'Victim browser → Sneaky qualification and sign-in routes',
      source: 'Sekoia code analysis + Zeltoc sandbox case',
      visibility: 'Proxy URL logs · browser HAR · historical page capture',
      joinKeys: ['challenge response', 'route tuple', 'observation time'],
      correlation:
        'Require challenge choreography plus the long route or reported DOM residue.',
      boundary:
        'Turnstile is a legitimate shared service and cannot identify Sneaky 2FA alone.',
    },
  },
  {
    id: 'r3',
    from: 'relay',
    to: 'identity',
    label: 'proxies authentication',
    kind: 'authentication',
    path: 'M 550 195 C 650 120, 710 100, 785 108',
    labelX: 650,
    labelY: 118,
    requirement: 'required',
    temporalRelationship: 'after',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Sneaky 2FA source-code and telemetry analysis',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Identity + authentication state',
      values: [
        'POST /login',
        'POST /SAS/BeginAuth',
        'correlation ID',
        'rotating hardcoded user-agent',
      ],
      direction: 'Sneaky relay server → Microsoft identity API',
      source: 'Sekoia source-code and telemetry analysis',
      visibility:
        'Entra authentication events · sign-in logs · lab proxy capture',
      joinKeys: ['identity', 'correlation ID', 'event time'],
      correlation:
        'Join the relay-side em + pa POST to the same user/time as /login and SAS events in Entra.',
      boundary:
        'The victim fields and upstream API body are different protocol records; correlate identity and time rather than assuming byte-for-byte forwarding.',
    },
  },
  {
    id: 'r4',
    from: 'identity',
    to: 'session',
    label: 'issues session',
    kind: 'authentication',
    path: 'M 820 135 L 765 292',
    labelX: 810,
    labelY: 216,
    requirement: 'required',
    temporalRelationship: 'after',
    evidence: {
      class: 'report-derived',
      confidence: 'high',
      scope: 'Sneaky 2FA technical analysis; response values omitted',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'MFA result + session response',
      values: [
        'SAS completion state',
        'KMSI response',
        'authentication cookies',
      ],
      direction: 'Microsoft identity API → relay-controlled session boundary',
      source: 'Sekoia Sneaky 2FA technical analysis',
      visibility:
        'Identity-provider telemetry · controlled-lab TLS proxy · token protection controls',
      joinKeys: ['correlation ID', 'application', 'issuance time'],
      correlation:
        'Preserve correlation ID, request type, application, MFA result, and issuance time.',
      boundary:
        'Public sources establish the capability, but do not expose a reusable cookie value or a complete production response body.',
    },
  },
  {
    id: 'r5',
    from: 'session',
    to: 'relay',
    label: 'returns through',
    kind: 'capture',
    path: 'M 720 315 C 650 285, 620 250, 555 225',
    labelX: 642,
    labelY: 282,
    requirement: 'required',
    temporalRelationship: 'after',
    evidence: {
      class: 'report-derived',
      confidence: 'high',
      scope: 'Sneaky 2FA source-code analysis; session values omitted',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Session material + completion state',
      values: ['Set-Cookie class', 'poll status', 'final redirect state'],
      direction: 'Session boundary → Sneaky relay state store',
      source: 'Sekoia source-code analysis',
      visibility:
        'Controlled-lab relay logs · TLS inspection in an authorized range · identity telemetry',
      joinKeys: ['issuance time', 'poll status', 'final redirect state'],
      correlation:
        'Link issuance time to the victim page polling /validate and the final redirect.',
      boundary:
        'The public site names data classes only. No cookie, token, secret, or capture payload is retained or rendered.',
    },
  },
  {
    id: 'r6',
    from: 'session',
    to: 'operator',
    label: 'reused by',
    kind: 'capture',
    path: 'M 720 350 C 650 390, 585 420, 520 435',
    labelX: 618,
    labelY: 399,
    requirement: 'optional',
    temporalRelationship: 'after',
    evidence: {
      class: 'analyst-inference',
      confidence: 'medium',
      scope: 'Cross-kit replay model; not observed in the public lure case',
      validation: 'model-only',
    },
    data: {
      eventClass: 'Reusable authenticated session',
      values: ['Session-cookie class', 'account binding', 'issuance time'],
      direction: 'Relay session store → operator-controlled browser context',
      source:
        'Sneaky 2FA capability claim; payload not exposed in the public case',
      visibility:
        'Entra sign-in/session telemetry · token protection · controlled BAS receipts',
      joinKeys: ['identity', 'issuance time', 'network or device change'],
      correlation:
        'Look for the same identity moving from relay infrastructure to a new browser/IP context after issuance.',
      boundary:
        'A redirect or successful MFA event does not prove this transfer. Require replay telemetry or controlled-lab evidence.',
    },
  },
  {
    id: 'r7',
    from: 'operator',
    to: 'postauth',
    label: 'drives',
    kind: 'operation',
    path: 'M 520 470 C 620 495, 690 520, 765 548',
    labelX: 640,
    labelY: 505,
    requirement: 'optional',
    temporalRelationship: 'after',
    evidence: {
      class: 'analyst-inference',
      confidence: 'medium',
      scope:
        'Cross-kit post-compromise model; not observed in the public lure case',
      validation: 'model-only',
    },
    data: {
      eventClass: 'Token-backed cloud actions',
      values: ['Graph requests', 'mailbox access', 'rule/device changes'],
      direction: 'Operator session → Microsoft 365 workloads',
      source:
        'Cross-kit defender model; not observed in the Zeltoc public case',
      visibility:
        'Unified Audit Log · Graph audit · Exchange audit · workload logs',
      joinKeys: ['account', 'session context', 'operation time'],
      correlation:
        'Sequence machine-speed discovery or persistence after the suspicious authentication transition.',
      boundary:
        'These actions are possible post-compromise outcomes, not claims about the documented lure victim.',
    },
  },
  {
    id: 'r8',
    from: 'operator',
    to: 'identity',
    label: 'new sign-in context',
    kind: 'operation',
    path: 'M 475 420 C 500 240, 635 160, 785 120',
    labelX: 555,
    labelY: 242,
    requirement: 'optional',
    temporalRelationship: 'after',
    evidence: {
      class: 'analyst-inference',
      confidence: 'medium',
      scope:
        'Generic AiTM replay model; no victim replay trace in the public case',
      validation: 'model-only',
    },
    data: {
      eventClass: 'Cookie-bearing browser session',
      values: [
        'Authenticated session context',
        'new IP/ASN class',
        'new user-agent',
      ],
      direction: 'Operator browser → Microsoft identity/session service',
      source: 'AiTM replay model; no victim replay trace in the public case',
      visibility:
        'Entra sign-in logs · session telemetry · IP/device enrichment',
      joinKeys: ['identity', 'application', 'issuance or replay time'],
      correlation:
        'Join on identity, application, issuance/replay time, and a discontinuity in network or device context.',
      boundary:
        'Shared residential hosting and ordinary travel are not proof; the preceding relay sequence is required.',
    },
  },
  {
    id: 'r9',
    from: 'postauth',
    to: 'workloads',
    label: 'calls cloud APIs',
    kind: 'operation',
    path: 'M 815 530 C 875 520, 900 480, 910 430',
    labelX: 872,
    labelY: 482,
    requirement: 'optional',
    temporalRelationship: 'after',
    evidence: {
      class: 'analyst-inference',
      confidence: 'medium',
      scope: 'Cross-kit defender model; validate independently per incident',
      validation: 'model-only',
    },
    data: {
      eventClass: 'Bearer-authorized API requests',
      values: [
        'Resource audience',
        'operation name',
        'result',
        'workload timestamp',
      ],
      direction:
        'Compromised session → Graph, Exchange, and Microsoft 365 APIs',
      source: 'Cross-kit defender model; validate independently per incident',
      visibility:
        'UAL · Graph directory audit · Exchange audit · Defender telemetry',
      joinKeys: ['account', 'resource audience', 'workload timestamp'],
      correlation:
        'Tie workload operations back to the suspicious sign-in/session chain using account and time.',
      boundary:
        'Legitimate administrative activity can look identical in isolation; preserve the entire authentication-to-action sequence.',
    },
  },
];

export const sneakyInfraTraces: AttackTrace[] = [
  {
    id: 'sneaky-authentication-trace',
    label: 'Sneaky 2FA authentication trace',
    subjectScope: 'Public lure case plus Sneaky 2FA technical analysis',
    steps: [
      { edgeId: 'r1', order: 1 },
      { edgeId: 'r2', order: 2 },
      { edgeId: 'r3', order: 3 },
      { edgeId: 'r4', order: 4 },
      { edgeId: 'r5', order: 5 },
    ],
  },
];

export const scannerSources = [
  {
    name: 'URLScan',
    role: 'Web-flow reconstruction',
    status: 'run · access limited',
    result: 'coverage_limited',
    contributes: [
      'Redirect and request graph',
      'DOM/resource fingerprints',
      'Historical page, ASN, and certificate context',
    ],
    admission:
      'Time-bounded kit route or resource identity plus a second non-generic artifact.',
    docs: 'https://docs.urlscan.io/pages/source-scans',
  },
  {
    name: 'Censys',
    role: 'Service identity',
    status: 'ready · unrun',
    result: 'coverage_limited',
    contributes: [
      'Host + port + protocol tuple',
      'Indexed HTTP body and body hash',
      'TLS and service history when available',
    ],
    admission:
      'Role-compatible service tuple in the source window plus independent web or endpoint evidence.',
    docs: 'https://docs.censys.com/docs/censys-query-language',
  },
  {
    name: 'Shodan',
    role: 'Independent corroboration',
    status: 'ready · unrun',
    result: 'coverage_limited',
    contributes: [
      'HTTP banner and title',
      'Service, ASN, and host context',
      'Historical banners when entitled',
    ],
    admission:
      'Confirm the same composite fingerprint; never promote an ASN, favicon, or title alone.',
    docs: 'https://developer.shodan.io/api',
  },
  {
    name: 'Passive DNS / CT',
    role: 'Infrastructure lineage',
    status: 'planned',
    result: 'coverage_limited',
    contributes: [
      'Name-to-host history',
      'Certificate reuse',
      'Deployment and teardown timing',
    ],
    admission:
      'Join only to a previously admitted service or web-kit identity.',
    docs: 'https://certificate.transparency.dev/',
  },
];

export const scannerRuns = [
  {
    id: 'urlscan-2026-09-08',
    provider: 'URLScan',
    runAt: '2026-09-08',
    scope: 'Tycoon route/ASN + Sneaky route/ASN',
    outcome: 'coverage_limited',
    evidenceCeiling: 'No candidate level assigned',
    verdict: 'HOLD',
    detail:
      'Two bounded historical-search requests were rejected by the provider access boundary. This is not a zero-result observation and supplies no evidence for or against either kit.',
    reopen:
      'Re-run through an authorized provider session, preserve the query window, and grade only sanitized artifact co-occurrence.',
  },
];

export type LureEvidence =
  | 'source-observed'
  | 'report-derived'
  | 'analyst-inference';

export type LureDomLine = {
  line: number;
  code: string;
  active?: boolean;
};

export type LureRequest = {
  offset: string;
  channel: 'browser' | 'relay';
  method: 'GET' | 'POST';
  destination: string;
  path: string;
  status: string;
  detail: string;
};

export type LureStage = {
  id: string;
  step: string;
  action: string;
  phase: string;
  surface:
    | 'message'
    | 'redirect'
    | 'decoy'
    | 'captcha'
    | 'signin'
    | 'mfa'
    | 'complete';
  address: string;
  domLanguage: 'HTML' | 'Process tree';
  dom: LureDomLine[];
  requests: LureRequest[];
  finding: string;
  hunt: string;
  boundary: string;
  evidence: LureEvidence;
};

export const sneakyLureStages: LureStage[] = [
  {
    id: 'message',
    step: '01',
    action: 'Open message',
    phase: 'Delivery',
    surface: 'message',
    address: 'message://ACH_Remit_Status_Notification…',
    domLanguage: 'Process tree',
    dom: [
      { line: 1, code: 'OUTLOOK.EXE' },
      { line: 2, code: '└─ writes HTML attachment to INetCache', active: true },
      {
        line: 3,
        code: '   └─ msedge.exe file:///…/ACH_Payment_Remittance…',
        active: true,
      },
    ],
    requests: [
      {
        offset: '+0 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'trusted redirect service',
        path: '/Ctc/0+113/d[…tracking…]',
        status: '302',
        detail: 'Legitimate HubSpot tracking host observed in the campaign.',
      },
    ],
    finding:
      'The real sample starts as an Outlook message whose HTML attachment launches the browser from the local cache.',
    hunt: 'Join attachment name, Outlook-to-browser process ancestry, and the expanded tracking URL from mail or proxy telemetry.',
    boundary:
      'The browser launch and HubSpot are both common. The attachment-to-redirect relationship is the useful evidence.',
    evidence: 'source-observed',
  },
  {
    id: 'redirect',
    step: '02',
    action: 'Follow redirect',
    phase: 'Reputation bridge',
    surface: 'redirect',
    address:
      'https://contract-completion.[redacted].com.br/contract/document/Q2…/assessment/ready',
    domLanguage: 'HTML',
    dom: [
      { line: 41, code: '<main class="document-review">' },
      {
        line: 42,
        code: '  <img src="/assets/freedom-mortgage-hero.jpg">',
        active: true,
      },
      {
        line: 43,
        code: '  <a href="https://challenges….[redacted].info/verification/…">',
      },
      { line: 44, code: '    View document', active: true },
      { line: 45, code: '  </a>' },
      { line: 46, code: '</main>' },
    ],
    requests: [
      {
        offset: '+86 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'redirect host',
        path: '/contract/document/Q2…/assessment/ready',
        status: '200',
        detail: 'Workflow-shaped path observed by the public sandbox.',
      },
      {
        offset: '+131 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'redirect host',
        path: '/assets/freedom-mortgage-hero.jpg',
        status: '200',
        detail: 'Mortgage-themed asset named in the source capture.',
      },
      {
        offset: '+944 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Sneaky relay',
        path: '/verification/validatio[…]',
        status: '302',
        detail: 'The final relay was reached through the intermediate page.',
      },
    ],
    finding:
      'The compromised page supplies a believable document-review context and separates the trusted first hop from the relay.',
    hunt: 'Preserve the redirect chain, referrer, full path, asset request, service tuple, and observation time as one graph.',
    boundary:
      'The asset and route are contextual. The report observed both web roles on the same host, but shared hosting does not prove ownership.',
    evidence: 'report-derived',
  },
  {
    id: 'gate',
    step: '03',
    action: 'Pass anti-bot',
    phase: 'Qualification',
    surface: 'decoy',
    address: 'https://relay.[redacted]/',
    domLanguage: 'HTML',
    dom: [
      {
        line: 1,
        code: '<title>Gourmet Delights and Beverage</title>',
        active: true,
      },
      { line: 18, code: '<!-- Food Section -->', active: true },
      { line: 74, code: '<script>' },
      { line: 75, code: '  window.location.reload();', active: true },
      { line: 76, code: '</script>' },
    ],
    requests: [
      {
        offset: '+0 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Sneaky relay',
        path: '/',
        status: '200',
        detail:
          'Benign food content is returned before the challenge page reload.',
      },
      {
        offset: '+214 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Sneaky relay',
        path: '/?cf-turnstile-response=[redacted]',
        status: '200',
        detail: 'Challenge transition; value intentionally removed.',
      },
      {
        offset: '+327 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Cloudflare',
        path: '/turnstile/v0/api.js',
        status: '200',
        detail: 'Shared legitimate service; never a kit identifier by itself.',
      },
    ],
    finding:
      'Sneaky 2FA can return a benign food page, reload, and then present Turnstile to keep automated analysis away from the sign-in page.',
    hunt: 'Search historical HTML for the comment plus reload behavior and require the long route or another source-compatible artifact.',
    boundary:
      'Food content, reload code, and Turnstile are individually generic. Detection requires the deployment tuple.',
    evidence: 'source-observed',
  },
  {
    id: 'password',
    step: '04',
    action: 'Enter password',
    phase: 'Credential relay',
    surface: 'signin',
    address: 'https://relay.[redacted]/[150-character-id]/verify',
    domLanguage: 'HTML',
    dom: [
      {
        line: 108,
        code: '<form action="/[150-character-id]/validate" method="post">',
        active: true,
      },
      {
        line: 113,
        code: '  N<a class="kzoNmrYqOS"></a>o a<a class="kzoNmrYqOS"></a>cc…ount?',
        active: true,
      },
      { line: 119, code: '  S<b></b>i<b></b>g<b></b>n in', active: true },
      { line: 126, code: '  <input name="em" value="analyst@example.test">' },
      { line: 127, code: '  <input name="pa" value="[redacted]">' },
      { line: 130, code: '</form>' },
    ],
    requests: [
      {
        offset: '+0 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Sneaky relay',
        path: '/[150-character-id]/verify',
        status: '200',
        detail: 'Obfuscated Microsoft-themed form returned to the victim.',
      },
      {
        offset: '+4.8 s',
        channel: 'browser',
        method: 'POST',
        destination: 'Sneaky relay',
        path: '/[150-character-id]/validate',
        status: '200',
        detail:
          'Reported parameter names: em and pa. Values are synthetic/redacted.',
      },
      {
        offset: '+4.9 s',
        channel: 'relay',
        method: 'POST',
        destination: 'Microsoft identity API',
        path: '/login',
        status: '200',
        detail:
          'Server-side direct API relay; reported user-agent family: iPhone Safari.',
      },
    ],
    finding:
      'The browser posts credentials to the kit, while the server—not the victim browser—starts the real Microsoft authentication flow.',
    hunt: 'Correlate the long-path POST at the proxy with Entra events for the same identity and time. The server-side user-agent is the identity-side residue.',
    boundary:
      'This reconstruction never accepts input. A page or POST alone cannot prove successful credential or session theft.',
    evidence: 'source-observed',
  },
  {
    id: 'mfa',
    step: '05',
    action: 'Complete MFA',
    phase: 'MFA relay',
    surface: 'mfa',
    address: 'https://relay.[redacted]/[150-character-id]/validate',
    domLanguage: 'HTML',
    dom: [
      { line: 204, code: 'fetch("/[150-character-id]/validate", {' },
      { line: 205, code: '  method: "POST",' },
      {
        line: 206,
        code: '  body: "em=[synthetic]&auth=verify_app&code=[redacted]"',
        active: true,
      },
      { line: 207, code: '});' },
    ],
    requests: [
      {
        offset: '+0 ms',
        channel: 'browser',
        method: 'POST',
        destination: 'Sneaky relay',
        path: '/[150-character-id]/validate',
        status: '200',
        detail: 'Reported fields select verify_app and submit a redacted code.',
      },
      {
        offset: '+72 ms',
        channel: 'relay',
        method: 'POST',
        destination: 'Microsoft identity API',
        path: '/SAS/BeginAuth',
        status: '200',
        detail: 'Reported user-agent family changes to Windows Chrome.',
      },
      {
        offset: '+3.1 s',
        channel: 'relay',
        method: 'POST',
        destination: 'Microsoft identity API',
        path: '/SAS/ProcessAuth',
        status: '200',
        detail: 'Reported user-agent family changes again to macOS Firefox.',
      },
      {
        offset: '+3.4 s',
        channel: 'relay',
        method: 'POST',
        destination: 'Microsoft identity API',
        path: '/SAS/EndAuth',
        status: '200',
        detail: 'Reported user-agent family changes to Windows Edge.',
      },
    ],
    finding:
      'One authentication attempt crosses several impossible browser identities because each server-side relay step uses a different hardcoded user-agent.',
    hunt: 'Group Entra authentication events by correlation ID and detect the reported Safari → Chrome → Firefox → Edge transition inside one flow.',
    boundary:
      'Legitimate apps can move into webviews. Require the specific sequence, request types, one correlation ID, and a tight time window.',
    evidence: 'source-observed',
  },
  {
    id: 'session',
    step: '06',
    action: 'Observe handoff',
    phase: 'Session boundary',
    surface: 'complete',
    address: 'https://outlook.office365.com/Encryption/ErrorPage.aspx?[…]',
    domLanguage: 'HTML',
    dom: [
      { line: 248, code: 'setInterval(() => {' },
      {
        line: 249,
        code: '  fetch("/[150-character-id]/validate", { method: "POST" });',
        active: true,
      },
      { line: 250, code: '}, [poll interval]);' },
      {
        line: 262,
        code: 'window.location = "https://outlook.office365.com/…";',
        active: true,
      },
    ],
    requests: [
      {
        offset: '+0 ms',
        channel: 'relay',
        method: 'POST',
        destination: 'Microsoft identity API',
        path: '/kmsi',
        status: '200',
        detail:
          'Final reported authentication request; user-agent family remains Windows Edge.',
      },
      {
        offset: '+148 ms',
        channel: 'browser',
        method: 'POST',
        destination: 'Sneaky relay',
        path: '/[150-character-id]/validate',
        status: '200',
        detail: 'The victim page polls for completion.',
      },
      {
        offset: '+311 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Microsoft 365',
        path: '/Encryption/ErrorPage.aspx?[…]',
        status: '302',
        detail: 'Default legitimate-looking final redirect reported by Sekoia.',
      },
    ],
    finding:
      'The victim is redirected to a legitimate Microsoft destination while the authenticated session boundary remains server-side.',
    hunt: 'Use Entra sign-in and token telemetry to prove issuance or replay, then correlate UAL/Graph/Exchange activity after the flow.',
    boundary:
      'The network sequence explains capability; only identity telemetry or controlled-lab evidence can establish that a session was captured or replayed.',
    evidence: 'analyst-inference',
  },
];

export const tycoonInfraNodes: InfraNode[] = [
  {
    id: 'delivery',
    step: '01',
    plane: 'delivery',
    title: 'Lure + entry route',
    role: 'Delivery',
    summary:
      'Email links, QR codes, or web attachments lead to a campaign route before the victim reaches the credential relay.',
    evidence: {
      class: 'report-derived',
      confidence: 'high',
      scope: 'Tycoon 2FA delivery patterns documented by Elastic',
      validation: 'source-reviewed',
    },
    vantage: 'Mail gateway · secure web gateway · passive URL archive',
    telemetry: [
      'Message and attachment metadata',
      'Redirect chain and full path',
      'First-seen and hosting context',
    ],
    markers: [
      'Link / QR / HTML delivery',
      'Campaign route',
      'Short-lived web host',
    ],
    caveat:
      'Delivery media changes frequently. Preserve the chain; do not attribute from a lure theme alone.',
  },
  {
    id: 'gate',
    step: '02',
    plane: 'delivery',
    title: 'Qualification + fake CAPTCHA',
    role: 'Anti-analysis',
    summary:
      'A browser-check script and image-selection CAPTCHA filter automated analysis before loading the relay workflow.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon 2FA JavaScript and page variants analyzed by Elastic',
      validation: 'source-reviewed',
    },
    vantage: 'DOM capture · proxy / HAR · historical HTTP body',
    telemetry: [
      'Browser automation checks',
      'Unsplash image requests',
      'Conditional blank or challenge response',
    ],
    markers: [
      'navigator.webdriver',
      'window.callPhantom',
      '3×3 external-image grid',
    ],
    caveat:
      'Automation checks and Unsplash are common. Their co-occurrence with controller artifacts is the useful tuple.',
  },
  {
    id: 'relay',
    step: '03',
    plane: 'relay',
    title: 'Tier-1 WebSocket relay',
    role: 'Proxy + controller',
    summary:
      'A cloud-hosted Node.js service coordinates victim state, proxies identity requests, and returns authentication challenges.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon controller and relay code analyzed by Sekoia and Elastic',
      validation: 'source-reviewed',
    },
    vantage: 'Indexed HTTP body · WebSocket metadata · Entra sign-in logs',
    telemetry: [
      'Socket.IO handshake and event names',
      'Relay route and script body',
      'Node.js HTTP client user-agent',
    ],
    markers: [
      'recieveid',
      '/web6socket/socket.io/',
      'axios / node-fetch / undici',
    ],
    caveat:
      'Socket.IO and Node.js are shared technology. Require the event typo or another kit-specific artifact.',
  },
  {
    id: 'identity',
    step: '04',
    plane: 'identity',
    title: 'Microsoft identity',
    role: 'Authentication authority',
    summary:
      'The relay, not the victim browser, sends the upstream authentication requests and receives the real challenge state.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon relay sign-in telemetry documented by Elastic',
      validation: 'source-reviewed',
    },
    vantage: 'Entra sign-in logs · token telemetry',
    telemetry: [
      'UserAgent and AppDisplayName',
      'Authentication protocol',
      'IP, ASN, correlation and session identifiers',
    ],
    markers: [
      'Server-side Node.js UA',
      'OfficeHome / Auth Broker context',
      'Cloud-VPS source',
    ],
    caveat:
      'Legitimate automation can use Node.js. Correlate identity, application, time, and the surrounding web flow.',
  },
  {
    id: 'session',
    step: '05',
    plane: 'relay',
    title: 'Session + token boundary',
    role: 'Capture + return',
    summary:
      'Authenticated session material crosses back to attacker-controlled infrastructure while the victim sees a normal completion path.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon session interception mechanism documented by Sekoia',
      validation: 'source-reviewed',
    },
    vantage: 'Identity issuance telemetry · controlled-lab proxy capture',
    telemetry: [
      'Session / token issuance',
      'Authentication completion timing',
      'Victim-facing redirect',
    ],
    markers: [
      'Post-MFA completion',
      'Server-side session state',
      'Legitimate final destination',
    ],
    caveat:
      'The public specimen contains no token or credential values. Only authorized identity telemetry can prove issuance or reuse.',
  },
  {
    id: 'operator',
    step: '06',
    plane: 'operator',
    title: 'Tier-2 operator console',
    role: 'Hands-on use',
    summary:
      'A later residential or ISP-network session uses the same identity after the cloud relay completes authentication.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon two-tier operating model documented by Elastic',
      validation: 'source-reviewed',
    },
    vantage: 'Entra sign-ins · IP enrichment · Graph activity',
    telemetry: [
      'Same UPN across infrastructure classes',
      '10–20 minute transition',
      'Browser-like operator user-agent',
    ],
    markers: [
      'Cloud/VPS → residential',
      'Same account',
      'Short handoff window',
    ],
    caveat:
      'Residential IP space is not malicious by itself. The same-identity transition is the higher-value signal.',
  },
  {
    id: 'postauth',
    step: '07',
    plane: 'operator',
    title: 'Automated Graph recon',
    role: 'Post-auth discovery',
    summary:
      'The operator console issues a machine-speed burst across role, cross-tenant, mailbox, contacts, and organization categories.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon Graph activity sequence documented by Elastic',
      validation: 'source-reviewed',
    },
    vantage: 'Microsoft Graph activity logs · Entra sign-ins',
    telemetry: [
      '20–30+ requests in 30–60 seconds',
      'Five reconnaissance categories',
      'Empty device id and elevated beta API use',
    ],
    markers: [
      'Role discovery',
      'Cross-tenant discovery',
      'Mailbox + org enumeration',
    ],
    caveat:
      'Individual Graph calls are legitimate. Detection comes from category breadth, speed, and the preceding identity transition.',
  },
  {
    id: 'workloads',
    step: '08',
    plane: 'workload',
    title: 'Cloud workload access',
    role: 'Follow-on activity',
    summary:
      'The authenticated identity can reach Graph, Exchange, device registration, and other Microsoft cloud resources.',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon post-authentication activity documented by Elastic',
      validation: 'source-reviewed',
    },
    vantage: 'UAL · Graph activity · Entra audit · Exchange audit',
    telemetry: [
      'Mailbox access',
      'Device registration',
      'Resource and application pivots',
    ],
    markers: ['Graph API', 'Exchange Online', 'Device registration service'],
    caveat:
      'Workload events become actionable when joined to the relay and operator stages by identity, session context, and time.',
  },
];

export const tycoonInfraRelations: InfraRelation[] = [
  {
    id: 't1',
    from: 'delivery',
    to: 'gate',
    label: 'loads qualification',
    kind: 'delivery',
    path: 'M 130 170 L 275 112',
    labelX: 198,
    labelY: 125,
    requirement: 'required',
    temporalRelationship: 'before',
    evidence: {
      class: 'report-derived',
      confidence: 'high',
      scope: 'Tycoon delivery and anti-analysis sequence',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Navigation + challenge context',
      values: [
        'Expanded URL',
        'Referrer',
        'Campaign route',
        'Observation time',
      ],
      direction: 'Victim browser → Tycoon entry route',
      source: 'Elastic Tycoon 2FA analysis',
      visibility: 'Mail gateway · proxy · browser history · sandbox HAR',
      joinKeys: ['message or attachment', 'expanded URL', 'timestamp'],
      correlation:
        'Bind the delivery artifact to the first attacker-controlled route and its challenge resources.',
      boundary:
        'Lure themes and young domains are contextual; retain the route and resource relationships.',
    },
  },
  {
    id: 't2',
    from: 'gate',
    to: 'relay',
    label: 'admits browser',
    kind: 'delivery',
    path: 'M 360 125 L 495 215',
    labelX: 430,
    labelY: 165,
    requirement: 'required',
    temporalRelationship: 'before',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon anti-analysis and controller code',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Browser fingerprint + controller bootstrap',
      values: [
        'Automation checks',
        '3×3 image grid',
        'Socket.IO bootstrap',
        'Campaign state',
      ],
      direction: 'Qualified browser → Tier-1 relay',
      source: 'Elastic Security Labs source analysis',
      visibility: 'DOM · JavaScript body · HAR · proxy logs',
      joinKeys: ['host', 'page path', 'script URL', 'timestamp'],
      correlation:
        'Require a qualification artifact and a compatible controller artifact on the same web service.',
      boundary:
        'Unsplash and automation checks are not selectors alone; the composite implementation tuple is the evidence.',
    },
  },
  {
    id: 't3',
    from: 'relay',
    to: 'identity',
    label: 'proxies sign-in',
    kind: 'authentication',
    path: 'M 590 220 C 690 120 750 105 840 115',
    labelX: 706,
    labelY: 125,
    requirement: 'required',
    temporalRelationship: 'concurrent',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon server-side identity relay',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Identity + authentication state',
      values: [
        'Username / challenge state',
        'OfficeHome or Auth Broker app context',
        'Node.js user-agent family',
        'Source IP + ASN',
      ],
      direction: 'Tier-1 relay → Microsoft identity',
      source: 'Elastic tenant telemetry and Sekoia relay analysis',
      visibility: 'Entra sign-in logs · authorized proxy capture',
      joinKeys: ['UPN', 'correlation id', 'app id', 'timestamp'],
      correlation:
        'Join a server-side Node.js client on a high-value app to the preceding web flow by identity and time.',
      boundary:
        'Credentials, tokens, and live targets are neither stored nor displayed.',
    },
  },
  {
    id: 't4',
    from: 'identity',
    to: 'session',
    label: 'returns auth state',
    kind: 'capture',
    path: 'M 850 150 C 870 235 820 315 770 350',
    labelX: 862,
    labelY: 250,
    requirement: 'required',
    temporalRelationship: 'after',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon post-MFA session interception',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'MFA result + session response',
      values: [
        'Authentication result',
        'Session issuance metadata',
        'Correlation / session id',
        'Completion timestamp',
      ],
      direction: 'Microsoft identity → Tier-1 relay session boundary',
      source: 'Sekoia Tycoon in-depth analysis',
      visibility: 'Entra sign-in and token telemetry · controlled-lab capture',
      joinKeys: ['UPN', 'correlation id', 'session id', 'timestamp'],
      correlation:
        'Keep issuance and completion events tied to the same relay-side authentication sequence.',
      boundary:
        'Successful sign-in does not by itself prove theft; downstream replay or controlled-lab evidence is required.',
    },
  },
  {
    id: 't5',
    from: 'session',
    to: 'operator',
    label: 'hands off identity',
    kind: 'operation',
    path: 'M 735 390 C 680 470 590 500 520 485',
    labelX: 650,
    labelY: 475,
    requirement: 'required',
    temporalRelationship: 'after',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon two-tier infrastructure model',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Same-account infrastructure transition',
      values: [
        'Same UPN',
        'Cloud/VPS source class',
        'Residential/ISP source class',
        '10–20 minute delta',
      ],
      direction: 'Tier-1 relay context → Tier-2 operator context',
      source: 'Elastic Security Labs tenant analysis',
      visibility: 'Entra sign-in logs · IP/ASN enrichment',
      joinKeys: ['UPN', 'time window', 'app / resource', 'source class'],
      correlation:
        'Detect the same account moving from an automated cloud relay to residential browser context inside twenty minutes.',
      boundary:
        'ASN labels are enrichment. The durable signal is the identity and time-bound change in operating context.',
    },
  },
  {
    id: 't6',
    from: 'operator',
    to: 'postauth',
    label: 'drives recon burst',
    kind: 'operation',
    path: 'M 520 520 L 720 575',
    labelX: 620,
    labelY: 535,
    requirement: 'required',
    temporalRelationship: 'after',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon operator Graph sequence',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Machine-speed Graph API sequence',
      values: [
        '20–30+ API calls',
        'Five recon categories',
        '30–60 second window',
        'Empty device id',
      ],
      direction: 'Tier-2 operator console → Microsoft Graph',
      source: 'Elastic Security Labs Graph activity analysis',
      visibility: 'Microsoft Graph activity logs · Entra sign-ins',
      joinKeys: ['UPN', 'source IP', 'app id', '60-second window'],
      correlation:
        'Count distinct reconnaissance categories rather than relying on one endpoint or beta route.',
      boundary:
        'Exact endpoints drift. Category breadth and speed are more durable than one URI.',
    },
  },
  {
    id: 't7',
    from: 'postauth',
    to: 'workloads',
    label: 'reaches workloads',
    kind: 'operation',
    path: 'M 785 575 C 880 545 900 470 910 430',
    labelX: 870,
    labelY: 515,
    requirement: 'required',
    temporalRelationship: 'after',
    evidence: {
      class: 'source-observed',
      confidence: 'high',
      scope: 'Tycoon post-authentication cloud activity',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Token-backed cloud operations',
      values: [
        'Graph resource calls',
        'Mailbox context',
        'Device registration events',
        'Resource audience',
      ],
      direction: 'Authenticated operator session → Microsoft cloud workloads',
      source: 'Elastic Security Labs tenant analysis',
      visibility: 'UAL · Graph activity · Entra audit · Exchange audit',
      joinKeys: ['UPN', 'session context', 'resource', 'timestamp'],
      correlation:
        'Tie cloud operations to the preceding Tier-1 and Tier-2 sign-ins using identity and time.',
      boundary:
        'Cloud administration can be legitimate. Preserve the full authentication-to-action trace before containment.',
    },
  },
  {
    id: 't8',
    from: 'relay',
    to: 'session',
    label: 'captures session',
    kind: 'capture',
    path: 'M 580 250 C 650 285 700 335 735 365',
    labelX: 665,
    labelY: 320,
    requirement: 'optional',
    temporalRelationship: 'concurrent',
    evidence: {
      class: 'report-derived',
      confidence: 'high',
      scope: 'Conceptual session interception boundary',
      validation: 'source-reviewed',
    },
    data: {
      eventClass: 'Captured authenticated session material',
      values: [
        'Session cookie class',
        'Access / refresh token class',
        'Capture timestamp',
      ],
      direction: 'Tier-1 relay → attacker-controlled session store',
      source: 'Sekoia Tycoon in-depth analysis',
      visibility:
        'Not directly visible at the browser; infer from identity events or validate in an isolated lab',
      joinKeys: ['UPN', 'correlation id', 'timestamp'],
      correlation:
        'Issuance establishes capability; later use establishes observable activity.',
      boundary:
        'No values are shown or retained. This modeled edge must not be mistaken for direct defender visibility.',
    },
  },
];

export const tycoonInfraTraces: AttackTrace[] = [
  {
    id: 'tycoon-microsoft-trace',
    label: 'Tycoon two-tier Microsoft trace',
    subjectScope: 'Sekoia source-code analysis plus Elastic tenant telemetry',
    steps: [
      { edgeId: 't1', order: 1 },
      { edgeId: 't2', order: 2 },
      { edgeId: 't3', order: 3 },
      { edgeId: 't4', order: 4 },
      { edgeId: 't5', order: 5 },
      { edgeId: 't6', order: 6 },
      { edgeId: 't7', order: 7 },
    ],
  },
];

export const tycoonLureStages: LureStage[] = [
  {
    id: 'entry',
    step: '01',
    action: 'Open lure',
    phase: 'Delivery',
    surface: 'message',
    address: 'message://shared-document-notice…',
    domLanguage: 'Process tree',
    dom: [
      { line: 1, code: 'OUTLOOK.EXE' },
      {
        line: 2,
        code: '└─ opens campaign URL or local HTML attachment',
        active: true,
      },
      { line: 3, code: '   └─ browser.exe https://entry.[redacted]/[…]' },
    ],
    requests: [
      {
        offset: '+0 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Tycoon entry host',
        path: '/[campaign-route]',
        status: '200',
        detail:
          'Representative source-derived entry relationship; host and path are masked.',
      },
    ],
    finding:
      'Tycoon campaigns vary the delivery wrapper, so the useful record begins with the message-to-route relationship rather than the lure theme.',
    hunt: 'Retain the message or attachment, expanded URL, referrer, full path, and first observation time.',
    boundary:
      'This is a source-derived reconstruction of reported delivery types, not one verbatim captured email.',
    evidence: 'report-derived',
  },
  {
    id: 'captcha',
    step: '02',
    action: 'Pass image check',
    phase: 'Qualification',
    surface: 'captcha',
    address: 'https://entry.[redacted]/[campaign-route]',
    domLanguage: 'HTML',
    dom: [
      {
        line: 34,
        code: 'if (navigator.webdriver || window.callPhantom) return;',
        active: true,
      },
      { line: 51, code: '<div class="image-grid">' },
      {
        line: 52,
        code: '  <img src="https://images.unsplash.com/[…]")',
        active: true,
      },
      { line: 61, code: '</div>' },
    ],
    requests: [
      {
        offset: '+18 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Unsplash image CDN',
        path: '/photo-[redacted]',
        status: '200',
        detail: 'External image relationship reported in the fake 3×3 CAPTCHA.',
      },
      {
        offset: '+2.4 s',
        channel: 'browser',
        method: 'POST',
        destination: 'Tycoon entry host',
        path: '/[challenge-route]',
        status: '200',
        detail: 'Representative challenge transition; body values are omitted.',
      },
    ],
    finding:
      'The fake CAPTCHA and browser checks form a qualification layer that can be reconstructed from HTML and request relationships.',
    hunt: 'Pair the automation-check strings with the 3×3 external-image structure and a compatible Tycoon controller artifact.',
    boundary:
      'Unsplash and navigator.webdriver are common. Neither should be blocked or attributed independently.',
    evidence: 'source-observed',
  },
  {
    id: 'controller',
    step: '03',
    action: 'Load controller',
    phase: 'Relay bootstrap',
    surface: 'signin',
    address: 'https://relay.[redacted]/auth/[bundle].js',
    domLanguage: 'HTML',
    dom: [
      {
        line: 118,
        code: 'const socket = io("/web6socket", { transports: ["websocket"] });',
        active: true,
      },
      {
        line: 132,
        code: 'socket.emit("recieveid", "[campaign-state]");',
        active: true,
      },
      {
        line: 151,
        code: 'const fields = ["pagelink", "bltdip", "bltdref", "bltdua", "bltddata"];',
      },
    ],
    requests: [
      {
        offset: '+0 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Tycoon relay',
        path: '/auth/[bundle].js',
        status: '200',
        detail:
          'Attacker-controlled JavaScript bundle; route is source-derived and masked.',
      },
      {
        offset: '+43 ms',
        channel: 'browser',
        method: 'GET',
        destination: 'Tycoon relay',
        path: '/web6socket/socket.io/?EIO=4&transport=websocket',
        status: '101',
        detail: 'Socket.IO transport upgrade documented in source analysis.',
      },
    ],
    finding:
      'The misspelled controller event and WebSocket path expose reusable implementation details underneath the Microsoft-themed surface.',
    hunt: 'Search historical JavaScript for the event typo, then require the Socket.IO route or auth-path relationship before labeling a candidate.',
    boundary:
      'The specimen exposes no working controller and contains no campaign identifier or live endpoint.',
    evidence: 'source-observed',
  },
  {
    id: 'signin',
    step: '04',
    action: 'Submit sign-in',
    phase: 'Identity relay',
    surface: 'signin',
    address: 'https://relay.[redacted]/auth/[campaign-state]',
    domLanguage: 'HTML',
    dom: [
      { line: 204, code: '<form data-stage="signin">' },
      {
        line: 210,
        code: '  <input value="analyst@example.test" disabled>',
        active: true,
      },
      { line: 214, code: '  <button type="button">Next</button>' },
      { line: 218, code: '</form>' },
    ],
    requests: [
      {
        offset: '+0 ms',
        channel: 'browser',
        method: 'POST',
        destination: 'Tycoon relay',
        path: '/[campaign-state]',
        status: '200',
        detail:
          'Victim-to-relay form relationship; fields and values are omitted.',
      },
      {
        offset: '+76 ms',
        channel: 'relay',
        method: 'POST',
        destination: 'Microsoft identity',
        path: '/[authentication-endpoint]',
        status: '200',
        detail:
          'Relay-to-identity request using a reported Node.js HTTP client family.',
      },
    ],
    finding:
      'The browser talks to Tycoon while the Node.js relay talks to Microsoft, creating two distinct telemetry vantage points.',
    hunt: 'Correlate the relay-host POST with Entra sign-ins using a Node.js client family, the same identity, and a tight time window.',
    boundary:
      'The form is inert and accepts no input. Endpoint detail is generalized to avoid recreating a deployable relay.',
    evidence: 'source-observed',
  },
  {
    id: 'handoff',
    step: '05',
    action: 'Observe handoff',
    phase: 'Two-tier transition',
    surface: 'complete',
    address: 'https://microsoft365.com/',
    domLanguage: 'Process tree',
    dom: [
      {
        line: 1,
        code: 'Tier 1: cloud/VPS relay → Microsoft identity',
        active: true,
      },
      { line: 2, code: '└─ 10–20 minute handoff window' },
      {
        line: 3,
        code: '   └─ Tier 2: residential operator → Microsoft Graph',
        active: true,
      },
    ],
    requests: [
      {
        offset: '+0 min',
        channel: 'relay',
        method: 'POST',
        destination: 'Microsoft identity',
        path: '/[session-completion]',
        status: '200',
        detail:
          'Tier-1 authentication completion represented without session material.',
      },
      {
        offset: '+10–20 min',
        channel: 'relay',
        method: 'GET',
        destination: 'Microsoft Graph',
        path: '/[recon-category]',
        status: '200',
        detail:
          'Tier-2 operator activity summarized as a category rather than a deployable request sequence.',
      },
    ],
    finding:
      'The highest-value Tycoon-specific story is the same identity moving from an automated cloud relay to residential operator activity and then a Graph recon burst.',
    hunt: 'Join UPN, application/resource, source-network class, and time; then count distinct Graph reconnaissance categories inside 60 seconds.',
    boundary:
      'Identity and Graph telemetry are required to establish the handoff. A public web capture alone cannot prove it.',
    evidence: 'source-observed',
  },
];

export type DossierReadinessReceipt = {
  schema: 'intelopes/kit-dossier-readiness/v1';
  kitId: string;
  status: 'ready' | 'partial' | 'blocked';
  completedDimensions: number;
  requiredDimensions: number;
  assessedAt: string;
  limitations: string[];
};

export const tycoonDossierReadiness: DossierReadinessReceipt = {
  schema: 'intelopes/kit-dossier-readiness/v1',
  kitId: 'tycoon-2fa',
  status: 'ready',
  completedDimensions: 7,
  requiredDimensions: 7,
  assessedAt: '2026-09-09',
  limitations: [
    'Publication readiness does not imply that every Tacklebox atomic has passed BAS validation.',
    'Attribution and deployment-specific indicators remain outside the publication gate.',
    'Google Workspace and device-code variants require their own named traces before publication.',
  ],
};

export type InfraSample = {
  id: string;
  kit: string;
  title: string;
  sampleType: string;
  observed: string;
  evidence: string;
  confidence: 'high' | 'medium';
  source: { label: string; url: string };
  nodeIds: string[];
  artifacts: {
    type: string;
    value: string;
    stability: 'durable' | 'volatile' | 'contextual';
    meaning: string;
  }[];
  queries: { provider: string; query: string; note: string; url: string }[];
  chokepoint: string;
  blockGuidance: string;
  falsePositiveBoundary: string;
};

export const infraSamples: InfraSample[] = [
  {
    id: 'bigbear-browser-injections',
    kit: 'BigBear 2.0',
    title: 'Custom browser injection bundle',
    sampleType: 'JavaScript / proxied page',
    observed: 'CloudSEK research published 2026-09-07',
    evidence: 'Public analysis of a campaign page and exposed operator panel',
    confidence: 'high',
    source: {
      label: 'CloudSEK — Tracking BigBear 2.0 Evilginx2 campaign',
      url: 'https://www.cloudsek.com/blog/tracking-bigbear-2-0-evilginx2-phishing-campaign',
    },
    nodeIds: ['gate', 'relay', 'session'],
    artifacts: [
      {
        type: 'Custom flag',
        value: 'window.__bb_fido_down',
        stability: 'durable',
        meaning:
          'BigBear-specific marker reported in the injection that suppresses phishing-resistant authentication.',
      },
      {
        type: 'Browser primitive',
        value: 'PublicKeyCredential → undefined',
        stability: 'contextual',
        meaning:
          'Forces fallback away from origin-bound FIDO2/WebAuthn; require the custom flag or another injection artifact.',
      },
      {
        type: 'Telemetry block tuple',
        value: 'canarytokens · events.data.microsoft.com · OneCollector',
        stability: 'contextual',
        meaning:
          'Fetch/XHR interception suppresses Microsoft telemetry endpoints and removes matching image requests.',
      },
      {
        type: 'Session extension',
        value: '#KmsiCheckboxField + idSIButton9 + 800 ms',
        stability: 'contextual',
        meaning: 'Automates Keep Me Signed In to maximize session lifetime.',
      },
    ],
    queries: [
      {
        provider: 'URLScan',
        query: 'filename:"*.js" AND page.url:*meetings*',
        note: 'Reconstruct the request graph, then require the custom flag plus one compatible injection behavior.',
        url: 'https://urlscan.io/search/',
      },
      {
        provider: 'Censys',
        query: 'host.services.endpoints.http.body: "__bb_fido_down"',
        note: 'Search indexed bodies only. A match remains a candidate until role, time, and independent evidence agree.',
        url: 'https://platform.censys.io/search',
      },
      {
        provider: 'Shodan',
        query: 'http.html:"__bb_fido_down"',
        note: 'Review indexed banners; do not probe hosts or expand from provider or ASN alone.',
        url: 'https://www.shodan.io/search?query=http.html%3A%22__bb_fido_down%22',
      },
    ],
    chokepoint:
      'The relay must modify the real Microsoft page to demote phishing-resistant MFA and extend the captured session. A coordinated injection tuple is more durable than a hostname.',
    blockGuidance:
      'Block only a confirmed malicious host or route. Detect the injection tuple and prioritize tenant-side evidence of method fallback and session-context change.',
    falsePositiveBoundary:
      'Individual Microsoft DOM identifiers and telemetry endpoints appear in legitimate code. Require the custom marker or multiple injection behaviors in a compatible relay role.',
  },
  {
    id: 'bigbear-control-plane',
    kit: 'BigBear 2.0',
    title: 'Centralized affiliate control plane',
    sampleType: 'Panel / infrastructure topology',
    observed: 'CloudSEK observed the campaign in June–September 2026',
    evidence:
      'Source-backed operator-panel observations; public record is sanitized',
    confidence: 'high',
    source: {
      label: 'CloudSEK — Tracking BigBear 2.0 Evilginx2 campaign',
      url: 'https://www.cloudsek.com/blog/tracking-bigbear-2-0-evilginx2-phishing-campaign',
    },
    nodeIds: ['relay', 'operator', 'postauth'],
    artifacts: [
      {
        type: 'Fleet topology',
        value: '42 managed VPS nodes · centralized panel',
        stability: 'contextual',
        meaning:
          'Multi-node lifecycle and role-based panel support the PhaaS operating model.',
      },
      {
        type: 'DNS / certificate dependency',
        value: 'wildcard DNS · Let’s Encrypt HTTP-01',
        stability: 'contextual',
        meaning:
          'Each victim-facing relay needs hostname routing and certificate issuance; shared by benign systems, so use only as topology.',
      },
      {
        type: 'Evasion layer',
        value: '69-country residential proxy pool · geo matching',
        stability: 'durable',
        meaning:
          'Upstream relay context is selected to resemble the victim geography and defeat simple location controls.',
      },
      {
        type: 'Automation chain',
        value: 'capture → Telegram notice → cookie file → replay API',
        stability: 'durable',
        meaning:
          'The panel turns session theft into near-real-time affiliate use.',
      },
    ],
    queries: [
      {
        provider: 'Certificate Transparency',
        query:
          'Source-seeded historical domains → subdomain and issuance timeline',
        note: 'Use only the defanged source appendix as seeds. Publish aggregate lineage, not a live indicator list.',
        url: 'https://crt.sh/',
      },
      {
        provider: 'URLScan',
        query: 'Source-seeded domain set AND date:[2026-06-01 TO 2026-09-08]',
        note: 'Reconstruct historical page and resource relationships without submitting or visiting targets.',
        url: 'https://urlscan.io/search/',
      },
    ],
    chokepoint:
      'A PhaaS fleet still depends on repeatable provisioning, certificate issuance, panel-to-node management, exfiltration, and identity-side token use.',
    blockGuidance:
      'Treat source indicators as historical leads. Block only currently validated infrastructure; pair containment with session revocation and phishing-resistant MFA.',
    falsePositiveBoundary:
      'VPS hosting, Let’s Encrypt, wildcard DNS, residential proxies, and Telegram are all shared services. None is a standalone selector.',
  },
  {
    id: 'tycoon-websocket-controller',
    kit: 'Tycoon 2FA',
    title: 'WebSocket relay controller',
    sampleType: 'JavaScript / HTTP body',
    observed: 'Elastic research published 2026-05-26',
    evidence: 'Public source analysis of observed kit variants',
    confidence: 'high',
    source: {
      label: 'Elastic Security Labs — Tycoon 2FA detection engineering',
      url: 'https://www.elastic.co/security-labs/tycoon-2fa-aitm-detection-engineering',
    },
    nodeIds: ['gate', 'relay'],
    artifacts: [
      {
        type: 'Socket.IO event',
        value: 'recieveid',
        stability: 'durable',
        meaning:
          'Misspelled controller event reported across observed Tycoon variants.',
      },
      {
        type: 'Library',
        value: 'Socket.IO 4.6.0',
        stability: 'contextual',
        meaning:
          'Supports the bidirectional relay, but is common software and cannot identify the kit alone.',
      },
      {
        type: 'Crypto implementation',
        value: 'CryptoJS 4.2.0 + AES-CBC',
        stability: 'contextual',
        meaning:
          'Implementation detail that becomes useful when joined to the event typo.',
      },
      {
        type: 'Static implementation value',
        value: '1234567890123456',
        stability: 'volatile',
        meaning:
          'Reported hardcoded value; searchable but easy for an operator to change.',
      },
    ],
    queries: [
      {
        provider: 'Shodan',
        query: 'http.html:"recieveid"',
        note: 'Search existing HTTP banners. Treat every result as a candidate until independently corroborated.',
        url: 'https://www.shodan.io/search?query=http.html%3A%22recieveid%22',
      },
      {
        provider: 'Censys',
        query: 'host.services.endpoints.http.body: "recieveid"',
        note: 'Search the indexed HTTP body, then preserve host, port, protocol, name, and observation time.',
        url: 'https://platform.censys.io/search',
      },
      {
        provider: 'URLScan',
        query:
          'page.url:*/auth/* AND filename:"*.js" AND NOT page.domain:microsoftonline.com',
        note: 'Use the route to find historical web captures, then inspect scripts for the second artifact.',
        url: 'https://urlscan.io/search/',
      },
    ],
    chokepoint:
      'The relay must coordinate victim state with an upstream identity session. Shared controller code can leak across deployments even when domains rotate.',
    blockGuidance:
      'Block a confirmed domain, IP, or exact malicious URL after validation. Hunt on the artifact tuple. Do not block Socket.IO or CryptoJS globally.',
    falsePositiveBoundary:
      'Socket.IO and CryptoJS are common. The typo is stronger, but a result still needs a compatible role, time, and independent artifact before attribution.',
  },
  {
    id: 'tycoon-entra-relay',
    kit: 'Tycoon 2FA',
    title: 'Server-side identity relay',
    sampleType: 'Entra sign-in telemetry',
    observed: 'Elastic research published 2026-05-26',
    evidence: 'Public source analysis of tenant telemetry',
    confidence: 'high',
    source: {
      label: 'Elastic Security Labs — Microsoft relay telemetry',
      url: 'https://www.elastic.co/security-labs/tycoon-2fa-aitm-detection-engineering',
    },
    nodeIds: ['relay', 'identity', 'operator'],
    artifacts: [
      {
        type: 'User-agent family',
        value: 'node · axios/1.15.2 · node-fetch/1.0 · undici',
        stability: 'volatile',
        meaning:
          'Server-side HTTP clients appearing in authentication telemetry.',
      },
      {
        type: 'Operational relation',
        value: 'cloud/VPS → residential context · same UPN · 10–20 min',
        stability: 'durable',
        meaning:
          'Two-tier transition tying automated relay activity to later operator use.',
      },
      {
        type: 'Client application',
        value: 'OfficeHome / Microsoft Authentication Broker',
        stability: 'contextual',
        meaning:
          'High-value application context, shared with legitimate and other malicious flows.',
      },
    ],
    queries: [
      {
        provider: 'Microsoft Sentinel',
        query:
          'SigninLogs | where UserAgent has_any ("axios", "node-fetch", "undici") | project TimeGenerated, UserPrincipalName, AppDisplayName, IPAddress, UserAgent',
        note: 'Run only in a tenant you are authorized to investigate. Correlate results before containment.',
        url: 'https://learn.microsoft.com/azure/sentinel/',
      },
      {
        provider: 'Elastic Security',
        query:
          'azure.signinlogs.properties.user_agent:(*axios* or *node-fetch* or *undici*)',
        note: 'Start with identity telemetry; enrich IP context after finding the sign-in.',
        url: 'https://www.elastic.co/security/siem',
      },
    ],
    chokepoint:
      'Every successful relay must touch the real identity provider. The user, client, protocol, time, and context transition survive infrastructure churn.',
    blockGuidance:
      'Contain the identity first: disable the account, delete attacker-registered devices, revoke sessions, then reset credentials. Block confirmed egress infrastructure as a parallel action.',
    falsePositiveBoundary:
      'Developers and automation may legitimately use Node.js clients. Require a high-value app, unexpected user context, and the surrounding sequence.',
  },
  {
    id: 'sneaky-decoy-template',
    kit: 'Sneaky 2FA',
    title: 'Food-decoy deployment tuple',
    sampleType: 'HTML / route structure',
    observed: 'Sekoia research published 2025-06',
    evidence: 'Public source analysis of observed Sneaky 2FA pages',
    confidence: 'high',
    source: {
      label: 'Sekoia — global analysis of AiTM phishing threats',
      url: 'https://blog.sekoia.io/wp-content/uploads/2025/06/Sekoia_io___Global_analysis_of_Adversary_in_the_Middle_phishing_threats.pdf',
    },
    nodeIds: ['delivery', 'gate', 'relay'],
    artifacts: [
      {
        type: 'HTML comment',
        value: '<!-- Food Section -->',
        stability: 'durable',
        meaning:
          'Template residue in food-themed decoy content across observed page stages.',
      },
      {
        type: 'Route structure',
        value: '/[A-Za-z0-9]{120,170}/(index|verify|validate)',
        stability: 'contextual',
        meaning:
          'Unusually long generated path followed by a small set of page-stage names.',
      },
      {
        type: 'Page title set',
        value:
          'Verify your account · Confirm your login · Verify your identity',
        stability: 'volatile',
        meaning: 'Useful only when combined with the HTML or route artifact.',
      },
    ],
    queries: [
      {
        provider: 'Shodan',
        query: 'http.html:"Food Section"',
        note: 'Review the returned HTML and hosting context; the phrase may appear in benign templates.',
        url: 'https://www.shodan.io/search?query=http.html%3A%22Food%20Section%22',
      },
      {
        provider: 'Censys',
        query: 'host.services.endpoints.http.body: "Food Section"',
        note: 'Bind any match to a service tuple and check for the long-path or title artifact.',
        url: 'https://platform.censys.io/search',
      },
      {
        provider: 'URLScan',
        query:
          'page.url:*validate* AND page.title:("Verify your account" OR "Confirm your login")',
        note: 'Use a bounded date interval and inspect the historical request graph.',
        url: 'https://urlscan.io/search/',
      },
    ],
    chokepoint:
      'Affiliate domains rotate, but affiliates repeatedly deploy the same staged template and qualification flow.',
    blockGuidance:
      'Block confirmed phishing hosts and exact routes. Hunt on HTML plus route/title co-occurrence. Never block the legitimate challenge provider or Microsoft destination.',
    falsePositiveBoundary:
      'Food-related text and Microsoft-themed titles are individually generic. Require the deployment tuple and a source-compatible role.',
  },
];

export const defenderTransitions = [
  {
    edge: 'Delivery → gate',
    question: 'Which redirect and resource relationships survive domain churn?',
    evidence: 'SWG logs · URL archive',
    action: 'Retain full URL and redirect-chain telemetry.',
  },
  {
    edge: 'Gate → relay',
    question:
      'Which route, script, or protocol tuple identifies the deployment?',
    evidence: 'HTTP resources · DOM · WebSocket metadata',
    action: 'Require two artifacts before labeling a kit.',
  },
  {
    edge: 'Relay → identity',
    question: 'What did the relay leak into the legitimate sign-in?',
    evidence: 'Entra user-agent · app · protocol · ASN',
    action: 'Correlate Node.js clients with the user and application.',
  },
  {
    edge: 'Identity → operator',
    question: 'Did the same identity move to a second infrastructure class?',
    evidence: 'UPN · time · IP class · user-agent',
    action: 'Join Tier-1 and Tier-2 events inside twenty minutes.',
  },
  {
    edge: 'Operator → cloud',
    question: 'What machine-speed actions followed capture?',
    evidence: 'Graph · Exchange · directory audit',
    action: 'Sequence recon, mailbox, rule, and device events.',
  },
];

export const infraSources = [
  {
    label: 'CloudSEK — Tracking BigBear 2.0 Evilginx2 campaign',
    url: 'https://www.cloudsek.com/blog/tracking-bigbear-2-0-evilginx2-phishing-campaign',
  },
  {
    label: 'Sekoia — global analysis of AiTM phishing threats',
    url: 'https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/',
  },
  {
    label: 'Sekoia — Tycoon 2FA in-depth analysis',
    url: 'https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/',
  },
  {
    label: 'Elastic Security Labs — Tycoon 2FA detection engineering',
    url: 'https://www.elastic.co/security-labs/tycoon-2fa-aitm-detection-engineering',
  },
  {
    label: 'Zeltoc — Sneaky 2FA real-world phishing analysis',
    url: 'https://github.com/Zeltoc/phishing-analysis-sneaky2fa-aitm',
  },
];
