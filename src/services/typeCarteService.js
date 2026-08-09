import httpClient, { extraire } from './httpClient';

/** Types de cartes et destinations des fonds (clés de répartition). */
export const typeCarteService = {
  async lister(filtres = {}) {
    return extraire(await httpClient.get('/types-cartes', { params: filtres }));
  },

  async creer({ libelle, description, obligatoire = false }) {
    return extraire(
      await httpClient.post('/types-cartes', { libelle, description, obligatoire }),
    );
  },

  async modifier(id, champs) {
    return extraire(await httpClient.patch(`/types-cartes/${id}`, champs));
  },

  async destinations() {
    return extraire(await httpClient.get('/destinations-fonds'));
  },

  /** Le taux détermine ce qui revient au CODET I sur cette destination. */
  async modifierDestination(id, champs) {
    return extraire(await httpClient.patch(`/destinations-fonds/${id}`, champs));
  },
};

export default typeCarteService;
