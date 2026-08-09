import httpClient, { extraire } from './httpClient';

export const tarifService = {
  async lister(filtres = {}) {
    return extraire(await httpClient.get('/tarifs', { params: filtres }));
  },

  /**
   * Enregistre une nouvelle version du tarif. La version précédente est
   * clôturée côté serveur : les cartes déjà émises conservent leur montant.
   *
   * `repartitions` est une liste { destinationId, montant } dont la somme doit
   * égaler le montant minimum — une seule ligne suffit si la totalité revient
   * à une même destination.
   */
  async enregistrerVersion(tarif) {
    return extraire(
      await httpClient.post('/tarifs', {
        exercice_id: tarif.exerciceId,
        type_carte_id: tarif.typeCarteId,
        categorie_membre_id: tarif.categorieId ?? null,
        montant_minimum: tarif.montantMinimum,
        repartitions: tarif.repartitions.map((ligne) => ({
          destination_fonds_id: ligne.destinationId,
          montant: ligne.montant,
        })),
      }),
    );
  },

  async historique(filtres = {}) {
    return extraire(
      await httpClient.get('/tarifs/historique', {
        params: {
          type_carte_id: filtres.typeCarteId,
          categorie_membre_id: filtres.categorieId,
        },
      }),
    );
  },
};

export default tarifService;
