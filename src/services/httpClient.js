import axios from 'axios';
import CONFIG, { urlApi } from '@/config/env';

/**
 * Client HTTP unique de l'application.
 *
 * Toute communication avec le backend passe par ce client : les composants
 * n'importent jamais axios directement, ils appellent un service du dossier
 * `src/services`. Ce point de passage unique porte l'URL de base, le jeton
 * d'authentification, la normalisation des erreurs et la déconnexion sur 401.
 */
const httpClient = axios.create({
  baseURL: urlApi(),
  timeout: CONFIG.DELAI_REQUETE,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/** Fourni par le store d'authentification au démarrage (évite un import circulaire). */
let lireJeton = () => null;
let surSessionExpiree = () => {};

export function brancherSession({ jeton, expiration }) {
  if (jeton) lireJeton = jeton;
  if (expiration) surSessionExpiree = expiration;
}

httpClient.interceptors.request.use((requete) => {
  const jeton = lireJeton();
  if (jeton) {
    requete.headers.Authorization = `Bearer ${jeton}`;
  }

  // Laisse le navigateur composer la frontière multipart lors d'un envoi de fichiers
  if (requete.data instanceof FormData) {
    delete requete.headers['Content-Type'];
  }

  return requete;
});

httpClient.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const statut = erreur.response?.status;

    if (statut === 401) {
      surSessionExpiree();
    }

    return Promise.reject(normaliserErreur(erreur));
  },
);

/**
 * Traduit toute panne réseau ou réponse d'erreur en un objet stable :
 * { statut, message, erreurs } — les écrans n'ont ainsi qu'une seule forme à gérer.
 */
export function normaliserErreur(erreur) {
  if (erreur.code === 'ECONNABORTED') {
    return { statut: 0, message: 'Le serveur met trop de temps à répondre. Réessayez.', erreurs: {} };
  }

  if (!erreur.response) {
    return { statut: 0, message: 'Connexion au serveur impossible. Vérifiez votre réseau.', erreurs: {} };
  }

  const { status, data } = erreur.response;

  const messages = {
    401: 'Votre session a expiré. Connectez-vous à nouveau.',
    403: "Vous n'êtes pas habilité à effectuer cette action.",
    404: 'Cet élément est introuvable.',
    422: data?.message ?? 'Certaines informations sont incorrectes.',
    500: 'Le serveur a rencontré une erreur. Réessayez dans un instant.',
  };

  return {
    statut: status,
    message: data?.message ?? messages[status] ?? 'Une erreur est survenue.',
    erreurs: data?.errors ?? {},
  };
}

/** L'API renvoie { donnees, message } : ce raccourci extrait la charge utile. */
export const extraire = (reponse) => reponse.data?.donnees ?? reponse.data;

export default httpClient;
