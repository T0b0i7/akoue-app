/**
 * Expo config dynamique.
 * - En local / Vercel / EAS : aucune base URL (l'app est servie à la racine).
 * - Sur GitHub Pages : EXPO_PUBLIC_BASE_PATH=/<nom-du-repo> est injecté par le
 *   workflow pour que les assets et les routes fonctionnent dans un sous-dossier.
 */
module.exports = ({ config }) => {
  const basePath = (process.env.EXPO_PUBLIC_BASE_PATH || process.env.EXPO_BASE_URL || '').replace(/\/+$/, '');

  return {
    ...config,
    experiments: {
      ...(config.experiments || {}),
      ...(basePath ? { baseUrl: basePath } : {}),
    },
  };
};
