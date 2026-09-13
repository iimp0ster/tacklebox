import type { ReactNode } from 'react';

type GuideAuthenticationModelProps = {
  objectType: 'KIT / PHAAS' | 'CROSS-KIT PATTERN';
  primary: string;
  relationship?: {
    label: string;
    href?: string;
    evidenceHref?: string;
    evidenceLabel?: string;
  };
  children?: ReactNode;
};

export default function GuideAuthenticationModel({
  objectType,
  primary,
  relationship,
  children,
}: GuideAuthenticationModelProps) {
  return (
    <section className="guide-authentication-model" aria-label="Authentication model">
      <span className="guide-object-type">{objectType}</span>
      <p>
        <b>Primary:</b> {primary}
      </p>
      {relationship && (
        <p className="guide-authentication-relationship">
          {relationship.href ? (
            <a href={relationship.href}>{relationship.label}</a>
          ) : (
            <span>{relationship.label}</span>
          )}
          {relationship.evidenceHref && (
            <>
              {' '}
              <a
                className="guide-evidence-link"
                href={relationship.evidenceHref}
                target="_blank"
                rel="noreferrer"
              >
                {relationship.evidenceLabel ?? 'Source'}
              </a>
            </>
          )}
        </p>
      )}
      {children}
    </section>
  );
}
