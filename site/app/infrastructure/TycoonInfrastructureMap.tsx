'use client';

import {
  infraSamples,
  tycoonInfraNodes,
  tycoonInfraRelations,
  tycoonInfraTraces,
  tycoonLureStages,
} from '../content/infrastructure';
import { KitInfrastructureMap } from './SneakyInfrastructureMap';
import { KitLureAnatomy } from './SneakyLureAnatomy';

const tycoonSamples = infraSamples.filter(
  (sample) => sample.kit === 'Tycoon 2FA',
);

export default function TycoonInfrastructureMap() {
  return (
    <KitInfrastructureMap
      definition={{
        kitId: 'tycoon',
        kitName: 'Tycoon 2FA',
        traceLabel: 'Tycoon trace',
        nodes: tycoonInfraNodes,
        relations: tycoonInfraRelations,
        traces: tycoonInfraTraces,
        samples: tycoonSamples,
        anatomy: (
          <KitLureAnatomy
            kitName="Tycoon 2FA"
            stages={tycoonLureStages}
            relayLabel="Tycoon relay"
            sourceBasis="Page and controller artifacts from Sekoia and Elastic source analysis; identity and two-tier relationships from Elastic tenant telemetry."
            sources={[
              {
                label: 'Kit source analysis',
                url: 'https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/',
              },
              {
                label: 'Detection engineering',
                url: 'https://www.elastic.co/security-labs/tycoon-2fa-aitm-detection-engineering',
              },
            ]}
          />
        ),
      }}
    />
  );
}
