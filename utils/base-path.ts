/**
 * Base path de déploiement web.
 * - Vercel / local / natif : "" (l'app est servie à la racine).
 * - GitHub Pages : "/<nom-du-repo>" (injecté au build via EXPO_PUBLIC_BASE_PATH).
 */
const rawBase = (process.env.EXPO_PUBLIC_BASE_PATH ?? "").trim();

export const BASE_PATH = rawBase.replace(/\/+$/, "");

/** Prefixe un chemin absolu avec le base path courant. */
export function withBase(pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${BASE_PATH}${normalized}`;
}
