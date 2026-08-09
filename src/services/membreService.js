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

  async suspendre(id) {
    return extraire(await httpClient.post(`/membres/${id}/suspendre`));
  },

  async reactiver(id) {
    return extraire(await httpClient.post(`/membres/${id}/reactiver`));
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
