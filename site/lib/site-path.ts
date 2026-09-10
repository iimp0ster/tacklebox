const configuredBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';

export const siteBasePath = configuredBasePath.replace(/\/$/, '');

export function sitePath(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteBasePath}${normalizedPath}`;
}
