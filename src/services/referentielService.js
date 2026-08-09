import httpClient, { extraire } from './httpClient';

/**
 * Référentiels paramétrables (catégories, moyens de paiement, destinations…).
 * Ils changent rarement : le résultat est conservé en mémoire pour la session.
 */
let cache = null;

export const referentielService = {
  async tout({ rafraichir = false } = {}) {
    if (cache && !rafraichir) return cache;
    cache = extraire(await httpClient.get('/referentiels'));
    return cache;
  },

  async villes(paysId) {
    return extraire(
      await httpClient.get('/referentiels/villes', { params: paysId ? { pays_id: paysId } : {} }),
    );
  },

  async parametres() {
    return extraire(await httpClient.get('/parametres'));
  },

  async modifierParametre(id, valeur) {
    const parametre = extraire(await httpClient.patch(`/parametres/${id}`, { valeur }));
    cache = null;
    return parametre;
  },

  viderCache() {
    cache = null;
  },
};

export default referentielService;
