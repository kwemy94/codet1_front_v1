import httpClient, { extraire } from './httpClient';

/** Espace personnel : le serveur ne renvoie que les données du membre connecté. */
export const espaceMembreService = {
  async tableauDeBord() {
    return extraire(await httpClient.get('/mon-espace/tableau-de-bord'));
  },

  async profil() {
    return extraire(await httpClient.get('/mon-espace/profil'));
  },

  async modifierProfil(champs) {
    return extraire(await httpClient.patch('/mon-espace/profil', champs));
  },

  async mesCartes() {
    return extraire(await httpClient.get('/mon-espace/cartes'));
  },

  async mesPaiements(page = 1) {
    return (await httpClient.get('/mon-espace/paiements', { params: { page } })).data;
  },

  async mesContributions() {
    return extraire(await httpClient.get('/mon-espace/contributions'));
  },
};

export default espaceMembreService;
