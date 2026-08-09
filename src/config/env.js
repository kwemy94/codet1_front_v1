/**
 * Configuration centrale de l'application.
 *
 * L'URL de base du backend est définie UNE SEULE FOIS ici et consommée par
 * l'ensemble des services via `src/services/httpClient.js`. Aucun composant,
 * aucune page ne doit référencer une URL en dur.
 */
export const CONFIG = {
  /** Racine de l'API, sans le segment de version. */
  URL_API_BASE: import.meta.env.VITE_URL_API ?? 'http://localhost:8000/api',

  /** Version de l'API consommée. */
  VERSION_API: import.meta.env.VITE_VERSION_API ?? 'v1',

  NOM_COMITE: import.meta.env.VITE_NOM_COMITE ?? 'CODET I',

  DEVISE: 'FCFA',

  /** Délai maximum d'une requête, en millisecondes. */
  DELAI_REQUETE: 20000,

  /** Clé de persistance du jeton d'authentification. */
  CLE_STOCKAGE_SESSION: 'codet1.session',

  PAGINATION_DEFAUT: 25,
};

/** URL complète de l'API, versionnée. Exemple : http://localhost:8000/api/v1 */
export const urlApi = () => `${CONFIG.URL_API_BASE.replace(/\/$/, '')}/${CONFIG.VERSION_API}`;

export default CONFIG;
