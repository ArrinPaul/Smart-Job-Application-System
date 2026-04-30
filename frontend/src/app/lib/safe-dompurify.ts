import dompurifyImport from 'dompurify';

type Purifier = {
  sanitize: (dirtyHtml: string) => string;
};

let purifier: Purifier | null = null;

function resolvePurifier(): Purifier | null {
  if (purifier) return purifier;
  if (typeof window === 'undefined') return null;

  const mod: any = dompurifyImport as any;

  if (mod && typeof mod.sanitize === 'function') {
    purifier = mod as Purifier;
    return purifier;
  }

  if (typeof mod === 'function') {
    const created = mod(window);
    if (created && typeof created.sanitize === 'function') {
      purifier = created as Purifier;
      return purifier;
    }
  }

  const def = mod?.default;

  if (def && typeof def.sanitize === 'function') {
    purifier = def as Purifier;
    return purifier;
  }

  if (typeof def === 'function') {
    const created = def(window);
    if (created && typeof created.sanitize === 'function') {
      purifier = created as Purifier;
      return purifier;
    }
  }

  return null;
}

export function sanitizeHtml(dirtyHtml: string): string {
  const activePurifier = resolvePurifier();
  if (!activePurifier) return dirtyHtml;
  return activePurifier.sanitize(dirtyHtml);
}
