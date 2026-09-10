export type TradecraftFidelityValue = {
  input: string;
  labDefault: string;
  sourceObserved: string;
  kit: string;
  effect: string;
  status: 'ready' | 'gap';
};

export type AtomicTradecraftProfile = {
  summary: string;
  values: TradecraftFidelityValue[];
  source: { label: string; url: string };
};

const elasticTycoon = {
  label: 'Elastic Security Labs — Tycoon 2FA detection engineering',
  url: 'https://www.elastic.co/security-labs/threat-command/tycoon-2fa-aitm-detection-engineering',
};

export const atomicTradecraftBySlug: Record<string, AtomicTradecraftProfile> = {
  'T1078.004-suspicious-ua-signin': {
    summary:
      'Elastic observed Tycoon relay-tier requests reaching Microsoft with Node.js HTTP-client user agents. Replacing the generic lab user agent with one of these strings exercises the same identity-side field used by the published hunt.',
    values: [
      {
        input: 'user_agent',
        labDefault: 'python-requests/2.31.0',
        sourceObserved: 'axios/1.15.2 · node-fetch/1.0 · undici · node',
        kit: 'Tycoon 2FA',
        effect:
          'Raises fidelity for the server-side relay-client context visible in Entra sign-in telemetry.',
        status: 'ready',
      },
    ],
    source: elasticTycoon,
  },
  'T1078.004-device-code': {
    summary:
      'Elastic documented a Tycoon variant requesting the device flow as Microsoft Authentication Broker, then presenting the user code through a verification-code lure.',
    values: [
      {
        input: 'client_id',
        labDefault: '04b07795-8ddb-461a-bbee-02f9e1bf7b46 (Azure CLI)',
        sourceObserved:
          '29d9ed98-a469-4536-ade2-f981bc1d605e (Microsoft Authentication Broker)',
        kit: 'Tycoon 2FA',
        effect:
          'Changes the first-party application context to the client used by the reported device-code variant.',
        status: 'ready',
      },
    ],
    source: elasticTycoon,
  },
  'T1087.004-graph-enumeration': {
    summary:
      'The observed operator console queried multiple Graph reconnaissance categories in a tightly compressed burst. The promoted atomic covers three categories, so the malicious-shape comparison is useful but not yet complete.',
    values: [
      {
        input: 'request pattern',
        labDefault: '3 categories · bounded result sets',
        sourceObserved: '20–30+ calls · 5 categories · 30–60 seconds',
        kit: 'Tycoon 2FA',
        effect:
          'Adds the volume, category diversity, and timing compression used by the correlation rule.',
        status: 'gap',
      },
    ],
    source: elasticTycoon,
  },
  'T1098.005-device-registration-prt': {
    summary:
      'Elastic observed device registration and PRT acquisition following the Tycoon relay, including registration from a non-native Node.js client context. The current atomic reproduces the device lifecycle but does not yet expose the user-agent override.',
    values: [
      {
        input: 'registration user agent',
        labDefault: 'roadtx client default',
        sourceObserved: 'axios/1.15.2',
        kit: 'Tycoon 2FA',
        effect:
          'Would align the registration event with the reported relay client, but requires a future atomic input.',
        status: 'gap',
      },
    ],
    source: elasticTycoon,
  },
};
