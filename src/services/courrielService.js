import httpClient, { extraire } from './httpClient';

/**
 * Courriels adressés aux membres.
 *
 * L'aperçu et l'envoi partagent les mêmes critères : le nombre annoncé avant
 * envoi est donc exactement celui obtenu.
 */
export const courrielService = {
  /** Qui sera atteint, et qui ne le sera pas faute d'adresse. */
  async apercu(criteres = {}) {
    return extraire(await httpClient.post('/courriels/apercu', { criteres }));
  },

  async envoyer({ objet, contenu, criteres = {} }) {
    return extraire(await httpClient.post('/courriels', { objet, contenu, criteres }));
  },

  async historique(page = 1) {
    return extraire(await httpClient.get('/courriels', { params: { page } }));
  },

  async consulter(id) {
    return extraire(await httpClient.get(`/courriels/${id}`));
  },
};

export default courrielService;
