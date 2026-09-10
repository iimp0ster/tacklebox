import contracts from './atomic-validation.json';

export type AtomicValidationContract = {
  status: 'partial' | 'planned';
  provenance: string;
  telemetry?: { source: string; signals: string[]; window: string }[];
  validation: { query: string; pass: string; fail: string };
  cleanup: { local: string; tenant: string };
};

export const atomicValidationContracts = contracts as Record<
  string,
  AtomicValidationContract
>;
