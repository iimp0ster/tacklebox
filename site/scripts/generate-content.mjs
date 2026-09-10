import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPublicClaims } from './public-claims.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const repoRoot = process.env.TACKLEBOX_REPO_ROOT
  ? resolve(process.env.TACKLEBOX_REPO_ROOT)
  : resolve(siteRoot, '..');
const atomicsRoot = join(repoRoot, 'atomics');
const kitsRoot = join(repoRoot, 'intel', 'kits');
const evidenceRoot = join(siteRoot, 'content', 'evidence');
const outputPath = join(siteRoot, 'app', 'content', 'generated.json');

if (!existsSync(atomicsRoot) || !existsSync(kitsRoot)) {
  if (!existsSync(outputPath))
    throw new Error(
      'Tacklebox corpus unavailable and no generated content exists.',
    );
  console.log(
    'Tacklebox corpus unavailable; using checked-in generated content.',
  );
  process.exit(0);
}

const clean = (value = '') => value.trim().replace(/^['"]|['"]$/g, '');
const scalar = (source, key) =>
  clean(source.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '');
const nestedScalar = (source, indent, key) =>
  clean(
    source.match(new RegExp(`^\\s{${indent}}${key}:\\s*(.+)$`, 'm'))?.[1] ?? '',
  );
const block = (source, indent, key) => {
  const match = source.match(
    new RegExp(
      `^\\s{${indent}}${key}:\\s*\\|\\s*\\r?\\n([\\s\\S]*?)(?=^\\s{${indent}}[a-zA-Z_]|\\Z)`,
      'm',
    ),
  );
  if (!match) return '';
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.replace(new RegExp(`^\\s{${indent + 2}}`), ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};
const literalBlock = (source, indent, key) => {
  const match = source.match(
    new RegExp(
      `^[ ]{${indent}}${key}:\\s*\\|\\s*\\r?\\n([\\s\\S]*?)(?=^[ ]{0,${indent}}[a-zA-Z_][a-zA-Z0-9_]*:|$(?![\\s\\S]))`,
      'm',
    ),
  );
  if (!match) return '';
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.replace(new RegExp(`^\\s{${indent + 2}}`), ''))
    .join('\n')
    .trim();
};
const section = (source, indent, key) =>
  source.match(
    new RegExp(
      `^\\s{${indent}}${key}:.*\\r?\\n([\\s\\S]*?)(?=^\\s{${indent}}[a-zA-Z_]|\\Z)`,
      'm',
    ),
  )?.[1] ?? '';
const titleCase = (slug) =>
  slug
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');

const parseInputArguments = (source) => {
  const body = section(source, 4, 'input_arguments');
  return [
    ...body.matchAll(
      /^[ ]{6}([a-zA-Z0-9_]+):\s*\r?\n([\s\S]*?)(?=^[ ]{6}[a-zA-Z0-9_]+:\s*$|$(?![\s\S]))/gm,
    ),
  ].map((match) => ({
    name: match[1],
    description: clean(
      match[2].match(/^\s{8}description:\s*(.+)$/m)?.[1] ?? '',
    ),
    type: clean(match[2].match(/^\s{8}type:\s*(.+)$/m)?.[1] ?? 'String'),
    default: clean(match[2].match(/^\s{8}default:\s*(.+)$/m)?.[1] ?? ''),
  }));
};

const phaseFor = (technique, displayName) => {
  if (/Device Code Phishing/i.test(displayName)) return 'Initial access';
  if (/\u2013/.test(displayName)) return displayName.split(/\s*\u2013\s*/)[0];
  const map = {
    T1087: 'Discovery',
    T1098: 'Persistence',
    T1114: 'Collection',
    T1213: 'Collection',
    T1528: 'Credential access',
    T1534: 'Impact',
    T1539: 'Credential access',
    T1550: 'Defense evasion',
    T1566: 'Initial access',
    T1621: 'Credential access',
  };
  return (
    Object.entries(map).find(([prefix]) => technique.startsWith(prefix))?.[1] ??
    'Cloud identity'
  );
};

const kitDirectories = readdirSync(kitsRoot, { withFileTypes: true }).filter(
  (entry) => entry.isDirectory() && entry.name !== '_shared',
);
const kits = kitDirectories.map((entry) => {
  const root = join(kitsRoot, entry.name);
  const files = readdirSync(root, { withFileTypes: true });
  const fingerprintPath = join(root, 'fingerprints.yaml');
  const fingerprintSource = existsSync(fingerprintPath)
    ? readFileSync(fingerprintPath, 'utf8')
    : '';
  const atomicsPath = join(root, 'atomics');
  const atomicFiles = existsSync(atomicsPath)
    ? readdirSync(atomicsPath).filter((name) => /\.ya?ml$/i.test(name))
    : [];
  return {
    slug: entry.name,
    name:
      scalar(fingerprintSource, 'display_name') ||
      titleCase(entry.name).replace(/2fa/i, '2FA'),
    observation: files.some((file) => file.name === 'observation.md'),
    fingerprints: (fingerprintSource.match(/^\s{2}- id:/gm) ?? []).length,
    chokepoints: files.some((file) => file.name === 'chokepoints.md'),
    rig: files.some((file) => file.name === 'rig.draft.yaml'),
    atomicFiles,
  };
});

const atomics = readdirSync(atomicsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const root = join(atomicsRoot, entry.name);
    const yamlName = readdirSync(root).find((name) => /\.ya?ml$/i.test(name));
    if (!yamlName) return null;
    const source = readFileSync(join(root, yamlName), 'utf8');
    const technique = scalar(source, 'attack_technique');
    const displayName = scalar(source, 'display_name');
    const references =
      section(source, 4, 'references').match(/https?:\/\/[^\s"']+/g) ?? [];
    const telemetrySources = [
      ...new Set(
        [...source.matchAll(/^\s{6}- source:\s*['"]?([^\s"']+)/gm)].map(
          (match) => match[1],
        ),
      ),
    ];
    const supportedPlatforms = [
      ...source.matchAll(/^\s{6}-\s+(windows|linux|macos)\s*$/gm),
    ].map((match) => match[1]);
    const mappedKits = kits
      .filter((kit) =>
        kit.atomicFiles.some((name) => name.startsWith(technique)),
      )
      .map((kit) => kit.name);
    const featured = [
      'T1078.004-suspicious-ua-signin',
      'T1078.004-device-code',
      'T1087.004-graph-enumeration',
      'T1098.005-device-registration-prt',
    ].includes(entry.name);
    const strongTechniques = [
      'T1087.004',
      'T1114.002',
      'T1114.003',
      'T1213.002',
      'T1528',
    ];
    return {
      slug: entry.name,
      technique,
      displayName,
      testName: clean(
        source.match(/^\s{2}- name:\s*(.+)$/m)?.[1] ?? displayName,
      ),
      description: block(source, 4, 'description'),
      executor: nestedScalar(source, 6, 'name'),
      executorCommand: literalBlock(source, 6, 'command'),
      elevationRequired:
        nestedScalar(source, 6, 'elevation_required') === 'true',
      cleanupCommand: literalBlock(source, 4, 'cleanup_command'),
      inputArguments: parseInputArguments(source),
      supportedPlatforms,
      phase: phaseFor(technique, displayName),
      authProfile: nestedScalar(source, 4, 'auth_profile'),
      defenseEvasion: nestedScalar(source, 4, 'defense_evasion'),
      telemetrySources,
      mappedKits,
      chokepointId: source.match(/^\s{6}id:\s*['"]?([^\s"']+)/m)?.[1] ?? '',
      chokepointUrl:
        source.match(/^\s{6}url:\s*['"]?(https?:\/\/[^\s"']+)/m)?.[1] ?? '',
      references,
      hasCleanup: /^\s{4}cleanup_command:/m.test(source),
      fidelity: strongTechniques.includes(technique) ? 'strong' : 'partial',
      featured,
    };
  })
  .filter(Boolean)
  .sort(
    (a, b) =>
      a.technique.localeCompare(b.technique) || a.slug.localeCompare(b.slug),
  );

const telemetrySources = [
  ...new Set(atomics.flatMap((atomic) => atomic.telemetrySources)),
];
const evidenceClaims = loadPublicClaims(evidenceRoot);
const content = {
  stats: {
    atomics: atomics.length,
    kits: kits.length,
    telemetrySources: telemetrySources.length,
    evidenceClaims: evidenceClaims.length,
    safetyGate: '100%',
  },
  atomics,
  kits: kits.map(({ atomicFiles, ...kit }) => ({
    ...kit,
    atomics: atomicFiles.length,
  })),
  evidenceClaims,
};

// Keep validation builds reproducible. A timestamp-only rewrite makes every UI
// gate dirty the checkout and hides meaningful content changes in review.
if (existsSync(outputPath)) {
  const previous = JSON.parse(readFileSync(outputPath, 'utf8'));
  const previousContent = {
    stats: previous.stats,
    atomics: previous.atomics,
    kits: previous.kits,
    evidenceClaims: previous.evidenceClaims ?? [],
  };
  if (JSON.stringify(previousContent) === JSON.stringify(content)) {
    console.log(
      `Generated content unchanged (${atomics.length} atomics, ${kits.length} kit profiles).`,
    );
    process.exit(0);
  }
}

const output = { generatedAt: new Date().toISOString(), ...content };

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `Generated ${atomics.length} atomics and ${kits.length} kit profiles.`,
);
