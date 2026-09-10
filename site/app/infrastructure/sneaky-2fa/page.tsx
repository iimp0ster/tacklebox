/* oxlint-disable next/no-html-link-for-pages, next/no-img-element -- Vinext 1.0 beta emits runtime prefetch errors for next/link on this static route. */
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { infraSources } from '../../content/infrastructure';
import SneakyInfrastructureMap from '../SneakyInfrastructureMap';

export const metadata: Metadata = {
  title: 'Sneaky 2FA infrastructure and lure anatomy — Tacklebox',
  description:
    'An evidence-bound Sneaky 2FA attack graph, lure anatomy, and reproducible passive hunt.',
};

const sneakyInfraSources = infraSources.filter(
  (source) =>
    source.label.includes('Sneaky') || source.label.includes('global analysis'),
);

export default function SneakyInfrastructurePage() {
  return (
    <main className="detail-site infra-detail-site">
      <header className="detail-nav">
        <a href="/" className="detail-brand">
          <img src="/tacklebox-logo.png" alt="" />
          <span>TACKLEBOX</span>
        </a>
        <a href="/#field-guides">All kit field guides</a>
      </header>
      <div className="infra-map-wrap">
        <a className="back-link" href="/#field-guides">
          <ArrowLeft size={16} /> Back to all kit field guides
        </a>
        <section className="infra-map-hero">
          <div>
            <p className="eyebrow">
              SNEAKY 2FA // INFRASTRUCTURE + LURE ANATOMY
            </p>
            <h1>
              Follow the flow.
              <br />
              <em>Defend the edges.</em>
            </h1>
          </div>
          <aside>
            <ShieldCheck />
            <div>
              <b>Safety boundary</b>
              <p>
                Passive historical telemetry only. No scanning, target
                interaction, credential capture, or live IOC publication.
              </p>
            </div>
          </aside>
        </section>
        <SneakyInfrastructureMap />
        <section className="infra-provenance">
          <div>
            <p className="section-number">PROVENANCE</p>
            <h2>Architecture sources</h2>
          </div>
          <div className="source-list">
            {sneakyInfraSources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>{source.label}</span>
                <ExternalLink size={15} />
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
