import httpClient, { extraire } from './httpClient';

export const carteService = {
  async lister(filtres = {}) {
    return (await httpClient.get('/cartes', { params: filtres })).data;
  },

  async consulter(id) {
    return extraire(await httpClient.get(`/cartes/${id}`));
  },

  async emettre({ membreId, exerciceId, typeCarteId }) {
    return extraire(
      await httpClient.post('/cartes', {
        membre_id: membreId,
        exercice_id: exerciceId,
        type_carte_id: typeCarteId,
      }),
    );
  },

  /**
   * Données d'impression de la carte unique de développement.
   * Le serveur refuse si la carte n'est pas soldée ou si l'exercice est clôturé.
   */
  async donneesImpression(id) {
    return extraire(await httpClient.get(`/cartes/${id}/impression`));
  },

  async impayes(filtres = {}) {
    return (await httpClient.get('/cartes/impayes', { params: filtres })).data;
  },
};

export default carteService;
