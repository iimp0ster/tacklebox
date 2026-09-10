export type KitGuideEntry = {
  kitName: string;
  status: 'published' | 'evidence-gathering';
  fieldGuideRoute?: string;
  summary: string;
};

export const kitGuideEntries: KitGuideEntry[] = [
  {
    kitName: 'Sneaky 2FA',
    status: 'published',
    fieldGuideRoute: '/infrastructure/sneaky-2fa',
    summary:
      'Source-observed lure, qualification gates, relay path, and defender telemetry.',
  },
  {
    kitName: 'Tycoon 2FA',
    status: 'published',
    fieldGuideRoute: '/infrastructure/tycoon-2fa',
    summary:
      'Two-tier relay, lure qualification, session use, and post-authentication activity.',
  },
  {
    kitName: 'BigBear 2.0',
    status: 'evidence-gathering',
    summary: 'Infrastructure and lure evidence pending.',
  },
];
