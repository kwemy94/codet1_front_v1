import httpClient, { extraire } from "./httpClient";

export const paiementService = {
  async lister(filtres = {}) {
    return (await httpClient.get("/paiements", { params: filtres })).data;
  },

  async consulter(id) {
    return extraire(await httpClient.get(`/paiements/${id}`));
  },

  /** Paiement mobile money déclenché par le membre. */
  async initier({
    carteId,
    contributionId,
    montant,
    moyenPaiement,
    numeroTelephone,
  }) {
    return extraire(
      await httpClient.post("/paiements/initier", {
        carte_developpement_id: carteId ?? null,
        contribution_id: contributionId ?? null,
        montant,
        moyen_paiement: moyenPaiement,
        numero_telephone: numeroTelephone,
      }),
    );
  },

  /** Encaissement hors ligne saisi par un administrateur. */
  async enregistrerManuel({
    carteId,
    contributionId,
    moyenPaiementId,
    montant,
    observation,
  }) {
    return extraire(
      await httpClient.post("/paiements/manuel", {
        carte_developpement_id: carteId ?? null,
        contribution_id: contributionId ?? null,
        moyen_paiement_id: moyenPaiementId,
        montant,
        observation,
      }),
    );
  },

  /**
   * Encaissement groupé de plusieurs cartes.
   * `mode` vaut « solde » (chaque carte réglée de ce qu'il lui reste) ou
   * « montant » (même somme appliquée à chacune, plafonnée au solde).
   */
  async encaisserEnLot({
    carteIds,
    moyenPaiementId,
    mode = "solde",
    montant,
    observation,
  }) {
    return extraire(
      await httpClient.post("/paiements/lot", {
        carte_ids: carteIds,
        moyen_paiement_id: moyenPaiementId,
        mode,
        montant: mode === "montant" ? montant : undefined,
        observation,
      }),
    );
  },

  /** Interrogation du statut pendant l'attente de la confirmation opérateur. */
  async statut(id) {
    return extraire(await httpClient.get(`/paiements/${id}/statut`));
  },

  async annuler(id, motif) {
    return extraire(
      await httpClient.post(`/paiements/${id}/annuler`, { motif }),
    );
  },
};

export default paiementService;
