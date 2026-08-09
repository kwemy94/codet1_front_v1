import { create } from 'zustand';
import { authService, brancherSession } from '@/services';
import CONFIG from '@/config/env';

function lireSessionStockee() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.CLE_STOCKAGE_SESSION)) ?? null;
  } catch {
    return null;
  }
}

function ecrireSessionStockee(session) {
  if (session) {
    localStorage.setItem(CONFIG.CLE_STOCKAGE_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(CONFIG.CLE_STOCKAGE_SESSION);
  }
}

const sessionInitiale = lireSessionStockee();

export const useAuthStore = create((set, get) => ({
  jeton: sessionInitiale?.jeton ?? null,
  utilisateur: sessionInitiale?.utilisateur ?? null,
  chargement: false,
  pretDemarrage: !sessionInitiale,

  estConnecte: () => Boolean(get().jeton),
  estAdministrateur: () => Boolean(get().utilisateur?.est_administrateur),
  aLaPermission: (code) => (get().utilisateur?.permissions ?? []).includes(code),

  async connexion(identifiants) {
    set({ chargement: true });
    try {
      const { jeton, utilisateur } = await authService.connexion(identifiants);
      ecrireSessionStockee({ jeton, utilisateur });
      set({ jeton, utilisateur, chargement: false, pretDemarrage: true });
      return utilisateur;
    } catch (erreur) {
      set({ chargement: false });
      throw erreur;
    }
  },

  /** Revalide le jeton conservé au démarrage de l'application. */
  async restaurer() {
    if (!get().jeton) {
      set({ pretDemarrage: true });
      return;
    }

    try {
      const utilisateur = await authService.profil();
      ecrireSessionStockee({ jeton: get().jeton, utilisateur });
      set({ utilisateur, pretDemarrage: true });
    } catch {
      get().terminerSession();
    }
  },

  /** Le serveur renvoie un jeton neuf : la session se poursuit sans reconnexion. */
  async changerMotDePasse(champs) {
    const { jeton, utilisateur } = await authService.changerMotDePasse(champs);
    ecrireSessionStockee({ jeton, utilisateur });
    set({ jeton, utilisateur });
    return utilisateur;
  },

  async deconnexion() {
    try {
      await authService.deconnexion();
    } catch {
      // la session locale est effacée même si le serveur est injoignable
    }
    get().terminerSession();
  },

  terminerSession() {
    ecrireSessionStockee(null);
    set({ jeton: null, utilisateur: null, pretDemarrage: true });
  },
}));

/**
 * Branche le client HTTP sur le store : il y lit le jeton à chaque requête et
 * y signale l'expiration de session. C'est le seul lien entre les deux.
 */
brancherSession({
  jeton: () => useAuthStore.getState().jeton,
  expiration: () => useAuthStore.getState().terminerSession(),
});

export default useAuthStore;
