const publicKitNames: Record<string, string | null> = {
  'Aitm Asn Signin': null,
  Eviltokens: 'EvilTokens',
  'Lapsed Domain Aitm': 'Lapsed-domain AiTM',
  Mamba: 'Mamba 2FA',
  'Storm 2372': 'Storm-2372',
  'black-queen (Evilginx fork, O365 device-code)': 'Black Queen',
  'red-queen (Evilginx fork, multi-platform relay + SRI bypass)': 'Red Queen',
};

export function toPublicKitNames(names: string[]) {
  return [
    ...new Set(
      names
        .map((name) => publicKitNames[name] ?? (name in publicKitNames ? null : name))
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort();
}
