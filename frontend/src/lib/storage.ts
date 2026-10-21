// Storage can be blocked in private browsing or by institution policies.
export const storage = {
  get(key: string, session = false): string | null {
    try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return null; }
  },
  set(key: string, value: string, session = false) {
    try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* Memory-only fallback. */ }
  },
  remove(key: string, session = false) {
    try { (session ? sessionStorage : localStorage).removeItem(key); } catch { /* Already unavailable. */ }
  },
};
