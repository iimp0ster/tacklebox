'use client';

import { useEffect } from 'react';
import { sitePath } from '../../../lib/site-path';

export default function LegacyTycoonDossierPage() {
  const destination = sitePath('/infrastructure/tycoon-2fa');

  useEffect(() => {
    window.location.replace(destination);
  }, [destination]);

  return (
    <main className="detail-page">
      <section className="detail-section">
        <p className="eyebrow">TYCOON 2FA</p>
        <h1>This field guide has moved.</h1>
        <a className="button-primary" href={destination}>
          Open the infrastructure and lure anatomy
        </a>
      </section>
    </main>
  );
}
