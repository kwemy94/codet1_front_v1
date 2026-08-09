import httpClient, { extraire } from './httpClient';

export const contributionService = {
  async lister(filtres = {}) {
    return extraire(await httpClient.get('/contributions', { params: filtres }));
  },

  async consulter(id) {
    return extraire(await httpClient.get(`/contributions/${id}`));
  },

  async enregistrer(contribution) {
    return extraire(
      await httpClient.post('/contributions', {
        membre_id: contribution.membreId ?? null,
        donateur_id: contribution.donateurId ?? null,
        type_contribution_id: contribution.typeId,
        exercice_id: contribution.exerciceId,
        date_contribution: contribution.date,
        nature: contribution.nature ?? 'financier',
        designation: contribution.designation ?? null,
        montant: contribution.montant,
        motif: contribution.motif,
        observation: contribution.observation,
      }),
    );
  },

  /**
   * Met à jour le statut. « reçue » ne vaut que pour un don matériel ou en
   * services : une contribution financière devient encaissée par son paiement.
   */
  async changerStatut(id, { statut, dateReception, observation } = {}) {
    return extraire(
      await httpClient.patch(`/contributions/${id}/statut`, {
        statut,
        date_reception: dateReception ?? null,
        observation: observation ?? null,
      }),
    );
  },

  async annuler(id, motif) {
    return extraire(await httpClient.post(`/contributions/${id}/annuler`, { motif }));
  },

  async listerDonateurs() {
    return extraire(await httpClient.get('/donateurs'));
  },

  async creerDonateur(donateur) {
    return extraire(
      await httpClient.post('/donateurs', {
        denomination: donateur.denomination,
        categorie_donateur: donateur.categorie,
        telephone: donateur.telephone,
        email: donateur.email,
        pays: donateur.pays,
        adresse: donateur.adresse,
      }),
    );
  },
};

export default contributionService;
