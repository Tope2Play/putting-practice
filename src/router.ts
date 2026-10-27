import { useEffect, useState } from 'preact/hooks';

export const navigate = (path: string, replace = false) => {
  const url = '#' + path;
  if (replace) location.replace(url);
  else location.hash = path;
};

export const back = (fallback = '/') => {
  if (history.length > 1) history.back();
  else navigate(fallback, true);
};

const current = () => location.hash.replace(/^#/, '') || '/';

export function useRoute() {
  const [path, setPath] = useState(current);
  useEffect(() => {
    const on = () => {
      setPath(current());
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return path;
}

/** match('/drill/:id', '/drill/abc') → { id: 'abc' } */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/');
  const s = path.split('?')[0].split('/');
  if (p.length !== s.length) return null;
  const out: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) out[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return out;
}
