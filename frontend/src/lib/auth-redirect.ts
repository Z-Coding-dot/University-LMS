// Location state is untrusted. Only keep local application paths after login.
export function authDestination(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || Array.from(value).some(char => char.charCodeAt(0) <= 32)) return '/';
  const url = new URL(value, 'https://campus.invalid');
  const pathname = url.pathname;
  if (['/login', '/change-password', '/403'].some(path => pathname === path || pathname.startsWith(`${path}/`))) return '/';
  return `${pathname}${url.search}${url.hash}`;
}
