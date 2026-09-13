export type GuideObjectType = 'kit_service' | 'authentication_pattern';

export type KitGuideEntry = {
  kitName: string;
  objectType: GuideObjectType;
  status: 'published' | 'evidence-gathering';
  fieldGuideRoute?: string;
  summary: string;
};

export const kitGuideEntries: KitGuideEntry[] = [
  {
    kitName: 'Sneaky 2FA',
    objectType: 'kit_service',
    status: 'published',
    fieldGuideRoute: '/infrastructure/sneaky-2fa',
    summary:
      'Source-observed lure, qualification gates, relay path, and defender telemetry.',
  },
  {
    kitName: 'Tycoon 2FA',
    objectType: 'kit_service',
    status: 'published',
    fieldGuideRoute: '/infrastructure/tycoon-2fa',
    summary:
      'Two-tier relay, lure qualification, session use, and post-authentication activity.',
  },
  {
    kitName: 'BigBear 2.0',
    objectType: 'kit_service',
    status: 'evidence-gathering',
    summary: 'Infrastructure and lure evidence pending.',
  },
  /* intelopes-field-guide:start:device-code-phishing */
  {
    kitName: 'Device Code Phishing',
    objectType: 'authentication_pattern',
    status: 'evidence-gathering',
    fieldGuideRoute: '/infrastructure/device-code-phishing',
    summary: 'Device-code request, code delivery, Microsoft authorization, token polling, issuance, use, and defender-visible joins.',
  },
  /* intelopes-field-guide:end:device-code-phishing */
];
