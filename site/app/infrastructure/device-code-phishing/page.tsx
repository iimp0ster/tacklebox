/* oxlint-disable next/no-html-link-for-pages, next/no-img-element -- static destination route */
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import GuideAuthenticationModel from '../../GuideAuthenticationModel';
import DeviceCodePhishingMap from '../DeviceCodePhishingMap';

export const metadata: Metadata = {
  title: 'Device Code Phishing lure and identity anatomy — Tacklebox',
  description: 'An evidence-bound device-code phishing attack graph, lure anatomy, token boundary, and defender telemetry.',
};

export default function DeviceCodePhishingPage() {
  return (
    <main className="detail-site infra-detail-site">
      <header className="detail-nav"><a href="/" className="detail-brand"><img src="/tacklebox-logo.png" alt="" /><span>TACKLEBOX</span></a><a href="/#field-guides">All field guides</a></header>
      <div className="infra-map-wrap">
        <a className="back-link" href="/#field-guides"><ArrowLeft size={16} /> Back to all field guides</a>
        <section className="infra-map-hero">
          <div><p className="eyebrow">DEVICE CODE PHISHING // LURE + IDENTITY ANATOMY</p><h1>Follow the code.<br /><em>Correlate the token.</em></h1></div>
          <aside className="publication-gate"><ShieldCheck /><div><b>Tacklebox evidence gate · candidate</b><p>Complementary retained reports cover lure delivery and token use. Microsoft documentation grounds the protocol sequence. BAS validation remains separate.</p></div></aside>
        </section>
        <GuideAuthenticationModel objectType="CROSS-KIT PATTERN" primary="OAuth device authorization">
          <p>No interactive credential relay.</p>
        </GuideAuthenticationModel>
        <DeviceCodePhishingMap />
        <section className="readiness-limitations"><div><p className="section-number">CONTROLLED VALIDATION</p><h2>Test the identity-side behavior</h2></div><p>The existing lab-safe Atomic exercises the device-code authentication boundary without operating a phishing service.</p><a className="button-secondary" href="/atomics/T1078.004-device-code">Test this behavior</a></section>
        <section className="readiness-limitations"><div><p className="section-number">EVIDENCE LIMITS</p><h2>What this guide does not claim</h2></div><ul><li>Device-code phishing is an authentication pattern, not attribution to a specific phishing kit.</li><li>Shared SaaS services and Microsoft identity endpoints are not malicious infrastructure.</li><li>Exact client, token, and post-authentication fields remain research-required unless a cited report states them.</li><li>Use T1528 for obtaining access tokens and T1550.001 for using stolen application tokens. T1078.004 describes resulting cloud-account use; it does not replace those procedure distinctions.</li></ul></section>
        <section className="infra-provenance"><div><p className="section-number">PROVENANCE</p><h2>Architecture sources</h2></div><div className="source-list">
            <a href="https://www.huntress.com/blog/tradecraft-tuesday-device-code-phishing-explained" target="_blank" rel="noreferrer"><span>We Need to Talk About Device Code Phishing</span></a>
            <a href="https://www.linkedin.com/posts/unit42_four-evasion-techniques-deliver-stealthy-activity-7486530417232224256-TE4R" target="_blank" rel="noreferrer"><span>Device code phishing evasion techniques</span></a>
            <a href="https://www.huntress.com/blog/device-code-phishing-evolving-threats" target="_blank" rel="noreferrer"><span>Device Code Phishing Keeps Evolving. Here’s What to Watch For</span></a>
            <a href="https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code" target="_blank" rel="noreferrer"><span>Microsoft identity platform — OAuth 2.0 device authorization grant</span></a>
            <a href="https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/signinlogs" target="_blank" rel="noreferrer"><span>Microsoft Learn — SigninLogs table schema</span></a>
        </div></section>
      </div>
    </main>
  );
}
