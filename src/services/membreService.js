import httpClient, { extraire } from './httpClient';

export const membreService = {
  async lister(filtres = {}) {
    const reponse = await httpClient.get('/membres', { params: filtres });
    return reponse.data; // réponse paginée : { data, meta, links }
  },

  async consulter(id) {
    return extraire(await httpClient.get(`/membres/${id}`));
  },

  async creer(membre) {
    return extraire(await httpClient.post('/membres', membre));
  },

  async modifier(id, membre) {
    return extraire(await httpClient.put(`/membres/${id}`, membre));
  },

  /**
   * Suspension : réversible, elle sort le membre des listes actives et ferme
   * son accès. Ses cotisations et ses dons restent aux comptes du comité.
   */
  async suspendre(id, motif) {
    return extraire(await httpClient.post(`/membres/${id}/suspendre`, { motif }));
  },

  async reactiver(id, motif) {
    return extraire(await httpClient.post(`/membres/${id}/reactiver`, { motif }));
  },

  /** Constat de décès : définitif, distinct d'une suspension. */
  async declarerDecede(id, dateDeces) {
    return extraire(await httpClient.post(`/membres/${id}/decede`, { date_deces: dateDeces }));
  },

  /**
   * Ouvre l'accès du membre à son espace personnel.
   * Le mot de passe provisoire n'est renvoyé qu'ici, une seule fois.
   */
  async creerAcces(id) {
    return extraire(await httpClient.post(`/membres/${id}/compte`));
  },

  async reinitialiserMotDePasse(id) {
    return extraire(await httpClient.post(`/membres/${id}/compte/reinitialiser`));
  },

  async suspendreAcces(id) {
    return extraire(await httpClient.post(`/membres/${id}/compte/suspendre`));
  },
};

export default membreService;
